const express = require('express');
const router = express.Router();
const db = require('../config/database');
const gmailService = require('../services/gmailService');
const emailProcessor = require('../services/emailProcessor');

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let whereClause = 'WHERE e.user_id = ?';
    let params = [userId];

    if (filter !== 'all') {
      const categoryMap = {
        important: 'ea.importance_score >= 70',
        jobs: 'ea.category = "JOB"',
        travel: 'ea.category = "TRAVEL"',
        interviews: 'ea.category = "INTERVIEW"',
        deadlines: 'ea.category = "DEADLINE"'
      };

      if (categoryMap[filter]) {
        whereClause += ' AND ' + categoryMap[filter];
      }
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM emails e 
       LEFT JOIN email_analysis ea ON e.id = ea.email_id 
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [emails] = await db.query(
      `SELECT e.id, e.gmail_message_id, e.sender_email, e.sender_name, 
              e.subject, e.snippet, e.received_at, e.is_processed,
              ea.category, ea.importance_score, ea.summary, ea.action_required
       FROM emails e
       LEFT JOIN email_analysis ea ON e.id = ea.email_id
       ${whereClause}
       ORDER BY e.received_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      emails,
      page,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error listing emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const emailId = req.params.id;

    const [emails] = await db.query(
      'SELECT * FROM emails WHERE id = ? AND user_id = ?',
      [emailId, userId]
    );

    if (emails.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const email = emails[0];

    const [analysis] = await db.query(
      'SELECT * FROM email_analysis WHERE email_id = ?',
      [emailId]
    );

    res.json({
      email,
      analysis: analysis[0] || null
    });
  } catch (error) {
    console.error('Error getting email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const userId = req.user.id;

    const [accounts] = await db.query(
      'SELECT * FROM gmail_accounts WHERE user_id = ?',
      [userId]
    );

    if (accounts.length === 0) {
      return res.status(400).json({ error: 'No Gmail account connected' });
    }

    const account = accounts[0];
    const tokens = {
      access_token: account.refresh_token,
      refresh_token: account.refresh_token,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      token_type: 'Bearer'
    };

    const gmail = require('../services/gmailService');
    const gmailServiceInstance = new gmail(tokens);

    let messages = await gmailServiceInstance.fetchMessages(userId, {
      maxResults: 100,
      query: 'is:unread OR is:important'
    });

    let processed = 0;
    let errors = 0;

    for (const msg of messages) {
      try {
        const [existing] = await db.query(
          'SELECT id FROM emails WHERE gmail_message_id = ? AND user_id = ?',
          [msg.id, userId]
        );

        if (existing.length > 0) continue;

        const fullMsg = await gmailServiceInstance.fetchMessageDetails(msg.id);
        const parsed = gmailServiceInstance.parseMessagePayload(fullMsg.payload);

        const [result] = await db.query(
          `INSERT INTO emails (user_id, gmail_message_id, gmail_thread_id, sender_email, sender_name, subject, snippet, body, received_at, is_processed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            fullMsg.id,
            fullMsg.threadId,
            parsed.from,
            '',
            parsed.subject,
            parsed.snippet,
            parsed.body,
            new Date(parseInt(fullMsg.internalDate)),
            false
          ]
        );

        const emailId = result.insertId;

        const analysis = await emailProcessor.analyzeEmail({
          headers: parsed.headers,
          body: parsed.body,
          snippet: parsed.snippet,
          subject: parsed.subject,
          from: parsed.from,
          to: parsed.to,
          date: parsed.date
        });

        await db.query(
          `INSERT INTO email_analysis (email_id, category, importance_score, summary, action_required, action_text, company, role, event_date, entities, confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            emailId,
            analysis.category,
            analysis.importance_score,
            analysis.summary,
            analysis.action_required,
            analysis.action_text,
            analysis.company,
            analysis.role,
            analysis.event_date,
            JSON.stringify(analysis.entities),
            analysis.confidence
          ]
        );

        await db.query(
          'UPDATE emails SET body = ?, is_processed = TRUE WHERE id = ?',
          [parsed.body, emailId]
        );

        await createEntitiesFromAnalysis(userId, emailId, analysis);

        processed++;
      } catch (err) {
        errors++;
        console.error(`Error processing message ${msg.id}:`, err.message);
      }
    }

    await db.query(
      'UPDATE gmail_accounts SET last_synced_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );

    res.json({
      message: 'Sync completed',
      processed,
      total: messages.length,
      errors
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
});

async function createEntitiesFromAnalysis(userId, emailId, analysis) {
  try {
    if (analysis.category === 'JOB' || analysis.category === 'INTERVIEW') {
      await db.query(
        `INSERT INTO jobs (user_id, company, role, status, source_email_id, application_date)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         company = VALUES(company), role = VALUES(role), status = VALUES(status)`,
        [
          userId,
          analysis.company || '',
          analysis.role || '',
          analysis.category === 'INTERVIEW' ? 'INTERVIEW' : 'DISCOVERED',
          emailId,
          analysis.event_date ? new Date(analysis.event_date).toISOString().split('T')[0] : null
        ]
      );
    }

    if (analysis.category === 'TRAVEL') {
      await db.query(
        `INSERT INTO trips (user_id, title, destination, start_date, end_date, source_email_id)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         title = VALUES(title), destination = VALUES(destination)`,
        [
          userId,
          analysis.entities?.confirmation_number || 'Trip',
          analysis.entities?.location || '',
          analysis.event_date ? new Date(analysis.event_date).toISOString().split('T')[0] : null,
          analysis.event_date ? new Date(analysis.event_date).toISOString().split('T')[0] : null,
          emailId
        ]
      );
    }

    if (analysis.action_required && analysis.event_date) {
      await db.query(
        `INSERT INTO tasks (user_id, title, description, due_date, priority, source_email_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          analysis.action_text || 'Action required',
          analysis.summary,
          new Date(analysis.event_date).toISOString().split('T')[0],
          analysis.importance_score > 80 ? 'HIGH' : 'MEDIUM',
          emailId
        ]
      );
    }

    if (analysis.category === 'MEETING' || analysis.category === 'INTERVIEW') {
      await db.query(
        `INSERT INTO events (user_id, title, event_type, start_time, end_time, location, source_email_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          analysis.summary || 'Meeting',
          analysis.category,
          analysis.event_date ? new Date(analysis.event_date).toISOString() : null,
          analysis.event_date ? new Date(new Date(analysis.event_date).getTime() + 3600000).toISOString() : null,
          analysis.entities?.location || '',
          emailId
        ]
      );
    }
  } catch (error) {
    console.error('Error creating entities from analysis:', error);
  }
}

router.post('/:id/process', async (req, res) => {
  try {
    const userId = req.user.id;
    const emailId = req.params.id;

    const [emails] = await db.query(
      'SELECT * FROM emails WHERE id = ? AND user_id = ?',
      [emailId, userId]
    );

    if (emails.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const email = emails[0];

    const [analysis] = await db.query(
      'SELECT * FROM email_analysis WHERE email_id = ?',
      [emailId]
    );

    if (analysis.length > 0) {
      return res.json({ status: 'already_processed', analysis: analysis[0] });
    }

    const [accounts] = await db.query(
      'SELECT * FROM gmail_accounts WHERE user_id = ?',
      [userId]
    );

    if (accounts.length === 0) {
      return res.status(400).json({ error: 'No Gmail account connected' });
    }

    const account = accounts[0];
    const tokens = {
      access_token: account.refresh_token,
      refresh_token: account.refresh_token
    };

    const gmail = require('../services/gmailService');
    const gmailServiceInstance = new gmail(tokens);

    const msgDetails = await gmailServiceInstance.fetchMessageDetails(email.gmail_message_id);
    const parsed = gmailServiceInstance.parseMessagePayload(msgDetails.payload);

    await db.query(
      'UPDATE emails SET body = ?, is_processed = TRUE WHERE id = ?',
      [parsed.body, emailId]
    );

    const aiResult = await emailProcessor.analyzeEmail({
      headers: parsed.headers,
      body: parsed.body,
      snippet: parsed.snippet,
      subject: parsed.subject,
      from: parsed.from,
      to: parsed.to,
      date: parsed.date
    });

    await db.query(
      `INSERT INTO email_analysis (email_id, category, importance_score, summary, action_required, action_text, company, role, event_date, entities, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emailId,
        aiResult.category,
        aiResult.importance_score,
        aiResult.summary,
        aiResult.action_required,
        aiResult.action_text,
        aiResult.company,
        aiResult.role,
        aiResult.event_date,
        JSON.stringify(aiResult.entities),
        aiResult.confidence
      ]
    );

    await createEntitiesFromAnalysis(userId, emailId, aiResult);

    res.json({ status: 'processed', analysis: aiResult });
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
});

module.exports = router;
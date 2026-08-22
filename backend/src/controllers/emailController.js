const db = require('../config/database');
const gmailService = require('../services/gmailService');
const emailProcessor = require('../services/emailProcessor');

const emailController = {};

emailController.listEmails = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (filter !== 'all') {
      const categoryMap = {
        important: 'importance_score >= 70',
        jobs: 'EXISTS (SELECT 1 FROM email_analysis ea WHERE ea.email_id = e.id AND ea.category = "JOB")',
        travel: 'EXISTS (SELECT 1 FROM email_analysis ea WHERE ea.email_id = e.id AND ea.category = "TRAVEL")',
        interviews: 'EXISTS (SELECT 1 FROM email_analysis ea WHERE ea.email_id = e.id AND ea.category = "INTERVIEW")',
        deadlines: 'EXISTS (SELECT 1 FROM email_analysis ea WHERE ea.email_id = e.id AND ea.category = "DEADLINE")'
      };

      if (categoryMap[filter]) {
        whereClause += ' AND ' + categoryMap[filter];
      }
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM emails e ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [emails] = await db.query(
      `SELECT id, gmail_message_id, sender_email, subject, snippet, received_at, is_processed 
       FROM emails e ${whereClause}
       ORDER BY received_at DESC 
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
};

emailController.getEmail = async (req, res) => {
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

    // Get analysis if available
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
};

emailController.syncEmails = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stored Gmail account
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
      // In a real implementation, we'd refresh the token
    };

    // Fetch messages
    const messages = await gmailService.fetchMessages(tokens, userId, account.history_id);

    // Process messages in batches to avoid overwhelming the AI
    let processed = 0;
    let errors = 0;

    for (const message of messages) {
      try {
        const result = await emailProcessor.processEmail(userId, tokens, message);
        if (result.status === 'stored') {
          processed++;
        }
      } catch (err) {
        errors++;
        console.error(`Error processing message ${message.id}:`, err.message);
        // Continue with next email - one bad email should not stop the process
      }
    }

    // Update last synced time
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
};

emailController.processEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const emailId = req.params.id;

    // Get email details
    const [emails] = await db.query(
      'SELECT * FROM emails WHERE id = ? AND user_id = ?',
      [emailId, userId]
    );

    if (emails.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const email = emails[0];

    // Check if already processed
    const [analysis] = await db.query(
      'SELECT * FROM email_analysis WHERE email_id = ?',
      [emailId]
    );

    if (analysis.length > 0) {
      return res.json({ status: 'already_processed', analysis: analysis[0] });
    }

    // Get the tokens from the gmail_accounts table
    const [accounts] = await db.query(
      'SELECT * FROM gmail_accounts WHERE user_id = ?',
      [userId]
    );

    if (accounts.length === 0) {
      return res.status(400).json({ error: 'No Gmail account connected' });
    }

    const account = accounts[0];

    // Fetch full message details
    const gmailService = require('../services/gmailService');
    const tokens = {
      access_token: account.refresh_token
    };

    const msgDetails = await gmailService.fetchMessageDetails(tokens, userId, email.gmail_message_id);
    const parsed = gmailService.parseMessagePayload(msgDetails.payload);

    // Update email with full body
    await db.query(
      'UPDATE emails SET body = ?, is_processed = TRUE WHERE id = ?',
      [parsed.body, emailId]
    );

    // Analyze with AI
    const aiResult = await emailProcessor.analyzeEmail(userId, emailId, parsed.body || parsed.snippet);

    res.json({ status: 'processed', analysis: aiResult });
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
};

module.exports = emailController;
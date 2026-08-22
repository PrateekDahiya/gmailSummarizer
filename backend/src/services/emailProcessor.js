const db = require('../config/database');
const gmailService = require('./gmailService');
const aiService = require('./aiService');
const { cleanEmailContent } = require('./emailCleaner');

const emailProcessor = {};

emailProcessor.processEmail = async (userId, tokens, message) => {
  try {
    const msgDetails = await gmailService.fetchMessageDetails(tokens, userId, message.id);
    const parsed = gmailService.parseMessagePayload(msgDetails.payload);

    // Check if already processed
    const [existing] = await db.query(
      'SELECT id FROM emails WHERE user_id = ? AND gmail_message_id = ?',
      [userId, message.id]
    );

    if (existing.length > 0) {
      return { status: 'skipped', reason: 'already_processed' };
    }

    // Clean email content
    const cleanedBody = cleanEmailContent(parsed.body);
    const cleanedSnippet = cleanEmailContent(parsed.snippet);

    // Store email
    const [result] = await db.query(
      `INSERT INTO emails 
       (user_id, gmail_message_id, gmail_thread_id, sender_email, sender_name, subject, snippet, body, received_at, is_processed) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [userId, message.id, msgDetails.threadId, parsed.sender, '', parsed.subject, cleanedSnippet, cleanedBody, new Date()]
    );

    const emailId = result.insertId;

    // Process with AI if not already processed
    if (!msgDetails.is_processed) {
      await emailProcessor.analyzeEmail(userId, emailId, parsed.body || parsed.snippet);
    }

    return { status: 'stored', emailId };
  } catch (error) {
    console.error('Error processing email:', error);
    return { status: 'error', error: error.message };
  }
};

emailProcessor.analyzeEmail = async (userId, emailId, content) => {
  try {
    const aiResult = await aiService.extractEntities(content);

    // Validate AI response
    if (!aiResult || !aiResult.category) {
      throw new Error('Invalid AI response');
    }

    // Determine importance score using deterministic rules
    const importanceScore = emailProcessor.calculateImportance(aiResult.category, aiResult.summary);

    // Store analysis
    await db.query(
      `INSERT INTO email_analysis 
       (email_id, category, importance_score, summary, action_required, action_text, company, role, event_date, confidence) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emailId,
        aiResult.category,
        importanceScore,
        aiResult.summary,
        aiResult.action_required,
        aiResult.action_text,
        aiResult.company,
        aiResult.role,
        aiResult.event_date,
        aiResult.confidence
      ]
    );

    // Create job record if category is JOB
    if (aiResult.category === 'JOB') {
      await emailProcessor.createJobRecord(userId, emailId, aiResult);
    }

    // Create task if action required
    if (aiResult.action_required) {
      await emailProcessor.createTask(userId, emailId, aiResult);
    }

    // Create trip if category is TRAVEL
    if (aiResult.category === 'TRAVEL') {
      await emailProcessor.createTrip(userId, emailId, aiResult);
    }

    return { status: 'analyzed', ...aiResult };
  } catch (error) {
    console.error('Error analyzing email:', error);
    throw error;
  }
};

emailProcessor.calculateImportance = (category, summary) => {
  const highPriorityPatterns = [
    'Interview invitation',
    'Job opportunity',
    'Deadline',
    'Flight confirmation',
    'Payment failure'
  ];

  const mediumPriorityPatterns = [
    'Meeting',
    'Document request'
  ];

  const lowPriorityPatterns = [
    'Newsletter',
    'Marketing',
    'Promotional email'
  ];

  let score = 50; // default medium

  const lowerSummary = summary.toLowerCase();

  // Check deterministic rules first
  for (const pattern of highPriorityPatterns) {
    if (lowerSummary.includes(pattern.toLowerCase())) {
      return 90;
    }
  }

  for (const pattern of mediumPriorityPatterns) {
    if (lowerSummary.includes(pattern.toLowerCase())) {
      return 70;
    }
  }

  for (const pattern of lowPriorityPatterns) {
    if (lowerSummary.includes(pattern.toLowerCase())) {
      return 30;
    }
  }

  // AI category based
  if (category === 'JOB' || category === 'INTERVIEW') {
    return 85;
  }

  if (category === 'TRAVEL') {
    return 80;
  }

  if (category === 'MEETING') {
    return 65;
  }

  return 40;
};

emailProcessor.createJobRecord = async (userId, emailId, aiResult) => {
  const [existing] = await db.query(
    'SELECT id FROM jobs WHERE user_id = ? AND company = ?',
    [userId, aiResult.company]
  );

  if (existing.length > 0) {
    return;
  }

  await db.query(
    `INSERT INTO jobs (user_id, company, role, status, source_email_id) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, aiResult.company, aiResult.role || 'Unknown', 'DISCOVERED', emailId]
  );
};

emailProcessor.createTask = async (userId, emailId, aiResult) => {
  const [existing] = await db.query(
    'SELECT id FROM tasks WHERE user_id = ? AND title = ?',
    [userId, aiResult.action_text || '']
  );

  if (existing.length > 0) {
    return;
  }

  let dueDate = null;
  if (aiResult.event_date) {
    dueDate = new Date(aiResult.event_date);
  }

  await db.query(
    `INSERT INTO tasks (user_id, title, description, due_date, priority, source_email_id) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      aiResult.action_text || 'Action required',
      aiResult.summary || '',
      dueDate,
      aiResult.priority || 'MEDIUM',
      emailId
    ]
  );
};

emailProcessor.createTrip = async (userId, emailId, aiResult) => {
  // Check if a trip with this destination already exists
  const [existingTrips] = await db.query(
    'SELECT * FROM trips WHERE user_id = ? AND destination = ?',
    [userId, aiResult.entities?.location]
  );

  if (existingTrips.length > 0) {
    // Update the existing trip's dates if needed
    const startDate = new Date(aiResult.event_date);
    const endDate = startDate;
    await db.query(
      'UPDATE trips SET start_date = ?, end_date = ? WHERE id = ?',
      [startDate, endDate, existingTrips[0].id]
    );
    return;
  }

  // Create new trip
  let startDate = null;
  let endDate = null;
  if (aiResult.event_date) {
    const date = new Date(aiResult.event_date);
    startDate = date;
    endDate = date;
  }

  await db.query(
    `INSERT INTO trips (user_id, title, destination, start_date, end_date) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, aiResult.summary || 'Trip', aiResult.entities?.location || 'Unknown', startDate, endDate]
  );
};

module.exports = emailProcessor;
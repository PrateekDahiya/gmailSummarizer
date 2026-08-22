const db = require('../config/database');

const dashboardController = {};

dashboardController.getToday = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get urgent items (high importance emails, interviews, deadlines)
    const [urgent] = await db.query(
      `SELECT e.id, e.subject, e.sender_email, e.received_at, ea.importance_score, ea.category, ea.summary
       FROM emails e
       LEFT JOIN email_analysis ea ON e.id = ea.email_id
       WHERE e.user_id = ?
       ORDER BY ea.importance_score DESC
       LIMIT 5`,
      [userId]
    );

    // Get upcoming events/interviews
    const [upcoming] = await db.query(
      `SELECT e.id, e.subject, e.sender_email, e.received_at, ea.importance_score, ea.category, ea.event_date
       FROM emails e
       LEFT JOIN email_analysis ea ON e.id = ea.email_id
       WHERE e.user_id = ? AND ea.event_date > NOW()
       ORDER BY ea.event_date ASC
       LIMIT 5`,
      [userId]
    );

    // Get jobs
    const [jobs] = await db.query(
      `j.id, j.company, j.role, j.status, j.interview_date, ea.importance_score, ea.summary
       FROM jobs j
       LEFT JOIN email_analysis ea ON j.source_email_id = ea.email_id
       WHERE j.user_id = ?
       ORDER BY j.interview_date ASC
       LIMIT 5`,
      [userId]
    );

    // Get trips
    const [trips] = await db.query(
      `SELECT * FROM trips WHERE user_id = ?
       ORDER BY start_date ASC
       LIMIT 5`,
      [userId]
    );

    // Get tasks
    const [tasks] = await db.query(
      `SELECT * FROM tasks WHERE user_id = ? AND completed = FALSE
       ORDER BY due_date ASC
       LIMIT 10`,
      [userId]
    );

    // Get important emails
    const [importantEmails] = await db.query(
      `SELECT e.id, e.subject, e.sender_email, e.received_at, ea.importance_score, ea.category
       FROM emails e
       LEFT JOIN email_analysis ea ON e.id = ea.email_id
       WHERE e.user_id = ? AND ea.importance_score >= 70
       ORDER BY ea.importance_score DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      urgent: urgent.map(row => ({
        id: row.id,
        subject: row.subject,
        sender: row.sender_email,
        date: row.received_at,
        importance: row.importance_score,
        category: row.category,
        summary: row.summary
      })) || [],
      upcoming: upcoming.map(row => ({
        id: row.id,
        subject: row.subject,
        sender: row.sender_email,
        date: row.event_date,
        importance: row.importance_score
      })) || [],
      jobs: jobs.map(row => ({
        id: row.id,
        company: row.company,
        role: row.role,
        status: row.status,
        interviewDate: row.interview_date
      })) || [],
      trips: trips.map(row => ({
        id: row.id,
        title: row.title,
        destination: row.destination,
        startDate: row.start_date,
        endDate: row.end_date
      })) || [],
      tasks: tasks.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        dueDate: row.due_date,
        priority: row.priority
      })) || [],
      importantEmails: importantEmails.map(row => ({
        id: row.id,
        subject: row.subject,
        sender: row.sender_email,
        date: row.received_at,
        importance: row.importance_score,
        category: row.category
      })) || []
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

module.exports = dashboardController;
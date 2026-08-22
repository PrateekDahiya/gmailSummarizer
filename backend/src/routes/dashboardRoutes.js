const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/today', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const urgent = await db.query(
      `SELECT e.id, e.subject, e.sender_email, e.received_at, ea.summary, ea.importance_score, ea.action_text
       FROM emails e
       JOIN email_analysis ea ON e.id = ea.email_id
       WHERE e.user_id = ? AND ea.importance_score >= 70 AND ea.action_required = TRUE
       ORDER BY ea.importance_score DESC, e.received_at DESC
       LIMIT 5`,
      [userId]
    );

    const upcoming = await db.query(
      `SELECT e.id, e.subject, e.received_at, ea.event_date, ea.summary, ea.category
       FROM emails e
       JOIN email_analysis ea ON e.id = ea.email_id
       WHERE e.user_id = ? AND ea.event_date IS NOT NULL AND ea.event_date >= ?
       ORDER BY ea.event_date ASC
       LIMIT 5`,
      [userId, today.toISOString().split('T')[0]]
    );

    const jobs = await db.query(
      `SELECT id, company, role, status, interview_date
       FROM jobs
       WHERE user_id = ? AND status IN ('INTERVIEW', 'ASSESSMENT', 'SHORTLISTED', 'APPLIED')
       ORDER BY interview_date ASC, created_at DESC
       LIMIT 5`,
      [userId]
    );

    const trips = await db.query(
      `SELECT id, title, destination, start_date, end_date
       FROM trips
       WHERE user_id = ? AND start_date >= ?
       ORDER BY start_date ASC
       LIMIT 3`,
      [userId, today.toISOString().split('T')[0]]
    );

    const tasks = await db.query(
      `SELECT id, title, description, due_date, priority, completed
       FROM tasks
       WHERE user_id = ? AND completed = FALSE AND due_date >= ?
       ORDER BY due_date ASC
       LIMIT 5`,
      [userId, today.toISOString().split('T')[0]]
    );

    const importantEmails = await db.query(
      `SELECT e.id, e.subject, e.sender_email, e.received_at, ea.summary, ea.importance_score, ea.category
       FROM emails e
       JOIN email_analysis ea ON e.id = ea.email_id
       WHERE e.user_id = ? AND ea.importance_score >= 60
       ORDER BY ea.importance_score DESC, e.received_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      urgent: urgent.map(u => ({
        id: u.id,
        title: u.subject,
        from: u.sender_email,
        time: u.received_at,
        summary: u.summary,
        importance: u.importance_score,
        action: u.action_text
      })),
      upcoming: upcoming.map(u => ({
        id: u.id,
        title: u.subject,
        date: u.event_date,
        summary: u.summary,
        category: u.category
      })),
      jobs: jobs.map(j => ({
        id: j.id,
        company: j.company,
        role: j.role,
        status: j.status,
        interviewDate: j.interview_date
      })),
      trips: trips.map(t => ({
        id: t.id,
        title: t.title,
        destination: t.destination,
        startDate: t.start_date,
        endDate: t.end_date
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: t.due_date,
        priority: t.priority,
        completed: t.completed
      })),
      importantEmails: importantEmails.map(e => ({
        id: e.id,
        subject: e.subject,
        from: e.sender_email,
        received: e.received_at,
        summary: e.summary,
        importance: e.importance_score,
        category: e.category
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
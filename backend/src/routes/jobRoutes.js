const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [jobs] = await db.query(
      `SELECT id, company, role, status, application_date, interview_date, created_at
       FROM jobs
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;

    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE id = ? AND user_id = ?',
      [jobId, userId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(jobs[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;
    const { status, role, company, interview_date } = req.body;

    const [result] = await db.query(
      `UPDATE jobs SET 
        status = COALESCE(?, status),
        role = COALESCE(?, role),
        company = COALESCE(?, company),
        interview_date = COALESCE(?, interview_date),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [status, role, company, interview_date, jobId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const [updated] = await db.query(
      'SELECT * FROM jobs WHERE id = ?',
      [jobId]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, role, status, application_date, interview_date } = req.body;

    const [result] = await db.query(
      `INSERT INTO jobs (user_id, company, role, status, application_date, interview_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, company, role, status || 'DISCOVERED', application_date, interview_date]
    );

    const [job] = await db.query(
      'SELECT * FROM jobs WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(job[0]);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

module.exports = router;
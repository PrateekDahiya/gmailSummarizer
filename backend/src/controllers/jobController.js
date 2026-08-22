const db = require('../config/database');

const jobController = {};

jobController.listJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    const [jobs] = await db.query(
      `SELECT j.*, ea.category, ea.importance_score, ea.summary
       FROM jobs j
       LEFT JOIN email_analysis ea ON j.source_email_id = ea.email_id
       WHERE j.user_id = ?
       ORDER BY 
         CASE j.status
           WHEN 'INTERVIEW' THEN 1
           WHEN 'ASSESSMENT' THEN 2
           WHEN 'SHORTLISTED' THEN 3
           WHEN 'APPLIED' THEN 4
           WHEN 'DISCOVERED' THEN 5
           ELSE 6
         END`,
      [userId]
    );

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

jobController.getJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;

    const [jobs] = await db.query(
      `SELECT j.*, ea.category, ea.importance_score, ea.summary
       FROM jobs j
       LEFT JOIN email_analysis ea ON j.source_email_id = ea.email_id
       WHERE j.id = ? AND j.user_id = ?`,
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
};

module.exports = jobController;
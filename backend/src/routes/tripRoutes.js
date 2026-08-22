const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [trips] = await db.query(
      `SELECT id, title, destination, start_date, end_date, created_at
       FROM trips
       WHERE user_id = ?
       ORDER BY start_date ASC`,
      [userId]
    );
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    const [trips] = await db.query(
      'SELECT * FROM trips WHERE id = ? AND user_id = ?',
      [tripId, userId]
    );

    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const [events] = await db.query(
      `SELECT id, title, event_type, start_time, end_time, location
       FROM events
       WHERE source_trip_id = ? AND user_id = ?
       ORDER BY start_time ASC`,
      [tripId, userId]
    );

    const [emails] = await db.query(
      `SELECT e.id, e.subject, e.received_at, ea.summary
       FROM emails e
       JOIN email_analysis ea ON e.id = ea.email_id
       WHERE ea.category = 'TRAVEL' AND e.user_id = ?
       ORDER BY e.received_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({ ...trips[0], events, relatedEmails: emails });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;
    const { title, destination, start_date, end_date } = req.body;

    const [result] = await db.query(
      `UPDATE trips SET 
        title = COALESCE(?, title),
        destination = COALESCE(?, destination),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date)
       WHERE id = ? AND user_id = ?`,
      [title, destination, start_date, end_date, tripId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const [updated] = await db.query(
      'SELECT * FROM trips WHERE id = ?',
      [tripId]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, destination, start_date, end_date } = req.body;

    const [result] = await db.query(
      `INSERT INTO trips (user_id, title, destination, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, destination, start_date, end_date]
    );

    const [trip] = await db.query(
      'SELECT * FROM trips WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(trip[0]);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

module.exports = router;
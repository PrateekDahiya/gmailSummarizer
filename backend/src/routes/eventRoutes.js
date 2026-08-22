const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [events] = await db.query(
      `SELECT id, title, event_type, start_time, end_time, location, source_email_id, created_at
       FROM events
       WHERE user_id = ?
       ORDER BY start_time ASC`,
      [userId]
    );
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const [events] = await db.query(
      'SELECT * FROM events WHERE id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(events[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;
    const { title, event_type, start_time, end_time, location } = req.body;

    const [result] = await db.query(
      `UPDATE events SET 
        title = COALESCE(?, title),
        event_type = COALESCE(?, event_type),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        location = COALESCE(?, location)
       WHERE id = ? AND user_id = ?`,
      [title, event_type, start_time, end_time, location, req.params.id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const [updated] = await db.query(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, event_type, start_time, end_time, location, source_email_id } = req.body;

    const [result] = await db.query(
      `INSERT INTO events (user_id, title, event_type, start_time, end_time, location, source_email_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, event_type, start_time, end_time, location, source_email_id]
    );

    const [event] = await db.query(
      'SELECT * FROM events WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(event[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

module.exports = router;
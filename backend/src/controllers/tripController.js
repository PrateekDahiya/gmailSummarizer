const db = require('../config/database');

const tripController = {};

tripController.listTrips = async (req, res) => {
  try {
    const userId = req.user.id;

    const [trips] = await db.query(
      `SELECT * FROM trips WHERE user_id = ? ORDER BY start_date ASC`,
      [userId]
    );

    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

tripController.getTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    const [trips] = await db.query(
      `SELECT * FROM trips WHERE id = ? AND user_id = ?`,
      [tripId, userId]
    );

    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Get related emails for this trip
    const [relatedEmails] = await db.query(
      `SELECT e.id, e.subject, e.snippet, e.received_at, ea.category, ea.importance_score
       FROM emails e
       LEFT JOIN email_analysis ea ON e.id = ea.email_id
       WHERE e.user_id = ?
       ORDER BY e.received_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      trip: trips[0],
      relatedEmails
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
};

module.exports = tripController;
const db = require('../config/database');
const google = require('../config/google');
const jwt = require('jsonwebtoken');

const authController = {};

authController.googleLogin = (req, res) => {
  const authUrl = google.generateAuthUrl();
  res.redirect(authUrl);
};

authController.googleCallback = async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await google.client.getToken(code);
    google.client.setCredentials(tokens.access_token);

    // Verify the ID token
    const profile = await google.verifyIdToken(tokens.id_token);

    // Find or create user
    const rows = await db.query(
      'SELECT * FROM users WHERE google_id = ?',
      [profile.googleId]
    );

    let user;
    if (rows.length > 0) {
      user = rows[0];
    } else {
      const googleId = profile.googleId ?? null;
      const email = profile.email ?? null;
      const name = profile.name ?? null;
      const pictureUrl = profile.pictureUrl ?? null;
      
      const result = await db.query(
        `INSERT INTO users (google_id, email, name, picture_url) 
         VALUES (?, ?, ?, ?)`,
        [googleId, email, name, pictureUrl]
      );
      user = { id: result.insertId, google_id: googleId, email, name, picture_url: pictureUrl };
    }

    // Create JWT
    const jwtToken = jwt.sign(
      { id: user.id, googleId: user.google_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store Gmail account
    const refreshToken = tokens.refresh_token ?? null;
    const historyId = tokens.history_id ?? null;
    const userEmail = profile.email ?? null;
    const userId = user.id ?? null;
    
    await db.query(
      `INSERT INTO gmail_accounts (user_id, gmail_email, refresh_token, history_id) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       refresh_token = VALUES(refresh_token), history_id = VALUES(history_id), last_synced_at = CURRENT_TIMESTAMP`,
      [userId, userEmail, refreshToken, historyId]
    );

    res.cookie('token', jwtToken, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 
  });
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    res.status(500).json({ error: 'Authentication failed', details: error.message, code: error.code });
  }
};

authController.getMe = (req, res) => {
  if (req.user) {
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

authController.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

module.exports = authController;
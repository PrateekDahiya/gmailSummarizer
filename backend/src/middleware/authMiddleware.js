const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = {
      id: decoded.id,
      googleId: decoded.googleId,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture
    };

    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        googleId: decoded.googleId,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      };
    }
    next();
  } catch (error) {
    // No valid token, continue without user
    req.user = null;
    next();
  }
};

module.exports = { authenticate, optionalAuth };
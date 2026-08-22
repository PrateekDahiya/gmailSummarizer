const express = require('express');
const router = express();
const authController = require('../controllers/authController');

router.get('/google', authController.googleLogin);
router.get('/callback', authController.googleCallback);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
const express = require('express');
const router = express();
const dashboardController = require('../controllers/dashboardController');

router.get('/today', dashboardController.getToday);

module.exports = router;
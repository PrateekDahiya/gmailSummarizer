const express = require('express');
const router = express();
const jobController = require('../controllers/jobController');

router.get('/', jobController.listJobs);
router.get('/:id', jobController.getJob);

module.exports = router;
const express = require('express');
const router = express();
const emailController = require('../controllers/emailController');

router.get('/', emailController.listEmails);
router.get('/:id', emailController.getEmail);
router.post('/sync', emailController.syncEmails);
router.post('/:id/process', emailController.processEmail);

module.exports = router;
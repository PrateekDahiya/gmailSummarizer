const express = require('express');
const router = express();
const tripController = require('../controllers/tripController');

router.get('/', tripController.listTrips);
router.get('/:id', tripController.getTrip);

module.exports = router;
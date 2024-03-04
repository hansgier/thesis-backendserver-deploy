const router = require('express').Router();
const populateMockData = require('../controllers/1populateController');


router.route('/').post(populateMockData);

module.exports = router;
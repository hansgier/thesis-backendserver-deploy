const { deleteMedia } = require("../controllers/mediaController");
const { authenticateUser, authorizePermission } = require("../middlewares/authentication");
const router = require('express').Router();


router.route('/').delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteMedia);

module.exports = router;
const { deleteMedia, deleteAllUnassociatedMedia } = require("../controllers/mediaController");
const { authenticateUser, authorizePermission } = require("../middlewares/authentication");
const router = require('express').Router();


router.route('/').delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteMedia);
router.route('/delete-unassociated').delete(authenticateUser, deleteAllUnassociatedMedia);

module.exports = router;
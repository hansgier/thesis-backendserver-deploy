const { authenticateUser, authorizePermission } = require("../middlewares/authentication");
const {
    postAnnouncement,
    getAllAnnouncements,
    deleteAllAnnouncements,
    getAnnouncement,
    editAnnouncement,
    deleteAnnouncement,
} = require("../controllers/announcementController");
const router = require('express').Router();

router.route('/')
    .get(authenticateUser, getAllAnnouncements)
    .post(authenticateUser, authorizePermission('admin', 'barangay'), postAnnouncement)
    .delete(authenticateUser, authorizePermission('admin', 'barangay'), deleteAllAnnouncements);

router.route('/:id')
    .get(authenticateUser, getAnnouncement)
    .patch(authenticateUser, authorizePermission('admin', 'barangay'), editAnnouncement)
    .delete(authenticateUser, authorizePermission('admin', 'barangay'), deleteAnnouncement);

module.exports = router;
const { authenticateUser, authorizePermission } = require("../middlewares/authentication");
const {
    postAnnouncement,
    getAllAnnouncements,
    deleteAllAnnouncements,
    getAnnouncement,
    editAnnouncement,
    deleteAnnouncement,
} = require("../controllers/announcementController");
const { checkAnnouncementsCache } = require("../middlewares/checkCache");
const router = require('express').Router();

router.route('/')
    .get(authenticateUser, checkAnnouncementsCache, getAllAnnouncements)
    .post(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), postAnnouncement)
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteAllAnnouncements);

router.route('/:id')
    .get(authenticateUser, getAnnouncement)
    .patch(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), editAnnouncement)
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteAnnouncement);

module.exports = router;
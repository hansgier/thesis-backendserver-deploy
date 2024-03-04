const router = require('express').Router();
const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');
const {
    getAllReports,
    deleteAllReports,
    deleteReport,
    updateReport,
    getReport,
} = require("../controllers/reportController");

router.route('/')
    .get(authenticateUser, authorizePermissions, getAllReports)
    .delete(authenticateUser, authorizePermissions, deleteAllReports);

router.route('/:id')
    .get(authenticateUser, authorizePermissions, getReport)
    .patch(authenticateUser, authorizePermissions, updateReport)
    .delete(authenticateUser, authorizePermissions, deleteReport);


module.exports = router;
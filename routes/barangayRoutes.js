const router = require('express').Router();
const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');
const {
    deleteAllBarangays,
    getAllBarangays,
    getBarangay,
    addBarangay,
    updateBarangay,
    deleteBarangay,
} = require('../controllers/barangayController');
const { checkBarangaysCache } = require("../middlewares/checkCache");

router.route('/')
    .get(checkBarangaysCache, getAllBarangays)
    .post(authenticateUser, authorizePermissions, addBarangay)
    .delete(authenticateUser, authorizePermissions, deleteAllBarangays);

router.route('/:id')
    .get(authenticateUser, getBarangay)
    .patch(authenticateUser, authorizePermissions, updateBarangay)
    .delete(authenticateUser, authorizePermissions, deleteBarangay);

module.exports = router;
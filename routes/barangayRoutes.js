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

router.route('/')
    .get(getAllBarangays)
    .post(authenticateUser, authorizePermissions, addBarangay)
    .delete(authenticateUser, authorizePermissions, deleteAllBarangays);

router.route('/:id')
    .get(authenticateUser, getBarangay)
    .patch(authenticateUser, authorizePermissions, updateBarangay)
    .delete(authenticateUser, authorizePermissions, deleteBarangay);

module.exports = router;
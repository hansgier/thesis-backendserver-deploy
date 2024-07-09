const router = require('express').Router();
const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');
const {
    deleteAllUsers,
    getAllUsers,
    getUser,
    showCurrentUser,
    updateUser,
    deleteUser,
    editUser, addUser,
} = require('../controllers/userController');
const { checkUsersCache } = require("../middlewares/checkCache");

router.route('/')
    .get(authenticateUser, checkUsersCache, getAllUsers)
    .post(authenticateUser, addUser)
    .delete(authenticateUser, authorizePermissions, deleteAllUsers);

router.route('/me')
    .get(authenticateUser, showCurrentUser);

router.route('/update-user')
    .patch(authenticateUser, updateUser);

router.route('/:id')
    .get(authenticateUser, authorizePermissions, getUser)
    .patch(authenticateUser, authorizePermissions, editUser)
    .delete(authenticateUser, authorizePermissions, deleteUser);


module.exports = router;
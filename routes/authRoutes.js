const router = require('express').Router();
const { authenticateUser } = require('../middlewares/authentication');
const {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    refresh,
    verifyUser,
} = require('../controllers/authController');


router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').delete(authenticateUser, logout);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);
router.route('/refresh').post(refresh);
router.route('/verify-email').get(verifyUser);

module.exports = router;
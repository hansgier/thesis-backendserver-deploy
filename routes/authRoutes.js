const router = require('express').Router();
const { authenticateUser } = require('../middlewares/authentication');
const { register, login, logout, forgotPassword, resetPassword } = require('../controllers/authController');

const rateLimiter = require('express-rate-limit');

const apiLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: {
        msg: 'Too many requests, please try again after 5 minutes',
    },
});

router.route('/register').post(apiLimiter, register);
router.route('/login').post(apiLimiter, login);
router.route('/logout').delete(authenticateUser, logout);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);

module.exports = router;
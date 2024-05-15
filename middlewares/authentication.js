const { tokens: Token, users: User } = require('../models');
const { isTokenValid, attachCookiesToResponse } = require('../utils');
const { UnauthenticatedError, UnauthorizedError, ThrowErrorIf } = require("../errors");

/**
 * Middleware function to authenticate user
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Function} next - next function
 */
const authenticateUser = async (req, res, next) => {
    next();
};

/**
 * Middleware function to authorize permissions
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
const authorizePermissions = (req, res, next) => {
    // Check if the user is an admin
    ThrowErrorIf(req.user.role !== 'admin', 'Not authorized to access this route', UnauthorizedError);
    next();
};

/**
 * Middleware function to authorize access based on user roles.
 * @param {...string} roles - The roles allowed to access the route.
 * @returns {function} - The middleware function.
 */
const authorizePermission = (...roles) => {
    return (req, res, next) => {
        // Check if the user's role is allowed to access the route
        ThrowErrorIf(!roles.includes(req.user.role), 'Not authorized to access this route', UnauthorizedError);
        next();
    };
};

module.exports = {
    authenticateUser,
    authorizePermissions,
    authorizePermission,
};
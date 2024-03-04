const { StatusCodes } = require('http-status-codes');
const { ValidationError, DatabaseError, TimeoutError } = require('sequelize');
const { formatSequelizeError } = require("../errors");

/**
 * Middleware function to handle errors.
 * @param {Error} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const errorHandlerMiddleware = (err, req, res, next) => {
    console.log(err);

    // Set default status code and message
    let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    let message = err.message || 'An unexpected error occurred on the server. Please try again.';

    // Check if it's a validation error from Sequelize
    if (err instanceof ValidationError) {
        statusCode = StatusCodes.BAD_REQUEST;
        message = formatSequelizeError(err);
    }
    // Check if it's a database error from Sequelize
    else if (err instanceof DatabaseError) {
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        message = 'Database error';
    }
    // Check if it's a timeout error from Sequelize
    else if (err instanceof TimeoutError) {
        statusCode = StatusCodes.GATEWAY_TIMEOUT;
        message = 'Database timeout';
    }
    // Check if it's a CSRF token error from csurf middleware
    else if (err.code === 'EBADCSRFTOKEN') {
        statusCode = StatusCodes.FORBIDDEN;
        message = 'Invalid CSRF token';
    }
    // Check if it's a connection refused error from Node.js
    else if (err.code === 'ECONNREFUSED') {
        statusCode = StatusCodes.SERVICE_UNAVAILABLE;
        message = 'Service unavailable';
    }

    // Send the response with the appropriate status code and message
    res.status(statusCode).json({ message });
};

module.exports = errorHandlerMiddleware;

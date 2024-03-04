const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api-error');

class UnauthorizedError extends CustomAPIError {
    /**
     * Custom error class for unauthorized access.
     * @param {string} message - The error message.
     */
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.FORBIDDEN;
    }
}

module.exports = UnauthorizedError;

const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api-error');

class UnauthenticatedError extends CustomAPIError {
    /**
     * Constructor for the class.
     * @param {string} message - The error message.
     */
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.UNAUTHORIZED;
    }
}

module.exports = UnauthenticatedError;

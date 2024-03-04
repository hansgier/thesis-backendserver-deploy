const CustomAPIError = require('./custom-api-error');
const { StatusCodes } = require('http-status-codes');

class ConflictError extends CustomAPIError {
    /**
     * Create a conflict error.
     * @constructor
     * @param {string} message - The error message.
     */
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.CONFLICT;
    }
}

module.exports = ConflictError;
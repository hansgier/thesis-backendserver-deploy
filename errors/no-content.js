const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api-error');

class NoContentError extends CustomAPIError {
    /**
     * Constructor for the NoContentError class.
     * @param {string} message - The error message.
     */
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.NO_CONTENT;
    }
}

module.exports = NoContentError;

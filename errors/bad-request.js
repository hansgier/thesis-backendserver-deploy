const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require("./custom-api-error");


/**
 * Custom error class for bad requests.
 * @extends CustomAPIError
 */
class BadRequestError extends CustomAPIError {
    /**
     * Constructs a new BadRequestError.
     * @param {string} message - The error message.
     */
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.BAD_REQUEST;
    }
}

module.exports = BadRequestError;
const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api-error');

class NotFoundError extends CustomAPIError {
    /**
     * Custom error class for handling not found errors
     * @param {string} message - The error message
     */
    constructor(message) {
        super(message); // Call the parent class constructor
        this.statusCode = StatusCodes.NOT_FOUND; // Set the status code for the error
    }
}

module.exports = NotFoundError;

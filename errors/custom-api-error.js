class CustomAPIError extends Error {
    /**
     * Constructor for CustomError class.
     * @param {string} message - The error message.
     */
    constructor(message) {
        super(message);
    }
}

module.exports = CustomAPIError;
/**
 * Throws an error of the specified type if the condition is true.
 *
 * @param {boolean} condition - The condition to check.
 * @param {string} message - The error message.
 * @param {Error} errorType - The type of error to throw.
 * @throws {Error} - Throws an error of the specified type if the condition is true.
 */
module.exports = (condition, message, errorType) => {
    if (condition) throw new errorType(message);
};
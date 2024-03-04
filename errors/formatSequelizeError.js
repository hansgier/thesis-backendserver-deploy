/**
 * Formats a Sequelize error object into a single string message.
 *
 * @param {object} err - The Sequelize error object.
 * @return {string} The formatted error message.
 */
const formatSequelizeError = (err) => {
    // Initialize an empty message string
    let msg = "";

    // Loop through the error array and append each error message to the message string
    for (let e of err.errors) {
        msg += e.message + ", ";
    }

    // Remove the trailing comma and space from the message string
    msg = msg.slice(0, -2);

    // Return the message string
    return msg;
};

module.exports = formatSequelizeError;

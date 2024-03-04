const bcrypt = require('bcrypt');

// A function that takes the user input and the user object from the database
/**
 * Compare the user input password with the password stored in the user object
 * @param {string} input - The user input password
 * @param {object} user - The user object from the database
 * @returns {Promise<boolean>} - A promise that resolves to true if the passwords match, false otherwise
 */
async function comparePassword(input, user) {
    // Use bcrypt to compare the input password with the user's password
    return await bcrypt.compare(input, user.password);
}

module.exports = comparePassword;
const bcrypt = require('bcryptjs');

/**
 * Compare the user input password with the password stored in the user object
 * @param {string} input - The user input password
 * @param {object} user - The user object from the database
 * @returns {Promise<boolean>} - A promise that resolves to true if the passwords match, false otherwise
 */
async function comparePassword(inputS, user) {
    // Use bcrypt to compare the input password with the user's password
    bcrypt.compare(inputS, user.password).then((res) => {
        console.log(res);
        return res;
    });
}

module.exports = comparePassword;
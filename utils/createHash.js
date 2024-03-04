const bcrypt = require('bcrypt');

/**
 * Hashes a given string using bcrypt.
 * @param {string} string - The string to be hashed.
 * @returns {string} The hashed string.
 */
module.exports = (string) => {
    // Generate a salt with a cost factor of 10
    const salt = bcrypt.genSaltSync(10);

    // Hash the string using the generated salt
    return bcrypt.hashSync(string, salt);
};


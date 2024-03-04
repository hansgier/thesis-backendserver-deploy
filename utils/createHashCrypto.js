const crypto = require('crypto');
/**
 * Hashes a given string using the MD5 algorithm.
 *
 * @param {string} string - The string to be hashed.
 * @returns {string} - The hashed string.
 */
const hashString = (string) => crypto.createHash('md5').update(string).digest('hex');

module.exports = hashString;
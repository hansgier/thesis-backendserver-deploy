const jwt = require('jsonwebtoken');
const { tokenExpirations } = require('./constants');

/**
 * Creates a JSON Web Token (JWT) with the given payload and a secret key.
 *
 * @param {Object} payload - The payload to be encoded in the JWT.
 * @returns {string} The generated JWT.
 */
const createJWT = ({ payload }) => {
    // Sign the payload with the secret key and return the JWT.
    return jwt.sign(payload, process.env.JWT_SECRET);
};

/**
 * Check if a token is valid.
 * @param {string} token - The token to be verified.
 * @returns {boolean} - True if the token is valid, false otherwise.
 */
const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);


module.exports = {
    createJWT,
    isTokenValid,
};
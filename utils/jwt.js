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

/**
 * Attach cookies to the response object.
 *
 * @param {Object} options - The options object.
 * @param {Object} options.res - The response object.
 * @param {Object} options.user - The user object.
 * @param {string} options.refreshToken - The refresh token.
 */
const attachCookiesToResponse = ({ res, user, refreshToken }) => {
    // Create access token JWT
    const accessTokenJWT = createJWT({ payload: { user } });

    // Create refresh token JWT
    const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

    // Set access token cookie
    res.cookie('accessToken', accessTokenJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true,
        maxAge: tokenExpirations.ACCESS_TOKEN_EXPIRY,
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshTokenJWT, {
        httpOnly: true,
        expires: tokenExpirations.REFRESH_TOKEN_EXPIRY,
        secure: process.env.NODE_ENV === 'production',
        signed: true,
    });
};

module.exports = {
    createJWT,
    isTokenValid,
    attachCookiesToResponse,
};
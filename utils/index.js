const checkPermissions = require("./checkPermissions");
const createHash = require('./createHash');
const { tokenExpirations, TAGS, REACTIONS, STATUS } = require("./constants");
const { attachCookiesToResponse, createJWT, isTokenValid } = require('./jwt');
const createTokenUser = require('./createTokenUser');
const sendEmail = require('./sendEmail');
const sendResetPassword = require('./sendResetPassword');
const createHashCrypto = require('./createHashCrypto');
const sortControllerFunc = require('./sortControllerFunc');
const paginationControllerFunc = require('./paginationControllerFunc');
const comparePassword = require('./comparePassword');

module.exports = {
    checkPermissions,
    createHash,
    comparePassword,
    tokenExpirations,
    TAGS,
    REACTIONS,
    STATUS,
    attachCookiesToResponse,
    createJWT,
    isTokenValid,
    createTokenUser,
    sendEmail,
    sendResetPassword,
    createHashCrypto,
    sortControllerFunc,
    paginationControllerFunc,
};
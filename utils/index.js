const checkPermissions = require("./checkPermissions");
const comparePassword = require("./comparePassword");
const createHash = require('./createHash');
const { tokenExpirations, TAGS, REACTIONS, STATUS } = require("./constants");
const { attachCookiesToResponse, createJWT, isTokenValid } = require('./jwt');
const createTokenUser = require('./createTokenUser');
const sendEmail = require('./sendEmail');
const sendResetPassword = require('./sendResetPassword');
const createHashCrypto = require('./createHashCrypto');
const sortControllerFunc = require('./sortControllerFunc');
const paginationControllerFunc = require('./paginationControllerFunc');

module.exports = {
    checkPermissions,
    comparePassword,
    createHash,
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
const { users: User, tokens: Token, barangays: Barangay } = require("../models");
const { StatusCodes } = require("http-status-codes");
const { nanoid } = require("nanoid");
const { UnauthenticatedError, ThrowErrorIf, UnauthorizedError, BadRequestError } = require("../errors");
const {
    createTokenUser,
    attachCookiesToResponse,
    sendResetPassword,
    createHashCrypto,
} = require("../utils");
const register = async (req, res) => {
    const { username, password, email, role, barangay_id } = req.body;
    // count the users in database
    const userCount = await User.count({});
    // if there are no users in the database, register the user as admin
    const Role = userCount < 1 ? 'admin' : role;
    // check if barangay_id exists in the barangay database
    const barangay = await Barangay.findByPk(barangay_id);
    ThrowErrorIf(!barangay, 'Barangay does not exist', BadRequestError);
    await User.create({
        username: username,
        password: password,
        email: email,
        role: Role,
        barangay_id: barangay_id,
    });
    res.status(StatusCodes.CREATED).json({ msg: 'Success! User registered' });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({
        where: {
            email: email,
        },
    });
    // check if user is found by email
    ThrowErrorIf(!user, 'Invalid Credentials', UnauthenticatedError);
    // check if the user password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    ThrowErrorIf(!isPasswordCorrect, 'Incorrect Password', UnauthenticatedError);
    // create token for the user
    const tokenUser = createTokenUser(user);
    let refreshToken;
    // check if the user has an existing token stored in the database
    const existingToken = await Token.findOne({
        where: {
            user_id: user.id,
        },
    });
    if (existingToken) {
        // check if the token is still valid
        const { isValid } = existingToken;
        ThrowErrorIf(!isValid, 'Invalid credentials', UnauthenticatedError);
        // refresh the token expiration and attach to cookies
        refreshToken = existingToken.refreshToken;
        attachCookiesToResponse({ res, user: tokenUser, refreshToken });
        res.status(StatusCodes.OK).json({ msg: 'Success! You are logged in', user: tokenUser });
        return;
    }
    // create new refresh and access token
    refreshToken = nanoid(36);
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const userToken = { refreshToken, ip, userAgent, user_id: user.id };
    await Token.create(userToken);
    // attach to cookies
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ msg: 'Success! You are logged in', user: tokenUser });
};

const logout = async (req, res) => {
    // delete the token of the user
    await Token.destroy({
        where: {
            user_id: req.user.userId,
        },
    });
    // remove the cookies by expiring the tokens immediately
    res.cookie('accessToken', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: process.env.NODE_ENV === 'production',
        signed: true,
    });
    res.cookie('refreshToken', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: process.env.NODE_ENV === 'production',
        signed: true,
    });
    res.status(StatusCodes.OK).json({ msg: 'Success! You are logged out' });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    // check if the email is empty or null
    ThrowErrorIf(!email, 'Please provide an email address', BadRequestError);
    // check if user is found
    const user = await User.findOne({ where: { email: email } });
    if (user) {
        // create password token and send that to email
        const passwordToken = nanoid(36);
        await sendResetPassword({
            name: user.username,
            email: user.email,
            token: passwordToken,
            origin: process.env.ORIGIN,
        });
        // create password token expiration date and set it to 10 minutes
        const passwordTokenExpiry = new Date(Date.now() + 1000 * 10);
        // save the password token and expiration date to user
        user.passwordToken = createHashCrypto(passwordToken);
        user.passwordTokenExpiry = passwordTokenExpiry;
        await user.save();
    }
    res.status(StatusCodes.OK).json({ msg: 'Please check your email for password reset' });
};

const resetPassword = async (req, res) => {
    const { email, password, token } = req.body;
    // check if all fields are provided
    ThrowErrorIf(!email || !password || !token, 'Please provide an email, password and token', BadRequestError);
    // check if user is found
    const user = await User.findOne({ where: { email: email } });
    if (user) {
        const currentDate = new Date();
        // check if the password token is valid
        if (user.passwordToken === createHashCrypto(token) && user.passwordTokenExpiry > currentDate) {
            // update the user password
            user.password = password;
            user.passwordToken = null;
            user.passwordTokenExpiry = null;
            await user.save();
        }
    }
    res.status(StatusCodes.OK).send({ msg: 'Password reset successfully' });
};

module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
};
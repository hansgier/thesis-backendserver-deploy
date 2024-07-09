const { users: User, tokens: Token, barangays: Barangay } = require("../models");
const { StatusCodes } = require("http-status-codes");
const { nanoid } = require("nanoid");
const {
    UnauthenticatedError,
    ThrowErrorIf,
    UnauthorizedError,
    BadRequestError,
    ConflictError,
    NotFoundError,
} = require("../errors");
const {
    sendResetPassword,
    createHashCrypto,
    generateTokens,
} = require("../utils");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../config/redis");

const register = async (req, res) => {
    const { username, password, email, role, barangay_id } = req.body;

    // count the users in database
    const userCount = await User.count({});

    // if there are no users in the database, register the user as admin
    const Role = userCount < 1 ? 'admin' : role;

    // check if barangay_id exists in the barangay database
    const barangay = await Barangay.findByPk(barangay_id);
    ThrowErrorIf(!barangay, 'Barangay does not exist', BadRequestError);

    if (role === 'barangay') {
        const existingBarangayUser = await User.findOne({
            where: {
                barangay_id: barangay_id,
                role: 'barangay',
            },
        });
        ThrowErrorIf(existingBarangayUser, 'Barangay has already an existing user', ConflictError);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const registeredUser = await User.create({
        username: username,
        password: hashedPassword,
        email: email,
        role: Role,
        barangay_id: barangay_id,
    });
    await redis.del(["users"]);

    res.status(StatusCodes.CREATED).json({ msg: 'Success! User registered', registeredUser });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({
        where: {
            email: email,
        },
    });
    // check if user is found by email
    ThrowErrorIf(!user, 'Invalid email', UnauthenticatedError);
    // check if the user password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    ThrowErrorIf(!isPasswordCorrect, 'Incorrect password', UnauthenticatedError);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store tokens in the database
    user.accessToken = accessToken;
    user.accessTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 60 minute
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    res.status(StatusCodes.OK).json({ msg: 'Success! You are logged in', accessToken, user });
};

const logout = async (req, res) => {
    const { user } = req;
    if (user.role === "guest") {
        return res.status(StatusCodes.OK).json({ msg: 'Success! You are logged out' });
    }

    const curr_user = await User.findByPk(user.userId);
    ThrowErrorIf(!curr_user, 'User not found', NotFoundError);

    await curr_user.update({
        accessToken: null,
        accessTokenExpiry: null,
        refreshToken: null,
        refreshTokenExpiry: null,
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

const refresh = async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token missing' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if refresh token is still valid
        if (user.refreshTokenExpiry < new Date()) {
            return res.status(401).json({ message: 'Refresh token expired' });
        }

        // Generate new access token
        const accessToken = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        user.accessToken = accessToken;
        user.accessTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 60 minute
        await user.save();

        res.json({ accessToken });
    } catch (err) {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
};


module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    refresh,
};
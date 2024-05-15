const { users: User } = require('../models');
const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");
const bcrypt = require('bcryptjs');
const {
    NotFoundError,
    BadRequestError,
    UnauthenticatedError,
    ThrowErrorIf, ConflictError, NoContentError,
} = require("../errors");
const {
    createTokenUser,
    attachCookiesToResponse,
} = require("../utils");
const { getUserQuery } = require("../utils/helpers");

/**
 * Retrieves all users and sends a JSON response with the count and users.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAllUsers = async (req, res) => {
    // Get the user query based on the request
    const query = getUserQuery(req);

    // Retrieve all users and sort them by createdAt
    const users = await User.findAll(query);

    // Get the count of users
    const count = users.length;

    // If no users found, return a JSON response with a message
    if (count < 1) {
        return res.status(StatusCodes.OK).json({ msg: 'No users found' });
    }

    // Send a JSON response with the count and users
    res.status(StatusCodes.OK).json({ count, users });
};

const getUser = async (req, res) => {
    const { id: userId } = req.params;
    // check if id is null or empty
    ThrowErrorIf(!userId || userId === ':id' || userId === '', 'User id is required', BadRequestError);
    // check if user is found
    const user = await User.findByPk(userId);
    ThrowErrorIf(!user, `User with id: ${ userId } not found`, NotFoundError);

    res.status(StatusCodes.OK).json({ user });
};

/**
 * Show the current user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const showCurrentUser = async (req, res) => {
    // Throw an error if the user is not found
    ThrowErrorIf(!req.user, 'User not found', UnauthenticatedError);
    const user = await User.findByPk(req.user.userId);

    // Send the user object as a JSON response
    res.status(StatusCodes.OK).json({ user });
};

/**
 * Updates a user's information.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @throws {BadRequestError} If the username and email are missing.
 * @throws {NotFoundError} If the user is not found.
 * @throws {ConflictError} If the username or email or both are already updated.
 */
const updateUser = async (req, res) => {
    // Extract username and email from request body
    const { username, email } = req.body;

    // Check if both username and email are provided
    ThrowErrorIf(!username && !email, 'Username and email are required', BadRequestError);

    // Find the user by ID and check if user is found
    const userPromise = User.findByPk(req.user.userId).then(user => {
        ThrowErrorIf(!user, `User with id: ${ req.user.id } not found`, NotFoundError);
        return user;
    });

    // Check if username or email or both are already updated
    const checkPromise = User.findOne({ where: { username, email } }).then(existingUser => {
        ThrowErrorIf(existingUser, 'Username or email already exists', ConflictError);
    });

    // Wait for both promises to resolve
    const [user] = await Promise.all([userPromise, checkPromise]);

    // Update the user's information
    user.username = username || user.username;
    user.email = email || user.email;
    await user.save();

    // Create a new token for the user and attach it to cookies
    const tokenUser = createTokenUser(user);
    attachCookiesToResponse({ res, user: tokenUser });

    res.status(StatusCodes.OK).send({ msg: 'User updated successfully', user: tokenUser });
};

/**
 * Updates the user's password.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @throws {BadRequestError} If the old or new password is missing.
 * @throws {NotFoundError} If the user is not found.
 * @throws {UnauthenticatedError} If the old password is incorrect.
 * @throws {ConflictError} If the new password is already used.
 */
const updateUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Check if old or new password or both of them are empty or null
    ThrowErrorIf(
        (!oldPassword && !newPassword) || !oldPassword || !newPassword,
        `${ (!oldPassword && !newPassword) ? 'Old and new' : !oldPassword ? 'Old' : 'New' } password ${ (!oldPassword && !newPassword) ? 'are' : 'is' } required`,
        BadRequestError,
    );

    // Check if the user is found
    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, `User with id: ${ req.user.id } not found`, NotFoundError);

    // Check if the old password matches the user password
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    ThrowErrorIf(!isPasswordCorrect, 'Incorrect Password', UnauthenticatedError);

    // Check if the user password is already updated
    const alreadyUpdated = await bcrypt.compare(newPassword, user.password);
    ThrowErrorIf(
        alreadyUpdated,
        'You have already updated your password',
        ConflictError,
    );

    // Hash the new password before saving
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user password
    user.password = hashedNewPassword;
    await user.save();

    res.status(StatusCodes.OK).send({ msg: 'Password updated successfully' });
};

const deleteUser = async (req, res) => {
    const { id: userId } = req.params;
    // check if id is null or empty string
    ThrowErrorIf(!userId || userId === ':id', 'User id is required', BadRequestError);
    // check if user is found
    const user = await User.findByPk(userId);
    ThrowErrorIf(!user, `User with id: ${ userId } not found`, NotFoundError);
    // delete the user
    await User.destroy({ where: { id: userId } });
    res.status(StatusCodes.OK).send({ msg: `User with id: ${ userId } has been deleted` });
};

/**
 * Deletes all users except the admin.
 * Be careful of this operation.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const deleteAllUsers = async (req, res) => {
    // Check if there are any users except the admin
    const count = await User.count({
        where: { role: { [Op.ne]: 'admin' } },
    });

    // Throw an error if there are no users to delete
    ThrowErrorIf(count < 1, 'No users to delete', NoContentError);

    // Delete all users except the admin
    await User.destroy({
        where: { role: { [Op.ne]: 'admin' } },
    });

    // Send a success response
    res.status(StatusCodes.OK).send({ msg: 'All users deleted' });
};

module.exports = {
    deleteAllUsers,
    getAllUsers,
    getUser,
    showCurrentUser,
    updateUser,
    deleteUser,
    updateUserPassword,
};
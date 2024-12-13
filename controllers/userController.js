const { users: User, barangays: Barangay } = require('../models');
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
    attachCookiesToResponse, cacheExpiries,
} = require("../utils");
const { getUserQuery } = require("../utils/helpers");
const redis = require("../config/redis");

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
    const data = { count, users };
    await redis.set("users", JSON.stringify(data), "EX", cacheExpiries.users);

    // Send a JSON response with the count and users
    res.status(StatusCodes.OK).json(data);
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
    res.status(StatusCodes.OK).json({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            role: user.role,
            barangay_id: user.barangay_id,
        },
    });
};

/**
 * Updates a user's information and/or password.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @throws {BadRequestError} If the necessary fields are missing.
 * @throws {NotFoundError} If the user is not found.
 * @throws {ConflictError} If the username or email already exists, or if the new password is the same as the old one.
 * @throws {UnauthenticatedError} If the old password is incorrect.
 */
const updateUser = async (req, res) => {
    const { username, email, password, barangay_id } = req.body;

    // Find the user by ID
    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, `User with id: ${ req.user.userId } not found`, NotFoundError);

    // Check if username or email needs to be updated
    if (username || email) {
        // Check if the username or email already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username || null },
                    { email: email || null },
                ],
                id: { [Op.ne]: req.user.userId },
            },
        });
        ThrowErrorIf(existingUser, 'Username or email already exists', ConflictError);

        // Update the user's information
        user.username = username || user.username;
        user.email = email || user.email;
        user.barangay_id = barangay_id || user.barangay_id;
    }

    // Check if password needs to be updated
    if (password) {
        // Hash the new password before saving
        user.password = await bcrypt.hash(password, 10) || user.password;
    }

    // Save the updated user
    await user.save();

    await user.reload();
    await redis.del(["users"]);

    res.status(StatusCodes.OK).send({ msg: 'User updated successfully', user });
};

const editUser = async (req, res) => {
    const { username, email, password, barangay_id, role } = req.body;
    const { id } = req.params;

    // Find the user by ID
    const user = await User.findByPk(id);
    ThrowErrorIf(!user, `User with id: ${ id } not found`, NotFoundError);

    // Check if username or email needs to be updated
    if (username || email) {
        // Check if the username or email already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username || null },
                    { email: email || null },
                ],
                id: { [Op.ne]: id },
            },
        });
        ThrowErrorIf(existingUser, 'Username or email already exists', ConflictError);

        // Update the user's information
        user.username = username || user.username;
        user.email = email || user.email;
        user.role = role || user.role;
        user.barangay_id = barangay_id || user.barangay_id;
    }

    // Check if password needs to be updated
    if (password) {
        // Hash the new password before saving
        user.password = await bcrypt.hash(password, 10) || user.password;
    }

    // Save the updated user
    await user.save();

    await user.reload();
    await redis.del(["users"]);

    res.status(StatusCodes.OK).send({ msg: 'User edited successfully', user });
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
    await redis.del(["users"]);
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

    await redis.del(["users"]);
    // Send a success response
    res.status(StatusCodes.OK).send({ msg: 'All users deleted' });
};

const addUser = async (req, res) => {
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
        isVerified: true,
    });

    await redis.del(["users"]);

    res.status(StatusCodes.CREATED).json({ msg: 'Success! User registered', registeredUser });
};


module.exports = {
    deleteAllUsers,
    getAllUsers,
    getUser,
    showCurrentUser,
    updateUser,
    deleteUser,
    editUser,
    addUser,
};
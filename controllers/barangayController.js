const { barangays: Barangay, users: User } = require('../models');
const { StatusCodes } = require('http-status-codes');
const { Op } = require("sequelize");
const { ThrowErrorIf, NotFoundError, BadRequestError, ConflictError, NoContentError } = require("../errors");
const { sortControllerFunc, paginationControllerFunc } = require("../utils");

// ----------------------------------------------METHODS---------------------------------------------- //
/**
 * Generates a query object based on the request parameters.
 * @param {Object} req - The request object.
 * @returns {Object} - The generated query object.
 */
const getQuery = (req) => {
    // Destructure the query parameters from the request object
    const { search, sort, page, limit } = req.query;

    // Initialize the query object with default values
    let query = {
        order: [['name', 'ASC']],
    };

    // Add search parameter to the query if provided
    if (search) {
        Object.assign(query, {
            where: {
                name: {
                    [Op.like]: `%${ search }%`,
                },
            },
        });
    }

    // Add sort parameter to the query if provided
    const validColumns = ['name', 'email', 'createdAt', 'updatedAt'];
    if (sort) {
        sortControllerFunc(sort, query, validColumns);
    }

    // Add pagination parameters to the query if provided
    if (page && limit) {
        paginationControllerFunc(page, limit, query);
    }

    // Return the generated query object
    return query;
};

// ----------------------------------------------OPERATIONS---------------------------------------------- //

/**
 * Adds a new barangay to the database
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const addBarangay = async (req, res) => {
    // Extract the name from the request body
    const { name } = req.body;

    // Create a new barangay with the given name and set hasUser to false
    const barangay = await Barangay.create({ name, hasUser: false });

    // Send a response with the added barangay and a message
    res.status(StatusCodes.CREATED).json({
        msg: 'Barangay added! A user account is required for this barangay',
        barangay,
    });
};

/**
 * Retrieves all barangays based on the provided query parameters.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAllBarangays = async (req, res) => {
    // Get the query parameters from the request
    const query = getQuery(req);

    // Include the associated users with each barangay
    query.include = [
        {
            model: User,
            as: 'users',
            where: {
                role: { [Op.eq]: 'barangay' },
            },
            attributes: ['id', 'username', 'email'],
        },
    ];

    // Find all barangays based on the query
    const barangays = await Barangay.findAll(query);

    // Count the total number of barangays
    const count = await Barangay.count();

    // If no barangays are found, return a message
    if (count < 1) return res.status(StatusCodes.OK).json({ msg: 'No Barangays Found' });

    // Return the page number, count, and barangays in the response
    res.status(StatusCodes.OK).json({
        page: parseInt(req.query.page) || 1,
        count,
        barangays,
    });
};

/**
 * Retrieves a barangay by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getBarangay = async (req, res) => {
    const { id } = req.params;
    // check if id is null or empty string
    ThrowErrorIf(!id || id === ':id' || id === '', 'Id is required', BadRequestError);

    // check if the barangay exists
    const barangay = await Barangay.findByPk(id, {
        include: [
            {
                model: User,
                as: 'users',
                where: {
                    role: { [Op.eq]: 'barangay' },
                },
                attributes: ['id', 'username', 'email'],
            },
        ],
    });
    ThrowErrorIf(!barangay, `Barangay id: ${ id } not found`, NotFoundError);

    res.status(StatusCodes.OK).json({ barangay });
};

/**
 * Update a barangay
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const updateBarangay = async (req, res) => {
    const { name } = req.body;
    const { id } = req.params;

    // Check if the id is provided
    ThrowErrorIf(!id || id === ':id' || id === '', 'Id is required', BadRequestError);

    // Check if the barangay exists
    const barangay = await Barangay.findByPk(id);
    ThrowErrorIf(!barangay, 'Barangay not found', NotFoundError);

    // Check if the barangay is already updated
    ThrowErrorIf(barangay.name === name, 'Barangay already updated', ConflictError);

    // Update the barangay name
    await Barangay.update({ name: name }, {
        where: { id },
    });

    // Send success response
    res.status(StatusCodes.OK).json({ msg: 'Barangay updated successfully' });
};

/**
 * Deletes a barangay by its ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object with a success message
 */
const deleteBarangay = async (req, res) => {
    // Extract the ID from the request parameters
    const { id } = req.params;

    // Check if the ID is null or empty string
    ThrowErrorIf(!id || id === ':id' || id === '', 'Id is required', BadRequestError);

    // Check if the barangay exists
    const barangay = await Barangay.findByPk(id);
    ThrowErrorIf(!barangay, 'Barangay not found', NotFoundError);

    // Delete the barangay from the database
    await Barangay.destroy({ where: { id } });

    // Return a success message
    res.status(StatusCodes.OK).json({ msg: 'Barangay deleted successfully' });
};

/**
 * Deletes all barangays from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The response object with a message indicating the success of the deletion.
 */
const deleteAllBarangays = async (req, res) => {
    // Check if there are any barangays to delete
    const count = await Barangay.count({});
    // Throw an error if there are no barangays to delete
    ThrowErrorIf(count < 1, 'No barangays to delete', NoContentError);

    // Delete all barangays from the database
    await Barangay.destroy({ where: {} });
    // Send a response with a success message
    res.status(StatusCodes.OK).send({ msg: 'All barangays deleted' });
};

module.exports = {
    addBarangay,
    getAllBarangays,
    getBarangay,
    updateBarangay,
    deleteBarangay,
    deleteAllBarangays,
};
const { Op } = require("sequelize");
const { sequelize, reactions: Reaction } = require('../../models');

const { ThrowErrorIf, BadRequestError } = require("../../errors");
const { paginationControllerFunc } = require("../index");

// ---------------------------------- FOR ADMIN ---------------------------------- //

const getCommentQuery = (query) => {
    const { search, sort, page, limit } = query;
    const options = {
        where: {},
        order: [['createdAt', 'DESC']],
    };

    search && searchComments(options, search);
    sort && sortComments(options, sort);
    (page && limit) && paginationControllerFunc(page, limit, options);

    return options;
};

const searchComments = (options, search) => {
    options.where = {
        ...options.where,
        content: { [Op.like]: `%${ search }%` },
    };
};

/**
 * Sorts comments based on the provided options and sort parameter.
 *
 * @param {object} options - The options object for the comment sorting.
 * @param {string} sort - The sort parameter indicating the column to sort by and the sort direction.
 */
const sortComments = (options, sort) => {
    // Define the valid columns for sorting
    const validColumns = ['createdAt', 'reactions'];

    // Check if the sort parameter starts with '-', indicating descending order
    const isDesc = sort.startsWith('-');

    // Extract the column name from the sort parameter
    const column = isDesc ? sort.slice(1) : sort;

    // Map the sort direction to the corresponding database sort order
    const direction = isDesc ? 'ASC' : 'DESC';

    // Throw an error if the column is not a valid sort column
    ThrowErrorIf(!validColumns.includes(column), 'Invalid sort column', BadRequestError);

    // Update the options object with the sort column and direction
    Object.assign(options, {
        order: [[column, direction]],
    });
};

// ---------------------------------- PROJECT COMMENTS ---------------------------------- //

/**
 * Returns a query object for retrieving project comments.
 * @param {Object} query - The query object containing sort, page, and limit.
 * @param {string} id - The project ID.
 * @returns {Object} - The query object for retrieving project comments.
 */
const getProjectCommentQuery = (query, id) => {
    // Extract sort, page, and limit from the query object
    const { sort, page, limit } = query;

    // Define the options object for the query
    const options = {
        where: {
            project_id: id,
        },
        include: [
            {
                model: Reaction,
                as: 'reactions',
                attributes: [],
                where: {
                    reaction_type: 'like',
                },
                required: false,
            },
        ],
        // Group by the comment id
        group: ['Comment.id'],
        // Add a new attribute for the number of likes
        attributes: [
            'id',
            'content',
            'commented_by',
            'createdAt',
            'updatedAt',
            [sequelize.fn('COUNT', sequelize.col('Reactions.id')), 'likes'],
        ],
        // Sort the comments by the number of likes in descending order as the default option
        order: [[sequelize.literal('likes'), 'DESC']],
    };

    // Sort the comments if sort is provided in the query
    sort && sortComments(options, sort);

    // Paginate the comments if page and limit are provided in the query
    (page && limit) && paginationControllerFunc(page, limit, options);

    // Return the options object
    return options;
};


module.exports = {
    getCommentQuery,
    getProjectCommentQuery,
};
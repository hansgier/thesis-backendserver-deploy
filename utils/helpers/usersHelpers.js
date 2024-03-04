const { ThrowErrorIf, BadRequestError } = require("../../errors");
const { Op } = require("sequelize");
const { sortControllerFunc, paginationControllerFunc } = require("../index");

/**
 * Apply filters to a query based on provided options.
 *
 * @param {Object} query - The query object to apply filters to.
 * @param {Object} options - The options object containing filters to apply.
 * @param {string} options.role - The role filter to apply.
 * @param {string} options.banned - The banned filter to apply.
 * @param {string} options.barangayId - The barangay_id filter to apply.
 */
const filters = (query, options) => {
    // Destructure the options object and assign default values
    const { role, banned, barangayId } = options;

    // Apply role filter if provided and valid
    ['resident', 'barangay'].includes(role) && Object.assign(query, {
        where: {
            ...query.where,
            role: {
                [Op.eq]: role,
            },
        },
    });

    // Apply banned filter if provided
    banned && Object.assign(query, {
        where: {
            ...query.where,
            banned: {
                [Op.eq]: banned === 'true',
            },
        },
    });

    // Apply barangay_id filter if provided and valid
    !isNaN(barangayId) && Object.assign(query, {
        where: {
            ...query.where,
            barangay_id: {
                [Op.eq]: parseInt(barangayId),
            },
        },
    });
};

/**
 * Generates a query object based on the provided request object.
 *
 * @param {Object} req - The request object containing query parameters.
 * @return {Object} The generated query object.
 */
const getUserQuery = (req) => {
    // Destructure the query object and assign default values
    const { search, sort, role, banned, page, limit, barangayId } = req.query;

    // Initialize the query object with default values
    let query = {
        order: [['createdAt', 'ASC']],
    };

    // Add search parameter to the query if provided
    search && Object.assign(query, {
        where: {
            username: {
                [Op.like]: `%${ search }%`,
            },
        },
    });

    // Add filters to the query if provided
    (role || banned || barangayId) && filters(query, { role, banned, barangayId });

    // Add sort parameter to the query if provided
    const validColumns = ['username', 'id'];
    sort && sortControllerFunc(sort, query, validColumns);

    // Add pagination parameters to the query if provided
    (page && limit) && paginationControllerFunc(page, limit, query);

    // Return the generated query object
    return query;
};


module.exports = getUserQuery;

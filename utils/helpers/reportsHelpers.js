const { reports: Report, projects: Project, comments: Comment, media: Media } = require('../../models');
const { BadRequestError, NotFoundError, ThrowErrorIf, ConflictError } = require("../../errors");
const { Op } = require("sequelize");
const { paginationControllerFunc } = require("../index");

// ---------------------------------- CREATE ---------------------------------- //

const findOrCreateReport = async (reportTarget, id, content, user) => {
    // Validate the id
    ThrowErrorIf(!id || id === '' || id === `:${ reportTarget }Id`, `${ reportTarget } id is required`, BadRequestError);

    // Find the target by id
    const target = await (reportTarget === 'project' ? Project : Comment).findByPk(id);
    ThrowErrorIf(!target, `${ reportTarget } not found`, NotFoundError);

    // Check if the report already exists
    const existingReport = await Report.findOne({
        where: {
            content,
            reported_by: user.id,
            [`${ reportTarget }_id`]: id,
        },
    });
    ThrowErrorIf(existingReport, 'Report already exists. Change your report content', ConflictError);

    // Create a new report
    return await Report.create({
        content,
        reported_by: user.id,
        [`${ reportTarget }_id`]: id,
    }, {
        include: [
            {
                model: Media,
                as: 'media',
                attributes: ['id', 'url', 'mime_type'],
            },
        ],
    });
};

// ---------------------------------- GET ---------------------------------- //

/**
 * Generates a report query based on the provided parameters.
 * @param {Object} query - The query parameters.
 * @param {string} query.search - The search term.
 * @param {string} query.sort - The sorting criteria.
 * @param {string} query.status - The status filter.
 * @param {number} query.page - The page number.
 * @param {number} query.limit - The number of results per page.
 * @returns {Object} - The generated report query.
 */
function getReportQuery(query) {
    const { search, sort, status, page, limit } = query;

    const options = {
        where: {},
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: Media,
                as: 'media',
                attributes: ['id', 'url', 'mime_type'],
            },
        ],
    };

    // Apply search filter if provided
    search && searchReport(options, search);

    // Apply sort filter if provided
    sort && sortReport(options, sort);

    // Apply status filter if provided
    status && statusReport(options, status);

    // Apply pagination if page and limit are provided
    (page && limit) && paginationControllerFunc(page, limit, options);

    return options;
}

/**
 * Updates the options object to include a where clause that searches for a specific content.
 * @param {Object} options - The options object containing the where clause.
 * @param {string} search - The content to search for.
 */
const searchReport = (options, search) => {
    // Update the where clause to include a search for the specified content
    options.where = {
        ...options.where,
        content: {
            [Op.like]: `%${ search }%`,
        },
    };
};

/**
 * Sorts a report based on the given options and sort column.
 *
 * @param {object} options - The options object for the report.
 * @param {string} sort - The column to sort the report by.
 * @throws {BadRequestError} - If the sort column is invalid.
 */
const sortReport = (options, sort) => {
    // Define the valid columns for sorting
    const validColumns = ['createdAt'];

    // Check if the sort column is in descending order
    const isDesc = sort.startsWith('-');

    // Get the column name
    const column = isDesc ? sort.slice(1) : sort;

    // Get the sort direction
    const direction = isDesc ? 'DESC' : 'ASC';

    // Throw an error if the sort column is invalid
    ThrowErrorIf(!validColumns.includes(column), 'Invalid sort column', BadRequestError);

    // Modify the query object to add the sort order
    Object.assign(options, {
        order: [[column, direction]],
    });
};

/**
 * Updates the options object with a status filter.
 * @param {Object} options - The options object.
 * @param {string} status - The status filter.
 * @throws {BadRequestError} If the status is invalid.
 */
const statusReport = (options, status) => {
    // Define valid status values
    const validStatus = ['pending', 'resolved', 'rejected'];

    // Validate the status
    ThrowErrorIf(!status || typeof status !== 'string', 'Status is required', BadRequestError);
    ThrowErrorIf(!validStatus.includes(status), 'Invalid status', BadRequestError);

    // Update the options object with the status filter
    options.where = {
        ...options.where,
        status,
    };
};

module.exports = {
    findOrCreateReport,
    getReportQuery,
};

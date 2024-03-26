const { paginationControllerFunc } = require("../index");
const { ThrowErrorIf, BadRequestError } = require("../../errors");
const getAnnouncementQuery = (query) => {
    const { sort, page, limit, userId } = query;
    const options = {};
    if (userId) {
        options.where = {
            createdBy: userId,
        };
        options.order = [['createdAt', 'DESC']];
    } else {
        options.where = {};
        options.order = [['createdAt', 'DESC']];
    }

    sort && sortAnnouncements(options, sort);

    // Paginate projects if page and limit query parameters are provided
    (page && limit) && paginationControllerFunc(page, limit, options);

    return options;
};

const sortAnnouncements = (options, sort) => {
    // Define the valid columns for sorting
    const validColumns = ['createdAt'];

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

module.exports = {
    getAnnouncementQuery,
};
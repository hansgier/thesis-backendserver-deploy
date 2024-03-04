const { ThrowErrorIf, BadRequestError } = require("../errors");
/**
 * Refactored function to handle pagination
 * @param {string} page - The current page number
 * @param {string} limit - The number of items to display per page
 * @param {object} query - The query object to be updated
 */
module.exports = (page, limit, query) => {
    // Parse page and limit to integers
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    // Check if page and limit are valid numbers
    ThrowErrorIf(isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1,
        'Invalid page or limit', BadRequestError);

    // Calculate the offset based on the current page and limit
    const offset = (parsedPage - 1) * parsedLimit;

    // Update the query object with the offset and limit
    Object.assign(query, {
        offset: offset,
        limit: parsedLimit,
    });
};
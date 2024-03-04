const { ThrowErrorIf, BadRequestError } = require("../errors");
/**
 * Sorts the query based on the given sort column.
 *
 * @param {string} sort - The column to sort by.
 * @param {Object} query - The query object to modify.
 * @param {string[]} validColumns - The list of valid columns to sort by.
 * @throws {BadRequestError} - If the sort column is invalid.
 */
module.exports = (sort, query, validColumns) => {
    // Check if the sort column is in descending order
    const isDesc = sort.startsWith('-');
    // Get the column name
    const column = isDesc ? sort.slice(1) : sort;
    // Get the sort direction
    const direction = isDesc ? 'DESC' : 'ASC';
    // Throw an error if the sort column is invalid
    ThrowErrorIf(!validColumns.includes(column), 'Invalid sort column', BadRequestError);
    // Modify the query object to add the sort order
    Object.assign(query, {
        order: [[column, direction]],
    });
};
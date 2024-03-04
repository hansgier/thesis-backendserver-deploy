/**
 * Returns an object containing the user's name, id, and role.
 * @param {Object} user - The user object.
 * @returns {Object} - The object containing the user's name, id, and role.
 */
module.exports = (user) => {
    return {
        name: user.username,
        userId: user.id,
        role: user.role,
    };
};
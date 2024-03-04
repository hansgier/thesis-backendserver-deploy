const { UnauthorizedError, NotFoundError } = require("../errors");
const checkPermissions = (requestUser, resourceUserId) => {
    // If the request user is an admin, they have access to all resources.
    if (requestUser.role === 'admin') return;

    // If the request user is the owner of the resource, they have access.
    if (requestUser.userId === resourceUserId.toString()) return;

    // If the request user is neither an admin nor the owner of the resource,
    // throw an UnauthorizedError.
    throw new UnauthorizedError('Not authorized to access this route');
};

module.exports = checkPermissions;
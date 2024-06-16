const { Op } = require("sequelize");
const {
    tags: Tag,
    barangays: Barangay,
    comments: Comment,
    media: Media,
    users: User,
    reactions: Reaction,
} = require("../../models");
const {
    BadRequestError,
    ThrowErrorIf,
    NotFoundError,
} = require("../../errors");
const { paginationControllerFunc } = require("../index");
const { cloudinary } = require("../../config/cloudinaryConfig");

// -------------------------------- CREATE -------------------------------- //

/**
 * Converts a string into an array of numbers and validates each number.
 * Throws a BadRequestError if any number is not valid.
 *
 * @param {string} str - The input string to convert and validate.
 * @param {string} error - The error message to throw if a number is not valid.
 * @returns {number[]} - An array of valid numbers.
 * @throws {BadRequestError} - If any number is not valid.
 */
const convertAndValidate = (str, error) => {
    // Split the input string by comma and map each element to a number
    return str.split(",").map((id) => {
        // Convert the element to a number
        const num = Number(id.trim());

        // Check if the number is NaN
        if (isNaN(num)) {
            // Throw a BadRequestError with the specified error message
            throw new BadRequestError(error);
        } else {
            // Return the valid number
            return num;
        }
    });
};

/**
 * Validates the request and retrieves necessary data for creating a project.
 * @returns {Object} - An object containing the tags, barangays, and user.
 * @throws {NotFoundError} - If the user, barangays, or tags are not found.
 * @throws {BadRequestError} - If the user's barangay is already in the project.
 * @throws {ValidationError} - If the barangay or tag IDs are invalid.
 */
const validationCreate = async (req, barangayIds, tagsIds) => {
    // Check if the user exists
    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, "User not found", NotFoundError);

    // Convert and validate the barangayIds and tagsIds
    const brgyIds = convertAndValidate(barangayIds, "Invalid barangay ID");
    const tgIds = convertAndValidate(tagsIds, "Invalid tag ID");

    // Check if the barangayIds exist in the Barangay table or database.
    const barangays = await Barangay.findAll({ where: { id: brgyIds } });
    ThrowErrorIf(
        barangays.length !== brgyIds.length,
        "Some barangays do not exist",
        NotFoundError,
    );

    // Check if the tags exist in the database
    const tags = await Tag.findAll({ where: { id: tgIds } });
    ThrowErrorIf(
        tags.length !== tgIds.length,
        "Some tags do not exist",
        NotFoundError,
    );

    return { tags, barangays, user };
};


// -------------------------------- UPDATE -------------------------------- //

const validateAndUpdateProject = async (barangayIds, tagsIds) => {
    let barangays = null;
    let tags = null;
    if (barangayIds) {
        const brgyIds = convertAndValidate(barangayIds, "Invalid barangay ID");
        barangays = await Barangay.findAll({ where: { id: brgyIds } });
        ThrowErrorIf(
            barangays.length !== brgyIds.length,
            "Some barangays do not exist",
            NotFoundError,
        );
    }

    if (tagsIds) {
        const tgIds = convertAndValidate(tagsIds, "Invalid tag ID");
        tags = await Tag.findAll({ where: { id: tgIds } });
        ThrowErrorIf(
            tags.length !== tgIds.length,
            "Some tags do not exist",
            NotFoundError,
        );
    }
    return { barangays, tags };
};

/**
 * Validates the barangay IDs by checking if they exist in the database.
 * Throws an error if any of the barangays do not exist.
 * @param {Array<number>} barangayIds - The array of barangay IDs to validate.
 * @param {Object} user - The user object.
 * @throws {BadRequestError} - If the user's barangay is already in the project.
 * @throws {NotFoundError} - If some barangays do not exist.
 */
const validateBarangayIds = async (barangayIds, user) => {

    // Check if the barangays exist in the database
    const barangays = await Barangay.findAll({ where: { id: barangayIds } });
    ThrowErrorIf(
        barangays.length !== barangayIds.length,
        "Some barangays do not exist",
        NotFoundError,
    );
};

/**
 * Validates the tag IDs by checking if they exist in the database.
 * Throws an error if any of the tags do not exist.
 * @param {Array<number>} tagIds - The array of tag IDs to validate.
 * @throws {NotFoundError} - If any of the tags do not exist.
 */
const validateTagIds = async (tagIds) => {
    // Check if the tags exist in the database
    const tags = await Tag.findAll({ where: { id: tagIds } });
    ThrowErrorIf(tags.length !== tagIds.length, "Some tags do not exist", NotFoundError);
};

/**
 * Update the project with the provided data.
 *
 * @param {Object} project - The project to update.
 * @param {Object} projectData - The updated project data.
 */
const updateProject = async (project, projectData, t) => {
    // Create a new object with only the project data keys
    const updatedProjectData = Object.fromEntries(
        Object.entries(projectData).filter(([key]) =>
            Object.values(PROJECT_DATA_KEYS).includes(key),
        ),
    );

    // Update the project with the new object
    await project.update({
        ...project.dataValues,
        ...updatedProjectData,
    }, { transaction: t });
};

/**
 * Compare the input values with the current values of a project.
 * Throw an error if any of them are the same.
 * @param {object} project - The current project object.
 * @param {object} projectData - The input project data object.
 * @throws {BadRequestError} - If any of the input values are the same as the current values.
 */
const compareInputValues = async (project, projectData) => {
    // Destructure the project data
    const {
        title,
        description,
        cost,
        progress,
        start_date,
        due_date,
        completion_date,
        funding_source,
        implementing_agency,
        contract_term,
        contractor,
        status,
    } = projectData;

    // Get the current values of the project
    const {
        title: currentTitle,
        description: currentDescription,
        cost: currentCost,
        progress: currentProgress,
        start_date: currentStartDate,
        due_date: currentDueDate,
        completion_date: currentCompletionDate,
        status: currentStatus,
        funding_source: currentFundingSource,
        implementing_agency: currentImplementingAgency,
        contract_term: currentContractTerm,
        contractor: currentContractor,
    } = project;

    // // Compare the input values with the current values
    // // Throw an error if any of them are the same
    // ThrowErrorIf(
    //     title === currentTitle,
    //     'Title is the same as the current value',
    //     BadRequestError,
    // );
    // ThrowErrorIf(
    //     description === currentDescription,
    //     'Description is the same as the current value',
    //     BadRequestError,
    // );
    // ThrowErrorIf(
    //     funding_source === currentFundingSource,
    //     'Funding source is the same as the current value',
    //     BadRequestError,
    // );
    // ThrowErrorIf(
    //     cost === currentCost,
    //     'Cost is the same as the current value',
    //     BadRequestError,
    // );
    // ThrowErrorIf(
    //     progress === currentProgress,
    //     'Progress is the same as the current value',
    //     BadRequestError,
    // );
    // ThrowErrorIf(
    //     start_date === currentStartDate,
    //     'Start date is the same as the current value',
    //     BadRequestError,
    // );
    // ThrowErrorIf(
    //     due_date === currentDueDate,
    //     'Due date is the same as the current value',
    //     BadRequestError,
    // );
    // ThrowErrorIf(
    //     completion_date === currentCompletionDate,
    //     'Completion date is the same as the current value',
    //     BadRequestError,
    // );
    // ThrowErrorIf(
    //     status === currentStatus,
    //     'Status is the same as the current value',
    //     BadRequestError,
    // );
};

// -------------------------------- GET -------------------------------- //

/**
 * Filters projects based on the provided options, tags, barangays, and status.
 *
 * @param {Object} options - The options object containing the filter criteria.
 * @param {string} tags - The tags to filter projects by, separated by commas.
 * @param {string} barangays - The barangays to filter projects by, separated by commas.
 * @param {string} status - The status to filter projects by.
 */
const filterProjects = (options, tags, barangays, status) => {
    // Filter projects by tags
    if (tags) {
        const tagIds = tags.split(',').map(Number);
        options.include[0].where = {
            id: {
                [Op.in]: tagIds,
            },
        };
    }

    // Filter projects by barangays
    if (barangays) {
        const barangayIds = barangays.split(',').map(Number);
        options.include[1].where = {
            id: {
                [Op.in]: barangayIds,
            },
        };
    }

    // Filter projects by status
    if (status) {
        options.where = {
            ...options.where,
            status: status,
        };
    }
};


/**
 * Filters the options based on the given field and range.
 *
 * @param {object} options - The options object to filter.
 * @param {string} field - The field to filter on.
 * @param {string} range - The range to filter by.
 */
const filterRange = (options, field, range) => {
    // Check if the range starts with '<'
    if (range.startsWith('<')) {
        // Set the field value to be less than the parsed range value
        options.where = {
            ...options.where,
            [field]: { [Op.lt]: parseInt(range.slice(1)) },
        };
    }
    // Check if the range starts with '>'
    else if (range.startsWith('>')) {
        // Set the field value to be greater than the parsed range value
        options.where = {
            ...options.where,
            [field]: { [Op.gt]: parseInt(range.slice(1)) },
        };
    }
    // If the range does not start with '<' or '>'
    else {
        // Split the range into min and max values
        const [min, max] = range.split('-');
        // Set the field value to be between the parsed min and max values
        options.where = {
            ...options.where,
            [field]: { [Op.between]: [parseInt(min), parseInt(max)] },
        };
    }
};

/**
 * Sorts projects based on the given options and sort criteria.
 * @param {Object} options - The options object for sorting.
 * @param {string} sort - The sort criteria.
 */
const sortProjects = (options, sort) => {
    // Split the sort criteria into individual fields
    const sortFields = sort.split(',');

    // Create an array to store the sort order
    const order = [];

    // Iterate over each sort field
    for (let field of sortFields) {
        // Trim the field to remove leading/trailing spaces
        field = field.trim();

        // Check if the field is prefixed with '-' for descending order
        if (field.startsWith('-')) {
            // Remove the '-' prefix and add the field with descending order
            order.push([field.slice(1), 'DESC']);
        } else {
            // Add the field with ascending order
            order.push([field, 'ASC']);
        }
    }

    // Set the sort order in the options object
    options.order = order;
};

/**
 * Updates the options object to include a search condition for the project title.
 * @param {object} options - The options object.
 * @param {string} search - The search term.
 */
const searchProjectsByTitle = (options, search) => {
    // Update the where condition to include a search condition for the project title
    options.where = {
        ...options.where,
        title: { [Op.like]: `%${ search }%` },
    };
};

/**
 * Returns a query object for retrieving projects with optional filters and sorting.
 * @param {Object} queryParams - An object containing query parameters.
 * @param {string} queryParams.search - A string to search for in project titles.
 * @param {string} queryParams.tags - An string of tag IDs to filter projects by.
 * @param {string} queryParams.barangays - An string of barangay IDs to filter projects by.
 * @param {string} queryParams.status - A string to filter projects by status.
 * @param {string} queryParams.sort - A string to sort projects by.
 * @param {string} queryParams.progressRange - A string to filter projects by progress range.
 * @param {string} queryParams.costRange - A string to filter projects by cost range.
 * @param {string} queryParams.page - A string to specify the page number for pagination.
 * @param {string} queryParams.limit - A string to specify the number of projects per page for pagination.
 * @returns {Object} - A Sequelize query object.
 */
const getProjectQuery = ({
                             search,
                             tags,
                             barangays,
                             status,
                             sort,
                             progressRange,
                             costRange,
                             page = "1",
                             limit = "10",
                         }) => {
    // Set default options
    const options = {
        include: [
            {
                model: Tag,
                as: 'tags',
                attributes: ['id', 'name'],
                through: { attributes: [] },
            },
            {
                model: Barangay,
                as: 'barangays',
                attributes: ['id', 'name'],
                through: { attributes: [] },
            },
            {
                model: Comment,
                as: 'comments',
                attributes: [],
            },
            {
                model: Media,
                as: 'media',
                attributes: ['id', 'url', 'mime_type', 'size'],
            },
            {
                model: Reaction,
                as: 'reactions',
                attributes: ['id', 'reaction_type', 'reacted_by'],
            },
        ],
        order: [['createdAt', 'DESC']],
    };

    // Search projects by title if search query is provided
    search && searchProjectsByTitle(options, search);

    // Filter projects by tags, barangays, or status if any of them are provided
    (tags || barangays || status) && filterProjects(options, tags, barangays, status);

    // Sort projects by the specified field if sort query is provided
    sort && sortProjects(options, sort);

    // Filter projects by progress range if progressRange query is provided
    progressRange && filterRange(options, 'progress', progressRange);

    // Filter projects by cost range if costRange query is provided
    costRange && filterRange(options, 'cost', costRange);

    // Paginate projects if page and limit query parameters are provided
    (page && limit) && paginationControllerFunc(page, limit, options);

    return options;
};


module.exports = {
    getProjectQuery,
    validateAndUpdateProject,
    validationCreate,
};
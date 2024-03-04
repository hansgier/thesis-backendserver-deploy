const fs = require('fs');
const path = require('path');
const { StatusCodes } = require("http-status-codes");
const {
    projects: Project,
    media: Media,
    progressHistories: ProgressHistory,
} = require('../models');
const {
    ThrowErrorIf,
    BadRequestError,
    NotFoundError,
    ConflictError,
} = require("../errors");
const {
    getProgressHistoryQuery,
    validationInput,
} = require("../utils/helpers");
const {
    createMediaRecord,
    handleError,
} = require('../utils/helpers/progressHistoriesHelpers');
const { checkPermissions } = require("../utils");

/**
 * Creates a progress history for a project.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the progress history is created.
 */
const createProgressHistory = async (req, res) => {
    const { projectId } = req.params;
    const { date, remarks, progress } = req.body;

    try {
        validationInput({ projectId, date, remarks, progress }, 'create');

        // Find the project by its ID
        const project = await Project.findByPk(projectId);
        ThrowErrorIf(!project, 'Project not found', NotFoundError);

        checkPermissions(req.user, project.createdBy);

        const projectProgressHistories = await project.getProgressHistories();
        projectProgressHistories.map((progressHistory) => {
            ThrowErrorIf(
                progressHistory.dataValues.progress === Number(progress) && progressHistory.dataValues.project_id === project.id,
                "Progress value for project already exists",
                ConflictError,
            );
        });

        if (Number(progress) === 100) {
            project.status = "completed";
            project.progress = 100;
            project.completion_date = date;
            await project.save();
        } else {
            project.progress = Number(progress);
            project.status = "ongoing";
            await project.save();
        }

        // Create the progress history record
        const progressHistory = await project.createProgressHistory({
            date,
            remarks,
            progress: Number(progress),
        }, {
            include: [
                {
                    model: Media,
                    as: 'media',
                    attributes: ['url', 'mime_type'],
                },
            ],
        });

        // Create media records for each file in the request
        const mediaRecords = await Promise.all(req.files.map(file => createMediaRecord(file, progressHistory, project)));

        // Add the media records to the progress history
        await progressHistory.addMedia(mediaRecords);

        // Reload the progress history to include the newly added media records
        await progressHistory.reload();

        // Send the response
        res.status(StatusCodes.CREATED).json({
            msg: 'Progress History created',
            project_id: projectId,
            progressHistory,
        });
    } catch (error) {
        // Handle any errors that occur
        await handleError(error, req.files, projectId);
    }
};

/**
 * Retrieves all progress history for a specific project.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise} - A promise that resolves to the response object.
 */
const getAllProgressHistory = async (req, res) => {
    // Extract the projectId from the request parameters
    const { projectId } = req.params;

    // Generate the options object for retrieving progress history
    const options = getProgressHistoryQuery(req.query);

    // Throw an error if projectId is missing or invalid
    ThrowErrorIf(!projectId || projectId === ':projectId' || projectId === '', 'Project id is required', BadRequestError);

    // Find the project by its id
    const project = await Project.findByPk(projectId);

    // Throw an error if project is not found
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    // Count the total number of progress histories
    const count = await ProgressHistory.count();

    // Retrieve the progress histories for the project
    const progressHistories = await project.getProgressHistories(options);

    // Return a response with the progress histories
    if (progressHistories.length < 1) {
        return res.status(StatusCodes.OK).json({ msg: 'No progress history' });
    } else {
        return res.status(StatusCodes.OK).json({
            totalCount: count,
            count: progressHistories.length,
            progressHistories,
        });
    }
};

/**
 * Retrieves the progress history for a specific project.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void}
 */
const getProgressHistory = async (req, res) => {
    // Extract the project ID and progress history ID from the request parameters
    const { projectId, id } = req.params;

    // Throw an error if the project ID or progress history ID is missing or invalid
    ThrowErrorIf(!projectId || projectId === ':projectId' || projectId === '', 'Project id is required', BadRequestError);
    ThrowErrorIf(!id || id === ':id' || id === '', 'Progress history id is required', BadRequestError);

    // Find the project by its ID
    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    // Find the progress history by its ID, including related media information
    const progressHistory = await ProgressHistory.findOne({
        where: {
            id,
            project_id: projectId,
        },
        include: [
            {
                model: Media,
                as: 'media',
                attributes: ['url', 'mime_type', 'size', 'recorded_date'],
            },
        ],
    });
    ThrowErrorIf(!progressHistory, 'Progress history not found', NotFoundError);

    // Send the progress history as the response
    res.status(StatusCodes.OK).json({ progressHistory });
};

/**
 * Edit the progress history of a project.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the progress history is updated.
 */
const editProgressHistory = async (req, res) => {
    // Destructure the request parameters and body
    const { projectId, id } = req.params;
    const { date, remarks, progress } = req.body;

    // Validate the input data
    validationInput({ projectId, id, date, remarks, progress }, "edit");

    // Find the project by its primary key
    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, "Project not found", NotFoundError);

    checkPermissions(req.user, project.createdBy);

    // Find the progress history by its primary key
    const progressHistory = await ProgressHistory.findByPk(id);
    ThrowErrorIf(!progressHistory, "Progress history not found", NotFoundError);

    // Check if the progress value already exists for the project
    const existingProgress = await ProgressHistory.findOne({
        where: {
            project_id: projectId,
            progress: Number(progress),
        },
    });
    ThrowErrorIf(existingProgress, "Progress value for project already exists", ConflictError);

    // Update the progress history attributes
    progressHistory.date = date || progressHistory.date;
    progressHistory.remarks = remarks || progressHistory.remarks;
    progressHistory.progress = progress || progressHistory.progress;

    // Save the progress history
    await progressHistory.save();

    // Update the project attributes
    if (Number(progress) === 100) {
        project.status = "completed";
        project.progress = 100;
        project.completion_date = date || progressHistory.date;
    } else {
        project.status = "ongoing";
        project.progress = Number(progress) || progressHistory.progress;
    }

    // Save the project
    await project.save();

    // Send a success response with the updated progress history
    res.status(StatusCodes.OK).json({ msg: `Progress history ID: ${ id } updated`, progressHistory });
};


/**
 * Delete the progress history and associated media files for a project
 *
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
const deleteProgressHistory = async (req, res) => {
    // Get the project ID and progress history ID from the request parameters
    const { projectId, id } = req.params;

    // Validate the input parameters
    validationInput({ projectId, id }, 'delete');

    // Find the project by its ID
    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, "Project not found", NotFoundError);

    checkPermissions(req.user, project.createdBy);

    // Find the progress history by its ID
    const progressHistory = await ProgressHistory.findByPk(id);
    ThrowErrorIf(!progressHistory, "Progress history not found", NotFoundError);

    // Get the associated media records for the progress history
    const mediaRecords = await progressHistory.getMedia();

    // Delete the media files associated with the progress history
    await Promise.all(
        mediaRecords.map(async (media) => {
            // Get the file path for the media file
            const filePath = path.normalize(
                path.join(__dirname, "../", media.url),
            );

            // Delete the media file
            await fs.promises.unlink(filePath);
        }),
    );

    // Delete the progress history
    await progressHistory.destroy();

    // Return a success response
    res
        .status(StatusCodes.OK)
        .json({ msg: "Progress history and media files deleted" });
};

/**
 * Delete all progress histories and associated media files for a given project.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with a success message.
 */
const deleteAllProgressHistory = async (req, res) => {
    // Get the projectId from the request parameters
    const { projectId } = req.params;
    // Validate the input
    validationInput({ projectId }, 'deleteAll');

    // Find the project by its id
    const project = await Project.findByPk(projectId);
    // Throw an error if the project is not found
    ThrowErrorIf(!project, "Project not found", NotFoundError);

    checkPermissions(req.user, project.createdBy);

    // Get all progress histories associated with the project
    const progressHistories = await project.getProgressHistories();

    // If there are no progress histories, return a success message
    if (progressHistories.length < 1)
        return res.status(StatusCodes.OK).json({ msg: "No progress history" });

    // Delete all associated media files for each progress history
    await Promise.all(
        progressHistories.map(async (progressHistory) => {
            const mediaRecords = await progressHistory.getMedia();
            await Promise.all(
                mediaRecords.map(async (media) => {
                    const filePath = path.normalize(
                        path.join(__dirname, "../", media.url),
                    );
                    await fs.promises.unlink(filePath);
                }),
            );
        }),
    );

    // Delete all progress histories for the project
    await ProgressHistory.destroy({ where: { project_id: project.id } });

    // Return a success message
    return res
        .status(StatusCodes.OK)
        .json({ msg: "All progress histories and media files deleted" });
};


module.exports = {
    createProgressHistory,
    getAllProgressHistory,
    getProgressHistory,
    editProgressHistory,
    deleteProgressHistory,
    deleteAllProgressHistory,
};


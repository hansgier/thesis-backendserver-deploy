const fs = require('fs');
const path = require('path');
const { StatusCodes } = require("http-status-codes");
const {
    sequelize,
    projects: Project,
    media: Media,
    updates: Update,
} = require('../models');
const {
    ThrowErrorIf,
    BadRequestError,
    NotFoundError,
    ConflictError,
} = require("../errors");
const {
    getUpdateQuery,
    validationInput,
} = require("../utils/helpers");
const {
    createMediaRecord,
    handleError,
} = require('../utils/helpers/updatesHelpers');
const { checkPermissions } = require("../utils");
const { cloudinary } = require("../config/cloudinaryConfig");
const { Op } = require("sequelize");

/**
 * Creates an update for a project.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the update is created.
 */
const createUpdate = async (req, res) => {
    const { projectId } = req.params;
    const { remarks, progress, uploadedImages } = req.body;

    const t = await sequelize.transaction();

    try {
        validationInput({ projectId, remarks, progress }, 'create');

        // Find the project by its ID
        const project = await Project.findByPk(projectId, { transaction: t });
        ThrowErrorIf(!project, 'Project not found', NotFoundError);

        checkPermissions(req.user, project.createdBy);

        const projectUpdates = await project.getUpdates({ transaction: t });
        projectUpdates.map((update) => {
            ThrowErrorIf(
                update.dataValues.progress === Number(progress) && update.dataValues.project_id === project.id,
                "Progress value for project already exists",
                ConflictError,
            );
        });

        if (Number(progress) === 100) {
            project.status = "completed";
            project.progress = 100;
            await project.save({ transaction: t });
        } else {
            project.progress = Number(progress);
            project.status = "ongoing";
            await project.save({ transaction: t });
        }

        // Create the update record
        const update = await project.createUpdate({
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
            transaction: t,
        });

        // Create media records
        const mediaRecords = await Promise.all(
            uploadedImages.map((image) =>
                Media.create(
                    {
                        url: image.secure_url,
                        mime_type: image.resource_type,
                        size: image.bytes,
                        update_id: update.id,
                        project_id: projectId,
                    },
                    { transaction: t },
                ),
            ),
        );

        // Add the media records to the update
        await update.addMedia(mediaRecords, { transaction: t });

        // Reload the update to include the newly added media records
        await update.reload({ transaction: t });

        // Commit the transaction
        await t.commit();

        // Send the response
        res.status(StatusCodes.CREATED).json({
            msg: 'Update created',
            project_id: projectId,
            update,
        });
    } catch (error) {
        // Get the public IDs of the uploaded images
        const publicIdsToDelete = uploadedImages.map((image) => image.public_id);

        // Rollback the transaction
        await t.rollback();

        // Delete the uploaded images from Cloudinary
        await Promise.all(publicIdsToDelete.map((publicId) => cloudinary.uploader.destroy(publicId)));

        // Handle any errors that occur
        await handleError(error, req.files, projectId);
    }
};

/**
 * Retrieves all update for a specific project.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise} - A promise that resolves to the response object.
 */
const getAllUpdate = async (req, res) => {
    // Extract the projectId from the request parameters
    const { projectId } = req.params;

    // Generate the options object for retrieving update
    const options = getUpdateQuery(req.query);

    // Throw an error if projectId is missing or invalid
    ThrowErrorIf(!projectId || projectId === ':projectId' || projectId === '', 'Project id is required', BadRequestError);

    // Find the project by its id
    const project = await Project.findByPk(projectId);

    // Throw an error if project is not found
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    // Count the total number of updates
    const count = await Update.count();

    // Retrieve the updates for the project
    const updates = await project.getUpdates(options);

    // Return a response with the updates
    if (updates.length < 1) {
        return res.status(StatusCodes.OK).json({ msg: 'No update' });
    } else {
        return res.status(StatusCodes.OK).json({
            totalCount: count,
            count: updates.length,
            updates,
        });
    }
};

/**
 * Retrieves the update for a specific project.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void}
 */
const getUpdate = async (req, res) => {
    // Extract the project ID and update ID from the request parameters
    const { projectId, id } = req.params;

    // Find the project by its ID
    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    // Find the update by its ID, including related media information
    const update = await Update.findOne({
        where: {
            id,
            project_id: projectId,
        },
        include: [
            {
                model: Media,
                as: 'media',
                attributes: ['id', 'url'],
            },
        ],
    });
    ThrowErrorIf(!update, 'Update not found', NotFoundError);

    // Send the update as the response
    res.status(StatusCodes.OK).json({ update });
};

/**
 * Edit the update of a project.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the update is updated.
 */
const editUpdate = async (req, res) => {
    // Destructure the request parameters and body
    const { projectId, id } = req.params;
    const { remarks, progress, uploadedImages } = req.body;

    const t = await sequelize.transaction();

    try {
        // Find the project by its primary key
        const project = await Project.findByPk(projectId, { transaction: t });
        ThrowErrorIf(!project, "Project not found", NotFoundError);

        checkPermissions(req.user, project.createdBy);

        // Find the update by its primary key
        const update = await Update.findByPk(id, { transaction: t });
        ThrowErrorIf(!update, "Update not found", NotFoundError);

        // Check if the progress value already exists for the project
        const existingProgress = await Update.findOne({
            where: {
                project_id: projectId,
                progress: Number(progress),
                id: { [Op.ne]: id }, // Exclude the current update
            },
            transaction: t,
        });
        ThrowErrorIf(existingProgress, "Progress value for project already exists", ConflictError);

        // Update the update attributes
        update.remarks = remarks || update.remarks;
        update.progress = progress || update.progress;

        // Save the update
        await update.save({ transaction: t });

        // Handle image uploads
        const uploadedImages = req.body.uploadedImages || [];
        const existingMedia = await update.getMedia({ transaction: t });

        // Remove existing media records that are not present in the new uploads
        const mediaToRemove = existingMedia.filter(
            (media) => !uploadedImages.some((upload) => upload.split('/').pop().split('.')[0] === media.url.split('/').pop().split('.')[0]),
        );
        await Promise.all(mediaToRemove.map((media) => media.destroy({ transaction: t })));

        // Get the public IDs of the removed media records
        const publicIdsToDelete = mediaToRemove.map((media) => media.url.split('/').pop().split('.')[0]);

        // Delete the removed media from Cloudinary
        await Promise.all(publicIdsToDelete.map((publicId) => cloudinary.uploader.destroy(publicId)));

        // Create new media records for the uploaded images
        const newMedia = uploadedImages.filter(
            (upload) => !existingMedia.some((media) => media.url.split('/').pop().split('.')[0] === upload.public_id),
        );
        const mediaRecords = await Promise.all(
            newMedia.map((upload) =>
                Media.create(
                    {
                        url: upload.secure_url,
                        mime_type: upload.resource_type,
                        size: upload.bytes,
                        update_id: update.id,
                        project_id: projectId,
                    },
                    { transaction: t },
                ),
            ),
        );
        await update.addMedia(mediaRecords, { transaction: t });

        // Reload the update to include the newly added media records
        await update.reload({ transaction: t, include: [{ model: Media, as: 'media' }] });

        // Update the project attributes
        if (Number(progress) === 100) {
            project.status = "completed";
            project.progress = 100;
            project.completion_date = new Date();
        } else {
            project.status = "ongoing";
            project.progress = Number(progress) || update.progress;
        }

        // Save the project
        await project.save({ transaction: t });

        // Commit the transaction
        await t.commit();

        // Send a success response with the updated update
        res.status(StatusCodes.OK).json({ msg: `Update ID: ${ id } updated`, update });
    } catch (error) {
        // Get the public IDs of the uploaded images
        const publicIdsToDelete = uploadedImages.map((image) => image.public_id);

        // Rollback the transaction
        await t.rollback();

        // Delete the uploaded images from Cloudinary
        await Promise.all(publicIdsToDelete.map((publicId) => cloudinary.uploader.destroy(publicId)));

        // Handle any errors that occur
        await handleError(error, req.files, projectId);
    }
};


/**
 * Delete the update and associated media files for a project
 *
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
const deleteUpdate = async (req, res) => {
    // Get the project ID and update ID from the request parameters
    const { projectId, id } = req.params;
    
    // Find the project by its ID
    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, "Project not found", NotFoundError);

    checkPermissions(req.user, project.createdBy);

    // Find the update by its ID
    const update = await Update.findByPk(id);
    ThrowErrorIf(!update, "Update not found", NotFoundError);

    // Get the associated media records for the update
    const mediaRecords = await update.getMedia();

    // Delete the media files associated with the update from Cloudinary
    await Promise.all(
        mediaRecords.map(async (media) => {
            const publicId = media.url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }),
    );

    // Delete the update
    await update.destroy();

    // Return a success response
    res
        .status(StatusCodes.OK)
        .json({ msg: "Update and media files deleted" });
};

/**
 * Delete all updates and associated media files for a given project.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with a success message.
 */
const deleteAllUpdate = async (req, res) => {
    // Get the projectId from the request parameters
    const { projectId } = req.params;
    // Validate the input
    validationInput({ projectId }, 'deleteAll');

    // Find the project by its id
    const project = await Project.findByPk(projectId);
    // Throw an error if the project is not
    ThrowErrorIf(!project, "Project not found", NotFoundError);

    checkPermissions(req.user, project.createdBy);

    // Get all updates
    const updates = await project.getUpdates();

    // If there are no updates, return a success message
    if (updates.length < 1)
        return res.status(StatusCodes.OK).json({ msg: "No update" });

    // Delete all associated media files for each update from Cloudinary
    await Promise.all(
        updates.map(async (update) => {
            const mediaRecords = await update.getMedia();
            await Promise.all(
                mediaRecords.map(async (media) => {
                    const publicId = media.url.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                }),
            );
        }),
    );

    // Delete all updates for the project
    await Update.destroy({ where: { project_id: project.id } });

    // Return a success message
    return res
        .status(StatusCodes.OK)
        .json({ msg: "All updates and media files deleted" });
};


module.exports = {
    createUpdate,
    getAllUpdate,
    getUpdate,
    editUpdate,
    deleteUpdate,
    deleteAllUpdate,
};


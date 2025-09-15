const { StatusCodes } = require("http-status-codes");
const {
    sequelize,
    projects: Project,
    updates: Update,
    media: Media,
} = require('../models');
const { ThrowErrorIf, NotFoundError, BadRequestError } = require("../errors");
const { getMediaQuery } = require("../utils/helpers");
const { deleteMediaFiles, createMediaRecords, deleteUploadedFiles } = require("../utils/helpers/mediaHelpers");
const { checkPermissions, cacheExpiries } = require("../utils");
const cloudinary = require("cloudinary").v2;

const uploadMedia = async (req, res) => {
    await cloudinary.uploader.upload(req.file.path, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                msg: "Error uploading the image",
            });
        } else {
            return res.status(StatusCodes.OK).json({
                success: true,
                msg: "Image uploaded successfully",
                image_url: result,
            });
        }
    });
};

/**
 * Retrieves all media based on the provided parameters.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAllMedia = async (req, res) => {
    // Extract the required parameters from the request
    const { projectId, updateId } = req.params;
    const options = getMediaQuery(req.query);

    let result = {};

    const getMediaResult = async (model, id, options) => {
        // Find the entity by its ID
        const entity = await model.findByPk(id);
        ThrowErrorIf(!entity, `${ model.name } not found`, NotFoundError);

        // Retrieve the media associated with the entity
        const media = await entity.getMedia(options);

        // Count the total number of media associated with the entity
        const count = await entity.countMedia();

        return {
            [`${ model.name.toLowerCase() }_id`]: entity.id,
            totalCount: count,
            count: media.length,
            media,
        };
    };

    // Determine which model and ID to use based on the provided parameters
    if (updateId && projectId)
        result = await getMediaResult(Update, updateId, options);
    else if (projectId)
        result = await getMediaResult(Project, projectId, options);
    else
        throw new BadRequestError('Id is required');


    // Send the result as a JSON response
    res.status(StatusCodes.OK).json({ result });
};

/**
 * Updates the media for a project or update.
 *
 * @param {Object} req - The request object containing parameters and files.
 * @param {Object} res - The response object used to send the response.
 * @returns {Promise<void>} - A promise that resolves when the media is updated.
 */
const updateMedia = async (req, res) => {
    const { projectId, updateId } = req.params;
    const { newUploadedImages } = req.body;

    try {
        let result;
        ThrowErrorIf(!projectId, "ProjectId is required", BadRequestError);

        result = await sequelize.transaction(async (t) => {
            // Find the project
            const project = await Project.findByPk(projectId, {
                transaction: t,
                attributes: ["id", "title"],
                include: [
                    {
                        model: Media,
                        as: "media",
                        attributes: ["id", "url", "mime_type", "size", "createdAt", "updatedAt"],
                    },
                ],
            });

            // Throw an error if project is not found
            ThrowErrorIf(!project, "Project not found", NotFoundError);

            // Check if the user has permissions to update media in the project
            checkPermissions(req.user, project.createdBy);

            // Get all existing media associated with the project
            const existingMedia = project.media;

            // Delete existing media files that are not part of the new uploads
            const existingMediaToDelete = existingMedia.filter(media => !newUploadedImages.some(upload => upload.secure_url === media.url));
            await deleteMediaFiles(existingMediaToDelete, t);

            // Create new media records for new uploads
            const newMediaRecords = await Promise.all(newUploadedImages.map(upload => Media.create({
                url: upload.secure_url,
                mime_type: upload.resource_type,
                size: upload.bytes,
            }, { transaction: t })));

            // Associate the new media records with the project
            await project.setMedia(newMediaRecords, { transaction: t });

            return project;
        });

        // Reload the result to include the updated media
        await result.reload();

        // Send the response
        res.status(StatusCodes.OK).json({
            project: {
                id: result.id,
                media: result.media,
            },
        });
    } catch (e) {
        throw e;
    }

    // const { projectId, updateId } = req.params;
    // const files = req.file;
    //
    // try {
    //     let result;
    //
    //     // Check if files were uploaded
    //     if (!files) {
    //         return res.status(StatusCodes.OK).json({ msg: "You have not uploaded any files" });
    //     }
    //
    //     if (updateId && projectId) {
    //         result = await sequelize.transaction(async (t) => {
    //             // Find the update
    //             const update = await Update.findOne({
    //                 where: { project_id: projectId, id: updateId },
    //                 transaction: t,
    //             });
    //
    //             // Throw an error if update is not found
    //             ThrowErrorIf(!update, "Update not found", NotFoundError);
    //
    //             // Delete existing media files
    //             const updateMedia = await update.getMedia({ transaction: t });
    //             await deleteMediaFiles(updateMedia, t);
    //
    //             // Create new media records and associate them with the update
    //             const newMediaRecords = await createMediaRecords(files, projectId, updateId, t);
    //             await update.setMedia(newMediaRecords, { transaction: t });
    //
    //             return update;
    //         });
    //     } else if (projectId) {
    //         result = await sequelize.transaction(async (t) => {
    //             // Find the project
    //             const project = await Project.findByPk(projectId, {
    //                 transaction: t,
    //                 attributes: ["id"],
    //                 include: [
    //                     {
    //                         model: Media,
    //                         as: "media",
    //                         attributes: ["url", "mime_type", "size", "createdAt", "updatedAt"],
    //                     },
    //                 ],
    //             });
    //
    //             // Throw an error if project is not found
    //             ThrowErrorIf(!project, "Project not found", NotFoundError);
    //
    //             // Delete existing media files
    //             const projectMedia = await project.getMedia({ transaction: t });
    //             await deleteMediaFiles(projectMedia, t);
    //
    //             // Create new media records and associate them with the project
    //             const newMediaRecords = await createMediaRecords(files, projectId, null, t);
    //             await project.setMedia(newMediaRecords, { transaction: t });
    //
    //             return project;
    //         });
    //     } else {
    //         new BadRequestError('Id is required');
    //     }
    //
    //     // Reload the result to include the updated media
    //     await result.reload();
    //
    //     // Send the response
    //     res.status(StatusCodes.OK).json({
    //         [`${ projectId && updateId ? "update" : "project" }`]: {
    //             id: result.id,
    //             media: result.media,
    //         },
    //     });
    // } catch (e) {
    //     // Delete any uploaded files in case of an error
    //     await deleteUploadedFiles(files);
    //     throw e;
    // }
};

const deleteMedia = async (req, res) => {
    const { id, projectId, updateId } = req.params;
    const url = req.headers.media_url;

    ThrowErrorIf(!url, "Url is required", BadRequestError);


    if (!projectId && !updateId && url) {
        const public_id = url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(public_id);
        return res.status(StatusCodes.OK).json({ msg: 'Media deleted successfully' });
    }

    const t = await sequelize.transaction();
    try {
        // Find the project by its ID
        const project = await Project.findByPk(projectId, { transaction: t });
        ThrowErrorIf(!project, "Project not found", NotFoundError);

        // Check if the user has permissions to delete media in the project
        checkPermissions(req.user, project.createdBy);

        let media;

        // If updateId is provided, find the media associated with the update
        if (updateId) {
            const update = await Update.findOne({
                where: { project_id: projectId, id: updateId },
                transaction: t,
            });
            ThrowErrorIf(!update, "Update not found", NotFoundError);

            media = await Media.findOne({
                where: { id, update_id: updateId },
                transaction: t,
            });
        }
        // If updateId is not provided, find the media associated with the project
        else {
            media = await Media.findOne({
                where: { id, project_id: projectId },
                transaction: t,
            });
        }


        // Throw an error if media is not found
        ThrowErrorIf(!media, "Media not found", NotFoundError);

        // Delete the media file from Cloudinary
        const public_id = media.url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(public_id);

        // Delete the media record from the database
        await media.destroy({ transaction: t });

        await t.commit();

        res.status(StatusCodes.OK).json({ msg: 'Media deleted successfully' });
    } catch (e) {
        await t.rollback();
        console.log("error");
        throw e;
    }
};

/**
 * Deletes all media associated with a project or update.
 *
 * @param {Object} req - The request object containing parameters.
 * @param {Object} res - The response object to send back to the client.
 * @returns {Object} - The response object with a success message.
 */
const deleteAllMedia = async (req, res) => {
    const { projectId, updateId } = req.params;

    // If both projectId and updateId are provided
    const t = await sequelize.transaction();
    try {
        if (projectId && updateId) {
            // Find the project by its ID
            const project = await Project.findByPk(projectId, { transaction: t });
            ThrowErrorIf(!project, "Project not found", NotFoundError);

            // Find the update by project ID and update ID
            const update = await Update.findOne({
                where: { project_id: projectId, id: updateId },
            }, { transaction: t });
            ThrowErrorIf(!update, "Update not found", NotFoundError);

            // Check if the user has permissions to delete media in the project
            checkPermissions(req.user, project.createdBy);

            // Get all media associated with the update
            const updateMedia = await update.getMedia({ transaction: t });

            // Delete the media files
            await deleteMediaFiles(updateMedia, t);
        }
        // If only projectId is provided
        else if (projectId) {
            // Find the project by its ID
            const project = await Project.findByPk(projectId, { transaction: t });
            ThrowErrorIf(!project, "Project not found", NotFoundError);

            // Check if the user has permissions to delete media in the project
            checkPermissions(req.user, project.createdBy);

            // Get all media associated with the project
            const projectMedia = await project.getMedia({ transaction: t });

            // Delete the media files
            await deleteMediaFiles(projectMedia, t);
        }
        // If neither projectId nor updateId is provided
        else {
            throw new BadRequestError('Id is required');
        }

        await t.commit();

        // Send back a success message to the client
        res.status(StatusCodes.OK).json({
            msg: projectId && updateId
                ? 'All update media deleted'
                : 'All project media deleted',
        });
    } catch (e) {
        await t.rollback();
        throw e;
    }

};

const deleteAllUnassociatedMedia = async (req, res) => {
    // Retrieve all media files from Cloudinary
    const { resources } = await cloudinary.search
        .expression('resource_type:auto')
        .sort_by('public_id', 'desc')
        .max_results(30)
        .execute();

    // Retrieve all media URLs from the database
    const databaseMediaUrls = await Media.findAll({
        attributes: ['url'],
        raw: true,
    });

    // Convert database URLs to an array
    const databaseUrls = databaseMediaUrls.map((media) => media.url);

    // Find unassociated media by comparing Cloudinary resources with database URLs
    const unassociatedMedia = resources.filter(
        (resource) => !databaseUrls.includes(resource.secure_url),
    );

    // Delete unassociated media from Cloudinary
    for (const media of unassociatedMedia) {
        const publicId = media.public_id;
        await cloudinary.uploader.destroy(publicId);
    }
    res.status(StatusCodes.OK).json({ message: 'Unassociated media deleted successfully' });
};

module.exports = {
    getAllMedia,
    updateMedia,
    deleteAllMedia,
    uploadMedia,
    deleteMedia,
    deleteAllUnassociatedMedia,
};
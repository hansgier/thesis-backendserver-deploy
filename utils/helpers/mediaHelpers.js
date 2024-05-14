const fs = require('fs');
const path = require('path');
const { media: Media } = require('../../models');
const { Op } = require("sequelize");
const { ThrowErrorIf, BadRequestError } = require("../../errors");
const { paginationControllerFunc } = require("../index");
const { cloudinary } = require("../../config/cloudinaryConfig");

// -------------------------------------- CREATE -------------------------------------- //

/**
 * Create media records for the given files.
 * @param {Array} files - Array of files to create media records for.
 * @param {string} projectId - ID of the project associated with the media records.
 * @param {string} updateId - ID of the update associated with the media records.
 * @param {Object} transaction - Transaction object for database operations.
 * @returns {Promise<Array>} - Promise that resolves to an array of created media records.
 */
const createMediaRecords = async (files, projectId, updateId, transaction) => {
    // Loop through the files and create media records
    return await Promise.all(
        files.map(async (file) => {
            return await Media.create(
                {
                    url: file.path,
                    mime_type: file.mimetype,
                    size: file.size,
                    project_id: projectId,
                    update_id: updateId,
                },
                { transaction },
            );
        }),
    );
};

// -------------------------------------- UPDATE -------------------------------------- //

/**
 * Delete the media files from the file system and the database.
 * @param {Array} mediaFiles - The array of media files to delete.
 * @param {Object} transaction - The transaction object for the database operation.
 */
const deleteMediaFiles = async (mediaFiles, transaction) => {
    // Loop through the media files
    await Promise.all(
        mediaFiles.map(async (media) => {
            // Delete the file from Cloudinary
            const publicId = media.url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);

            // Delete the media record from the database
            await media.destroy({ transaction });
        }),
    );
};

// -------------------------------------- DELETE -------------------------------------- //

/**
 * Deletes the uploaded files from cloudinary
 *
 * @param {Array} files - Array of file objects to be deleted
 */
const deleteUploadedFiles = async (files) => {
    // Loop through the files and delete them
    await Promise.all(
        files.map(async (file) => {
            // Extract the public ID from the file path
            const publicId = file.path.split("/").pop().split(".")[0];

            // Delete the file from Cloudinary
            await cloudinary.uploader.destroy(publicId);
        }),
    );
};


// -------------------------------------- GET -------------------------------------- //
/**
 * Returns the options object for a media query.
 *
 * @param {object} query - The query object containing the parameters for the media query.
 * @param {string} query.type - The type of media.
 * @param {string} query.page - The page number for pagination.
 * @param {string} query.limit - The limit of items per page for pagination.
 * @returns {object} - The options object for the media query.
 */
function getMediaQuery(query) {
    // Destructure the type, page, and limit properties from the query object
    const { type, page, limit } = query;

    // Create the base options object with common attributes and ordering
    const options = {
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'url', 'mime_type', 'size', 'createdAt', 'updatedAt'],
    };

    // Apply the type filter if it is provided
    type && filterMedia(options, type);

    // Apply the pagination if both the page and limit are provided
    (page && limit) && paginationControllerFunc(page, limit, options);

    // Return the options object
    return options;
}

/**
 * Filters media based on options and type.
 *
 * @param {object} options - The options for filtering.
 * @param {string} type - The type of media to filter.
 * @throws {BadRequestError} - If the type is invalid.
 */
const filterMedia = (options, type) => {
    const validTypes = ["image", "video"];
    ThrowErrorIf(!validTypes.includes(type), `Invalid type: ${ type }`, BadRequestError);
    const [mediaType] = type.split("/");
    options.where = {
        mime_type: {
            [Op.like]: `%${ mediaType }%`,
        },
    };
};


module.exports = {
    getMediaQuery,
    deleteMediaFiles,
    createMediaRecords,
    deleteUploadedFiles,
};
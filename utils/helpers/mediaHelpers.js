const fs = require('fs');
const path = require('path');
const { media: Media } = require('../../models');
const { Op } = require("sequelize");
const { ThrowErrorIf, BadRequestError } = require("../../errors");
const { paginationControllerFunc } = require("../index");

// -------------------------------------- CREATE -------------------------------------- //

/**
 * Create media records for the given files.
 * @param {Array} files - Array of files to create media records for.
 * @param {string} projectId - ID of the project associated with the media records.
 * @param {string} progressHistoryId - ID of the progress history associated with the media records.
 * @param {Object} transaction - Transaction object for database operations.
 * @returns {Promise<Array>} - Promise that resolves to an array of created media records.
 */
const createMediaRecords = async (files, projectId, progressHistoryId, transaction) => {
    // Loop through the files and create media records
    return await Promise.all(
        files.map(async (file) => {
            return await Media.create(
                {
                    url: file.path,
                    mime_type: file.mimetype,
                    size: file.size,
                    recorded_date: file.filename.split("_")[1],
                    project_id: projectId,
                    progressHistory_id: progressHistoryId,
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
            // Get the file path
            const filePath = path.normalize(path.join(__dirname, "../../", media.url));

            // Delete the file from the file system
            await fs.promises.unlink(filePath);

            // Delete the media record from the database
            await media.destroy({ transaction });
        }),
    );
};

// -------------------------------------- DELETE -------------------------------------- //

/**
 * Deletes the uploaded files from the file system.
 *
 * @param {Array} files - Array of file objects to be deleted
 */
const deleteUploadedFiles = async (files) => {
    // Loop through the files and delete them
    await Promise.all(
        files.map(async (file) => {
            // Get the file path
            const filePath = path.normalize(path.join(__dirname, "../../", file.path));

            // Delete the file from the file system
            await fs.promises.unlink(filePath);
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
        attributes: ['id', 'url', 'mime_type', 'size', 'recorded_date', 'createdAt', 'updatedAt'],
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
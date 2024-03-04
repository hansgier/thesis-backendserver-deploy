const multer = require('multer');
const { BadRequestError } = require("../errors");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, `${ Date.now() }_${ file.originalname }`);
    },
});

/**
 * Filter files based on their type and size.
 *
 * @param {Object} req - The request object.
 * @param {Object} file - The file object.
 * @param {function} cb - The callback function.
 */
const fileFilter = (req, file, cb) => {
    // Check the file type
    if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
        // Accept the file
        cb(null, true);
    } else {
        // Reject the file
        cb(new BadRequestError('Invalid file type'), false);
    }

    // Check the file size
    if (file.size > 10 * 1024 * 1024) {
        // Reject the file
        cb(new BadRequestError('File size must be less than 10MB'), false);
    }
};

module.exports = multer({ storage, fileFilter });

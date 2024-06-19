const router = require('express').Router();
const upload = require('../config/multer');
const { authenticateUser, authorizePermission } = require('../middlewares/authentication');
const {
    addProject,
    getAllProjects,
    getProject,
    updateProject,
    deleteProject,
    deleteAllProjects,
} = require('../controllers/projectController');
const {
    getAllProjectComments,
    deleteProjectComment,
    editComment,
    addComment,
} = require("../controllers/commentController");
const {
    createReaction,
    deleteReaction,
    getReaction,
    editReaction,
} = require("../controllers/reactionController");

const {
    getAllMedia,
    updateMedia,
    deleteAllMedia, deleteMedia, uploadMedia,
} = require("../controllers/mediaController");
const {
    createUpdate,
    getAllUpdate,
    deleteAllUpdate,
    getUpdate,
    deleteUpdate,
    editUpdate,
} = require("../controllers/updateController");
const { checkProjectsCache } = require("../middlewares/checkCache");

router.route('/')
    .get(authenticateUser, checkProjectsCache, getAllProjects)
    .post(authenticateUser, authorizePermission('admin', 'barangay'), addProject)
    .delete(authenticateUser, authorizePermission('admin', 'barangay'), deleteAllProjects);

router.route('/:id')
    .get(authenticateUser, getProject)
    .patch(authenticateUser, authorizePermission('admin', 'barangay'), updateProject)
    .delete(authenticateUser, authorizePermission('admin', 'barangay'), deleteProject);

// ---------------------------COMMENTS--------------------------- //

router.route('/:id/comments')
    .get(authenticateUser, getAllProjectComments)
    .post(authenticateUser, addComment);

router.route('/:id/comments/:commentId')
    .patch(authenticateUser, editComment)
    .delete(authenticateUser, deleteProjectComment);

// ---------------------------REACTIONS--------------------------- //

router.route('/:projectId/reactions')
    .get(authenticateUser, getReaction)
    .post(authenticateUser, createReaction);

router.route('/:projectId/reactions/:reactionId')
    .patch(authenticateUser, editReaction)
    .delete(authenticateUser, deleteReaction);

// ---------------------------MEDIA--------------------------- //

router.route('/media')
    .post(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), upload.single('image'), uploadMedia);

router.route('/:projectId/media')
    .get(authenticateUser, getAllMedia)
    .patch(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), upload.single('image'), updateMedia)
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteAllMedia);

router.route('/:projectId/media/:id')
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteMedia);


// ---------------------------UPDATES--------------------------- //

router.route('/:projectId/update')
    .get(authenticateUser, getAllUpdate)
    .post(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), createUpdate)
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteAllUpdate);

router.route('/:projectId/update/:id')
    .get(authenticateUser, getUpdate)
    .patch(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), editUpdate)
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteUpdate);

router.route('/:projectId/update/:updateId/media')
    .get(authenticateUser, getAllMedia)
    .patch(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), upload.single('image'), updateMedia)
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteAllMedia);

router.route('/:projectId/update/:updateId/media/:id')
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteMedia);


module.exports = router;

const router = require('express').Router();
const multer = require('../config/multer');
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
const { createReport } = require("../controllers/reportController");
const {
    getAllMedia,
    updateMedia,
    deleteAllMedia,
} = require("../controllers/mediaController");
const {
    createProgressHistory,
    getAllProgressHistory,
    deleteAllProgressHistory,
    getProgressHistory,
    deleteProgressHistory,
    editProgressHistory,
} = require("../controllers/progressHistoryController");

router.route('/')
    .get(authenticateUser, getAllProjects)
    .post(authenticateUser, authorizePermission('admin', 'barangay'), multer.array('media', 10), addProject)
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
    .post(authenticateUser, createReaction);

router.route('/:projectId/reactions/:reactionId')
    .get(authenticateUser, getReaction)
    .patch(authenticateUser, editReaction)
    .delete(authenticateUser, deleteReaction);

// ---------------------------REPORTS--------------------------- //

router.route('/:projectId/reports')
    .post(authenticateUser, multer.array('media', 10), createReport);

// ---------------------------MEDIA--------------------------- //

router.route('/:projectId/media')
    .get(authenticateUser, getAllMedia)
    .patch(authenticateUser, authorizePermission('admin', 'barangay'), multer.array('media', 10), updateMedia)
    .delete(authenticateUser, authorizePermission('admin', 'barangay'), deleteAllMedia);

// ---------------------------PROGRESS HISTORY--------------------------- //

router.route('/:projectId/progressHistory')
    .get(authenticateUser, getAllProgressHistory)
    .post(authenticateUser, authorizePermission('admin', 'barangay'), multer.array('media', 10), createProgressHistory)
    .delete(authenticateUser, authorizePermission('admin', 'barangay'), deleteAllProgressHistory);

router.route('/:projectId/progressHistory/:id')
    .get(authenticateUser, getProgressHistory)
    .patch(authenticateUser, authorizePermission('admin', 'barangay'), editProgressHistory)
    .delete(authenticateUser, authorizePermission('admin', 'barangay'), deleteProgressHistory);

router.route('/:projectId/progressHistory/:progressHistoryId/media')
    .get(authenticateUser, getAllMedia)
    .patch(authenticateUser, authorizePermission('admin', 'barangay'), multer.array('media', 10), updateMedia)
    .delete(authenticateUser, authorizePermission('admin', 'barangay'), deleteAllMedia);

module.exports = router;

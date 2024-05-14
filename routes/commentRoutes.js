const router = require('express').Router();
const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');
const {
    deleteAllComments,
    getAllComments,
    getComment,
    deleteComment,
} = require("../controllers/commentController");
const {
    createReaction,
    getReaction,
    deleteReaction,
    editReaction,
} = require("../controllers/reactionController");
const multer = require("../config/multer");

router.route('/')
    .get(authenticateUser, authorizePermissions, getAllComments)
    .delete(authenticateUser, authorizePermissions, deleteAllComments);

router.route('/:id')
    .get(authenticateUser, authorizePermissions, getComment)
    .delete(authenticateUser, authorizePermissions, deleteComment);

// ---------------------------REACTIONS--------------------------- //

router.route('/:commentId/reactions')
    .post(authenticateUser, createReaction);

router.route('/:commentId/reactions/:reactionId')
    .get(authenticateUser, getReaction)
    .patch(authenticateUser, editReaction)
    .delete(authenticateUser, deleteReaction);

module.exports = router;

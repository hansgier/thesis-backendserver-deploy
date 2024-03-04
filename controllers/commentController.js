const { StatusCodes } = require("http-status-codes");
const { projects: Project, comments: Comment, users: User } = require('../models');
const { ThrowErrorIf, BadRequestError, NotFoundError, ConflictError } = require("../errors");
const { checkPermissions } = require("../utils");
const { getCommentQuery, getProjectCommentQuery } = require("../utils/helpers");

/**
 * Adds a comment to a project.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The response object.
 */
const addComment = async (req, res) => {
    // Extract the project id and comment content from the request
    const { id } = req.params;
    const { content } = req.body;

    // Check if the project id is missing or invalid
    ThrowErrorIf(!id, 'Project id is missing in the request', BadRequestError);
    ThrowErrorIf(id === ':id' || id === '', 'Project id is invalid', BadRequestError);

    // Find the user and project by their ids
    const [user, project] = await Promise.all([
        User.findByPk(req.user.userId),
        Project.findByPk(id),
    ]);

    // Check if the user or project is not found
    ThrowErrorIf(!user, 'User not found', NotFoundError);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    // Create a new comment for the project
    const comment = await project.createComment({ content, commented_by: user.id });

    // Return a success message and the created comment
    res.status(StatusCodes.OK).json({ msg: "Comment posted!", comment });
};


/**
 * Retrieves all comments based on the provided query parameters.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The response object with the comments.
 */
const getAllComments = async (req, res) => {
    // Get the comment query options based on the request query parameters
    const options = getCommentQuery(req.query);

    // Get the total count of comments
    const totalCount = await Comment.count();

    // Find all comments based on the options
    const comments = await Comment.findAll(options);

    // Check if there are no comments
    if (comments.length < 1) {
        return res.status(StatusCodes.OK).json({ msg: "No comments" });
    } else {
        // Return the comments along with the total count and the count of comments
        return res.status(StatusCodes.OK).json({ totalCount, count: comments.length, comments });
    }
};

const getAllProjectComments = async (req, res) => {
    const { id } = req.params;
    const options = getProjectCommentQuery(req.query, id);
    ThrowErrorIf(!id || id === ':id' || id === '', 'Project id is required', BadRequestError);

    const project = await Project.findByPk(id);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    const projectComments = await Comment.findAll(options);
    const totalCount = await project.countComments();

    for (const comment of projectComments) {
        comment.dataValues.reactionCount = await comment.countReactions();
        comment.dataValues.reportCount = await comment.countReports();
    }

    if (projectComments.length < 1) return res.status(StatusCodes.OK).json({ msg: "No comments" });
    else return res.status(StatusCodes.OK).json({
        totalCount: totalCount,
        count: projectComments.length,
        projectId: project.id,
        project: project.title,
        projectComments,
    });
};

const getComment = async (req, res) => {
    const { id } = req.params;
    ThrowErrorIf(!id || id === ':id' || id === '', 'Comment id is required', BadRequestError);
    const comment = await Comment.findByPk(id);
    ThrowErrorIf(!comment, 'Comment not found', NotFoundError);
    res.status(StatusCodes.OK).json({ comment });
};

const editComment = async (req, res) => {
    const { id: projectId, commentId } = req.params;
    const { content } = req.body;
    ThrowErrorIf(!projectId || projectId === ':id' || projectId === '' || !commentId || commentId === ':commentId' || commentId === '', `Project id and comment id are required`, BadRequestError);
    ThrowErrorIf(!content, 'Content is required', BadRequestError);

    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, 'User not found', NotFoundError);

    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    const comment = await Comment.findOne({
        where: {
            id: commentId,
            project_id: projectId,
            commented_by: user.id,
        },
    });
    ThrowErrorIf(!comment, 'Comment not found', NotFoundError);
    ThrowErrorIf(content === comment.content, 'Content is the same as the previous', ConflictError);

    checkPermissions(req.user, comment.commented_by);

    comment.content = content;
    await comment.save();

    res.status(StatusCodes.OK).json({
        msg: `Comment for Project: ${ project.title } updated!`,
        comment,
    });
};

const deleteProjectComment = async (req, res) => {
    const { id: projectId, commentId } = req.params;
    ThrowErrorIf(!projectId || projectId === ':id' || projectId === '' || !commentId || commentId === ':commentId' || commentId === '', `Project id and comment id are required`, BadRequestError);

    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, 'User not found', NotFoundError);

    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    const comment = await Comment.findOne({
        where: {
            id: commentId,
            project_id: projectId,
            commented_by: user.id,
        },
    });
    ThrowErrorIf(!comment, 'Comment not found or may have been deleted', NotFoundError);

    checkPermissions(req.user, comment.commented_by);
    await comment.destroy();

    res.status(StatusCodes.OK).json({ msg: `Comment id: ${ commentId } for Project id: ${ projectId } deleted!` });
};

const deleteComment = async (req, res) => {
    const { id } = req.params;
    ThrowErrorIf(!id || id === ':id' || id === '', `Comment id is required`, BadRequestError);

    const comment = await Comment.findOne({
        where: {
            id: id,
        },
    });
    ThrowErrorIf(!comment, 'Comment not found or may have been deleted', NotFoundError);
    await comment.destroy();

    res.status(StatusCodes.OK).json({ msg: `A Comment By ${ comment.commented_by } with a Comment id: ${ id } for Project id: ${ comment.project_id } deleted!` });
};

const deleteAllComments = async (req, res) => {
    const count = await Comment.count();
    if (count < 1) return res.status(StatusCodes.OK).json({ msg: "No comments" });

    await Comment.destroy({ where: {} });
    res.status(StatusCodes.OK).json({ msg: "All comments deleted" });
};

module.exports = {
    addComment,
    getAllComments,
    getAllProjectComments,
    getComment,
    editComment,
    deleteProjectComment,
    deleteAllComments,
    deleteComment,
};
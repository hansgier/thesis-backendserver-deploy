const { sequelize, reactions: Reaction, users: User } = require('../models');
const { StatusCodes } = require("http-status-codes");
const { ThrowErrorIf, BadRequestError, NotFoundError } = require("../errors");
const {
    getReactionQuery,
    validateInput,
    createProjectReaction,
    createCommentReaction,
    REACTION_TARGETS, validateInputForEdit, editProjectReaction, editCommentReaction, deleteProjectReaction,
    deleteCommentReaction,
} = require("../utils/helpers");
const redis = require("../config/redis");

/**
 * Create a reaction for a project or comment
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @throws {BadRequestError} - If the reaction target is invalid
 * @throws {NotFoundError} - If the user is not found
 */
const createReaction = async (req, res) => {
    const { reaction_type, reactionTarget } = req.body;
    const { projectId, commentId } = req.params;

    // Find the user who is creating the reaction
    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, 'User not found', NotFoundError);

    switch (reactionTarget) {
        case REACTION_TARGETS.PROJECT:
            await createProjectReaction(user, projectId, reaction_type, res);
            break;
        case REACTION_TARGETS.COMMENT:
            await createCommentReaction(user, commentId, reaction_type, res);
            break;
        default:
            throw new BadRequestError('Invalid reactionTarget');
    }
};

const getAllReactions = async (req, res) => {
    const options = getReactionQuery(req.query);
    const totalCount = await Reaction.count();
    const reactions = await Reaction.findAll(options);
    if (reactions.length < 1) return res.status(StatusCodes.OK).json({ msg: 'No reactions found' });
    else return res.status(StatusCodes.OK).json({ totalCount, count: reactions.length, reactions });
};

const getReaction = async (req, res) => {
    const { projectId } = req.params;

    const reactions = await Reaction.findAll({
        where: {
            project_id: projectId,
        },
        attributes: [
            'reaction_type',
            [sequelize.fn('COUNT', sequelize.col('reaction_type')), 'count'],
        ],
        group: ['reaction_type'],
    });

    ThrowErrorIf(!reactions, 'Reaction not found', NotFoundError);

    const likes = reactions.find(r => r.reaction_type === 'like')?.count || 0;
    const dislikes = reactions.find(r => r.reaction_type === 'dislike')?.count || 0;

    res.status(StatusCodes.OK).json({ likes, dislikes, reactions });
};

const editReaction = async (req, res) => {
    // Destructure the request body and params
    const { reactionType, reactionTarget } = req.body;
    const { projectId, commentId, reactionId } = req.params;

    // Find the user who is editing the reaction
    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, 'User not found', NotFoundError);

    // Use a switch statement to handle different cases of reactionTarget
    switch (reactionTarget) {
        case REACTION_TARGETS.PROJECT:
            await editProjectReaction(user, projectId, reactionId, reactionType, res);
            break;
        default:
            throw new BadRequestError('Invalid reactionTarget');
    }
};

const deleteReaction = async (req, res) => {
    // Destructure the request body and params
    const { reactionTarget } = req.body;
    const { projectId, commentId, reactionId } = req.params;

    // Validate the input parameters
    validateInputForEdit(reactionTarget, projectId, commentId, reactionId);

    // Find the user who is deleting the reaction
    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, 'User not found', NotFoundError);

    // Use a switch statement to handle different cases of reactionTarget
    switch (reactionTarget) {
        case REACTION_TARGETS.PROJECT:
            await deleteProjectReaction(user, projectId, reactionId, res);
            break;
        default:
            throw new BadRequestError('Invalid reactionTarget');
    }
};

const deleteAllReactions = async (req, res) => {
    const count = await Reaction.count();
    if (count < 1) return res.status(StatusCodes.OK).json({ msg: 'No reactions found' });
    else {
        await Reaction.destroy({ where: {} });
        await redis.del(["single_project"]);
        await redis.del(["projects"]);
        res.status(StatusCodes.OK).json({ msg: 'Deleted all reactions' });
    }
};

module.exports = {
    createReaction,
    getAllReactions,
    getReaction,
    deleteReaction,
    deleteAllReactions,
    editReaction,
};
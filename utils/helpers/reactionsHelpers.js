const {
    ThrowErrorIf,
    BadRequestError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
} = require("../../errors");
const { projects: Project, reactions: Reaction, comments: Comment } = require("../../models");
const { StatusCodes } = require("http-status-codes");
const { paginationControllerFunc } = require("../index");
const { Op } = require("sequelize");
const redis = require("../../config/redis");

const REACTION_TARGETS = {
    PROJECT: 'project',
    COMMENT: 'comment',
};

const REACTION_TYPE = {
    LIKE: 'like',
    DISLIKE: 'dislike',
};

// ----------------------------------------- GET ----------------------------------------- //
const getReactionQuery = (query) => {
    const { sort, reaction_type, reaction_target, page, limit } = query;
    const options = {
        where: {},
        order: [['createdAt', 'DESC']],
    };

    sort && sortReactions(options, sort, ['createdAt']);
    reaction_type && filterReactions(options, reaction_type, [REACTION_TYPE.LIKE, REACTION_TYPE.DISLIKE]);
    reaction_target && filterTarget(options, reaction_target, [REACTION_TARGETS.PROJECT, REACTION_TARGETS.COMMENT]);
    (page && limit) && paginationControllerFunc(page, limit, options);

    return options;
};

function sortReactions(options, sort, validColumns) {
    const isDesc = sort.startsWith('-');
    const column = isDesc ? sort.slice(1) : sort;
    const direction = isDesc ? 'ASC' : 'DESC';
    ThrowErrorIf(!validColumns.includes(column), 'Invalid sort column', BadRequestError);
    Object.assign(options, {
        order: [[column, direction]],
    });
}

function filterReactions(options, reaction_type, validFilters) {
    ThrowErrorIf(!validFilters.includes(reaction_type), `Invalid filter for reaction type`, BadRequestError);
    Object.assign(options, {
        where: {
            ...options.where,
            reaction_type: reaction_type,
        },
    });
}

function filterTarget(options, reaction_target, validTargets) {
    ThrowErrorIf(!validTargets.includes(reaction_target), `Invalid filter for reaction target`, BadRequestError);
    if (reaction_target === REACTION_TARGETS.PROJECT) {
        Object.assign(options, {
                where: {
                    ...options.where,
                    project_id: {
                        [Op.not]: null,
                    },
                },
            },
        );
    } else if (reaction_target === REACTION_TARGETS.COMMENT) {
        Object.assign(options, {
                where: {
                    ...options.where,
                    comment_id: {
                        [Op.not]: null,
                    },
                },
            },
        );
    }
}

// ----------------------------------------- CREATE ----------------------------------------- //

/**
 * Validates the input for the reaction target, project ID, and comment ID.
 * Throws an error if any of the required fields are missing or empty.
 * @param {string} reactionTarget - The reaction target.
 * @param {string} projectId - The project ID.
 * @param {string} commentId - The comment ID.
 * @throws {BadRequestError} - If the reaction target, project ID, or comment ID are missing or empty.
 */
const validateInput = (reactionTarget, projectId, commentId) => {
    // Throw an error if the reactionTarget is missing or empty
    ThrowErrorIf(
        !reactionTarget || reactionTarget === '',
        'reactionTarget is required',
        BadRequestError,
    );

    // If the reaction target is a project
    if (reactionTarget === REACTION_TARGETS.PROJECT) {
        // Throw an error if the projectId is missing, empty, or equal to ':projectId'
        ThrowErrorIf(
            !projectId || projectId === '' || projectId === ':projectId',
            'Project id is required',
            BadRequestError,
        );
    }
    // If the reaction target is a comment
    else if (reactionTarget === REACTION_TARGETS.COMMENT) {
        // Throw an error if the commentId is missing, empty, or equal to ':commentId'
        ThrowErrorIf(
            !commentId || commentId === '' || commentId === ':commentId',
            'Comment id is required',
            BadRequestError,
        );
    }
};

const createProjectReaction = async (user, projectId, reaction_type, res) => {
    // Find the project by id
    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);
    let newReaction;
    // Check if the user has already reacted to the project
    const isThereReaction = await Reaction.findOne({
        where: {
            reacted_by: user.id,
            project_id: project.id,
        },
    });

    if (isThereReaction) {
        if (isThereReaction.reaction_type === reaction_type) {
            await Reaction.destroy({
                where: {
                    reacted_by: user.id,
                    project_id: project.id,
                    reaction_type: reaction_type,
                },
            });
            await redis.del(["single_project"]);
            await redis.del(["projects"]);
            return res.status(StatusCodes.OK).json({ msg: "Reaction deleted successfully" });
        } else {
            // Create a new reaction for the project
            await Reaction.update(
                {
                    reaction_type,
                },
                {
                    where: {
                        reacted_by: user.id,
                        project_id: project.id,
                    },
                });
            newReaction = {
                msg: "Reaction updated successfully",
            };
        }
    } else {
        // Create a new reaction for the project
        newReaction = await Reaction.create({
            reaction_type,
            reacted_by: user.id,
            project_id: project.id,
        });

    }


    await redis.del(["single_project"]);
    await redis.del(["projects"]);

    res.status(StatusCodes.CREATED).json({
        msg: 'Reaction created',
        newReaction,
    });
};

const createCommentReaction = async (user, commentId, reaction_type, res) => {
    // Find the comment by id
    const comment = await Comment.findByPk(commentId);
    ThrowErrorIf(!comment, 'Comment not found', NotFoundError);

    // Check if the user has already reacted to the comment
    const existingReaction = await Reaction.findOne({
        where: {
            reacted_by: user.id,
            comment_id: comment.id,
        },
    });
    ThrowErrorIf(
        existingReaction,
        'You have already reacted to this comment',
        ConflictError,
    );

    // Create a new reaction for the comment
    const newReaction = await Reaction.create({
        reaction_type,
        reacted_by: user.id,
        comment_id: comment.id,
    });
    res.status(StatusCodes.CREATED).json({
        msg: 'Reaction created',
        newReaction,
    });
};

// --------------------------------------------------------- EDIT --------------------------------------------------------- //

const validateInputForEdit = (reactionTarget, projectId, commentId, reactionId) => {
    ThrowErrorIf(
        !reactionTarget || reactionTarget === '',
        'reactionTarget is required',
        BadRequestError,
    );

    ThrowErrorIf(
        !reactionId || reactionId === '' || reactionId === ':reactionId',
        'Reaction id is required',
        BadRequestError,
    );

    if (reactionTarget === REACTION_TARGETS.PROJECT) {
        ThrowErrorIf(
            !projectId || projectId === '' || projectId === ':projectId',
            'Project id is required',
            BadRequestError,
        );
    } else if (reactionTarget === REACTION_TARGETS.COMMENT) {
        ThrowErrorIf(
            !commentId || commentId === '' || commentId === ':commentId',
            'Comment id is required',
            BadRequestError,
        );
    }
};

const findReactionById = async (user, reactionId, action) => {
    // Find the reaction by id
    const reaction = await Reaction.findByPk(reactionId);
    ThrowErrorIf(!reaction, 'Reaction not found', NotFoundError);

    // Check if the reaction belongs to the user
    ThrowErrorIf(reaction.reacted_by !== user.id, action === 'edit' ? 'You are not allowed to edit this' +
        ' reaction' : 'You are not allowed to delete this reaction', UnauthorizedError);

    return reaction;
};

// A helper function to update the reaction type and send the response
const updateReactionType = async (reaction, reactionType, res) => {
    // Check if the reaction type is different from the current one
    ThrowErrorIf(reaction.reaction_type === reactionType, 'You have already reacted with this type', ConflictError);

    // Update the reaction type
    reaction.reaction_type = reactionType;
    await reaction.save({ fields: ['reaction_type'] });

    await redis.del(["single_project"]);
    await redis.del(["projects"]);

    // Send the response
    res.status(StatusCodes.OK).json({
        msg: `Reaction id: ${ reaction.id } has been edited`,
        reaction,
    });
};

// A helper function to edit a reaction for a project
const editProjectReaction = async (user, projectId, reactionId, reactionType, res) => {
    // Find the project by id
    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    // Find the reaction by id and check if it belongs to the user
    const reaction = await findReactionById(user, reactionId, 'edit');

    // Update the reaction type and send the response
    await updateReactionType(reaction, reactionType, res);
};

// A helper function to edit a reaction for a comment
const editCommentReaction = async (user, commentId, reactionId, reactionType, res) => {
    // Find the comment by id
    const comment = await Comment.findByPk(commentId);
    ThrowErrorIf(!comment, 'Comment not found', NotFoundError);

    // Find the reaction by id and check if it belongs to the user
    const reaction = await findReactionById(user, reactionId, 'edit');

    // Update the reaction type and send the response
    await updateReactionType(reaction, reactionType, res);
};

// --------------------------------------------------------- DELETE --------------------------------------------------- //

const deleteReaction = async (reaction, res) => {
    // Delete the reaction
    await reaction.destroy();
    await redis.del(["single_project"]);
    await redis.del(["projects"]);
    // Send the response
    res.status(StatusCodes.OK).json({
        msg: `Reaction id: ${ reaction.id } has been deleted`,
    });
};

const deleteProjectReaction = async (user, projectId, reactionId, res) => {
    // Find the project by id
    const project = await Project.findByPk(projectId);
    ThrowErrorIf(!project, 'Project not found', NotFoundError);

    // Find the reaction by id and check if it belongs to the user
    const reaction = await findReactionById(user, reactionId, 'delete');

    // Delete the reaction and send the response
    await deleteReaction(reaction, res);
};

const deleteCommentReaction = async (user, commentId, reactionId, res) => {
    // Find the comment by id
    const comment = await Comment.findByPk(commentId);
    ThrowErrorIf(!comment, 'Comment not found', NotFoundError);

    // Find the reaction by id and check if it belongs to the user
    const reaction = await findReactionById(user, reactionId, 'delete');

    // Delete the reaction and send the response
    await deleteReaction(reaction, res);
};


module.exports = {
    getReactionQuery,
    validateInput,
    createProjectReaction,
    createCommentReaction,
    REACTION_TARGETS,
    validateInputForEdit,
    editCommentReaction,
    editProjectReaction,
    deleteProjectReaction,
    deleteCommentReaction,
};
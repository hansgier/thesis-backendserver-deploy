const cloudinary = require("cloudinary").v2;
const { StatusCodes } = require('http-status-codes');
const {
    sequelize,
    projects: Project,
    users: User,
    tags: Tag,
    barangays: Barangay,
    comments: Comment,
    media: Media,
    updates: Update,
    reactions: Reaction,
    fundingSources: FundingSource,
} = require('../models');
const {
    ThrowErrorIf,
    NotFoundError,
    BadRequestError,
} = require("../errors");
const { getProjectQuery } = require("../utils/helpers");
const { checkPermissions, cacheExpiries } = require("../utils");
const { validateAndUpdateProject, validationCreate } = require("../utils/helpers/projectsHelpers");
const path = require("path");
const fs = require("fs");
const redis = require("../config/redis");

/**
 * Add a new project to the database.
 *
 * @param {Object} req - The request object containing the project data.
 * @param {Object} res - The response object to send the result.
 * @returns {Promise<void>} - A Promise that resolves when the project is created.
 */
const addProject = async (req, res) => {
    const {
        title,
        description,
        cost,
        start_date,
        due_date,
        completion_date,
        status,
        funding_source,
        implementing_agency,
        contract_term,
        contractor,
        tagsIds,
        barangayIds,
        uploadedImages,
    } = req.body;

    const t = await sequelize.transaction();

    try {
        const { tags, barangays, user } = await validationCreate(req, barangayIds, tagsIds);

        let fundingSourceRecord = null;
        if (funding_source) {
            // Check if the funding source already exists
            fundingSourceRecord = await FundingSource.findOne({
                where: { name: funding_source },
                transaction: t,
            });

            // If it doesn't exist, create a new one
            if (!fundingSourceRecord) {
                fundingSourceRecord = await FundingSource.create({ name: funding_source }, { transaction: t });
            }
        }

        const projectData = {
            title,
            description,
            cost,
            start_date,
            due_date,
            completion_date: !completion_date ? null : completion_date,
            status,
            funding_source: !fundingSourceRecord ? null : fundingSourceRecord.id,
            implementing_agency,
            contract_term,
            contractor,
            createdBy: user.id,
        };

        const newProject = await Project.create(projectData, { transaction: t });
        if (uploadedImages) {

            const mediaRecords = await Promise.all(
                uploadedImages.map((image) =>
                    Media.create(
                        {
                            url: image.secure_url,
                            mime_type: image.resource_type,
                            size: image.bytes,
                            project_id: newProject.id,
                        },
                        { transaction: t },
                    ),
                ),
            );
            await newProject.addMedia(mediaRecords, { transaction: t });
        }

        await Promise.all([
            newProject.addTags(tags, { transaction: t }),
            newProject.addBarangays(barangays, { transaction: t }),
        ]);

        await newProject.reload({ transaction: t });

        await t.commit();

        await redis.del(["projects"]);

        res.status(StatusCodes.CREATED).json({ msg: 'Success! New project created', project: newProject });
    } catch (error) {
        await t.rollback();
        console.error(error);
        await Promise.all(
            uploadedImages.map((image) => cloudinary.uploader.destroy(image.url.split('/').pop().split('.')[0])),
        );
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Failed to create project', error: error.message });
    }
};

/** Retrieves all projects based on the provided query parameters. @param {Object} req - The request object. @param {Object} res - The response object. @returns {Object} - The response object containing the projects. /
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const getAllProjects = async (req, res) => {
    // Get the project query options based on the request query parameters
    const options = getProjectQuery(req.query);
    const count = await Project.count();

    // Retrieve all projects based on the options
    const projects = await Project.findAll(options);


    // Add comment count, reaction count (likes and dislikes) to each project
    for (const project of projects) {
        project.dataValues.commentCount = await project.countComments();
        project.dataValues.funding_source = await FundingSource.findByPk(project.funding_source, { attributes: ['id', 'name'] });

        // Get the reactions for the project
        const reactions = await project.getReactions({
            attributes: ['reaction_type'],
            group: ['reaction_type'],
        });

        // Initialize likes and dislikes to 0
        project.dataValues.likes = 0;
        project.dataValues.dislikes = 0;

        // Count the number of likes and dislikes
        for (const reaction of reactions) {
            if (reaction.reaction_type === 'like') {
                project.dataValues.likes = reaction.dataValues.count;
            } else if (reaction.reaction_type === 'dislike') {
                project.dataValues.dislikes = reaction.dataValues.count;
            }
        }
    }

    // If no projects found, return a response with a message
    if (projects.length < 1) {
        return res.status(StatusCodes.OK).json({ msg: 'No projects found' });
    }

    const data = {
        totalCount: count,
        count: projects.length,
        projects,
    };

    // redisClient.setEx("projects", cacheExpiries.projects, JSON.stringify(data));
    await redis.set("projects", JSON.stringify(data), 'EX', cacheExpiries.projects);

    // Return a response with the count of projects, projects, and likes/dislikes
    return res.status(StatusCodes.OK).json(data);
};


/**
 * Retrieves a project by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @throws {BadRequestError} If the ID is missing or invalid.
 * @throws {NotFoundError} If the project with the given ID is not found.
 * @return {Object} The project object.
 */
const getProject = async (req, res) => {
    // Extract the ID from the request parameters
    const { id } = req.params;

    // Check if the ID is missing or invalid
    ThrowErrorIf(!id || id === ':id' || id === '', 'Id is required', BadRequestError);

    // Get the user ID from the request object
    // const { userId } = req.user;

    // Find the project by ID, including associated tags and barangays
    const project = await Project.findByPk(id, {
        include: [
            {
                model: Tag,
                as: 'tags',
                attributes: ['id', 'name'],
                through: { attributes: [] },
            },
            {
                model: Barangay,
                as: 'barangays',
                attributes: ['id', 'name'],
                through: { attributes: [] },
            },
            {
                model: Comment,
                as: 'comments',
                attributes: ['content', 'commented_by'],
            },
            {
                model: Media,
                as: 'media',
                attributes: ['id', 'url', 'mime_type', 'size'],
            },
            {
                model: Reaction,
                as: "reactions",
                attributes: ['id', 'reaction_type', 'reacted_by'],
            },
        ],
    });

    project.dataValues.funding_source = await FundingSource.findByPk(project.funding_source, { attributes: ['id', 'name'] });

    // Check if the project with the given ID is not found
    ThrowErrorIf(!project, `Project: ${ id } not found`, NotFoundError);

    // Add reaction count to project
    project.dataValues.reactionCount = await project.countReactions();
    const data = { project };

    // Send the project object as a JSON response
    res.status(StatusCodes.OK).json(data);
};


/**
 * Updates a project.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the project is updated.
 */
const updateProject = async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        cost,
        start_date,
        due_date,
        progress,
        completion_date,
        status,
        funding_source,
        implementing_agency,
        contract_term,
        contractor,
        tagsIds,
        barangayIds,
        uploadedImages,
    } = req.body;

    const t = await sequelize.transaction();

    try {
        const project = await Project.findByPk(id, {
            include: [
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['id', 'name'],
                    through: { attributes: [] },
                },
                {
                    model: Barangay,
                    as: 'barangays',
                    attributes: ['id', 'name'],
                    through: { attributes: [] },
                },
                {
                    model: Media,
                    as: 'media',
                    attributes: ['id', 'url'],
                },
                {
                    model: FundingSource,
                    as: 'fundingSource',
                    attributes: ['id', 'name'],
                },
            ],
            transaction: t,
        });
        checkPermissions(req.user, project.createdBy);
        ThrowErrorIf(!project, `Project: ${ id } not found`, NotFoundError);

        const { tags, barangays } = await validateAndUpdateProject(barangayIds, tagsIds);
        let fundingSourceRecord = null;
        if (funding_source) {
            // Check if the funding source already exists or create a new one
            fundingSourceRecord = await FundingSource.findOne({
                where: { name: funding_source },
                transaction: t,
            });

            if (!fundingSourceRecord) {
                fundingSourceRecord = await FundingSource.create({ name: funding_source }, { transaction: t });
            }
        }

        const projectData = {
            title: title || project.title,
            description: description || project.description,
            cost: cost || project.cost,
            progress: progress || project.progress,
            start_date: start_date || project.start_date,
            due_date: due_date || project.due_date,
            completion_date: completion_date || project.completion_date,
            status: status || project.status,
            funding_source: !fundingSourceRecord ? project.funding_source : fundingSourceRecord.id,
            implementing_agency: implementing_agency || project.implementing_agency,
            contract_term: contract_term || project.contract_term,
            contractor: contractor || project.contractor,
        };

        await project.update(projectData, { transaction: t });

        if (uploadedImages) {
            await Media.destroy({
                where: {
                    project_id: project.id,
                },
            });
            const newMediaRecords = await Promise.all(
                uploadedImages.map((image) =>
                    Media.create(
                        {
                            url: image.secure_url,
                            mime_type: image.resource_type,
                            size: image.bytes,
                            project_id: project.id,
                        },
                        { transaction: t },
                    ),
                ),
            );
            await project.addMedia(newMediaRecords, { transaction: t });
        }

        if (tags) {
            await project.setTags(tags, { transaction: t });
        }

        if (barangays) {
            await project.setBarangays(barangays, { transaction: t });
        }

        await project.reload({ transaction: t });

        await t.commit();
        await redis.del(["projects"]);

        res.status(StatusCodes.OK).json({ msg: 'Success! Project updated', project });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Failed to update project', error: error.message });
    }
};

/**
 * Deletes a project by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @throws {BadRequestError} If the id is missing.
 * @throws {NotFoundError} If the project is not found.
 * @returns {Object} - The response object with a success message.
 */
const deleteProject = async (req, res) => {
    // Extract the project ID from the request parameters
    const { id } = req.params;

    // Check if the project ID is provided and not empty
    ThrowErrorIf(!id || id === ':id' || id === '', 'Id is required', BadRequestError);

    // Find the project by its ID, including associated media and updates with their media
    const project = await Project.findByPk(id, {
        include: [
            {
                model: Media,
                as: 'media',
            },
            {
                model: Update,
                as: 'updates',
                include: [
                    {
                        model: Media,
                        as: 'media',
                    },
                ],
            },
        ],
    });

    // Check if the project exists
    ThrowErrorIf(!project, `Project ${ id } not found`, NotFoundError);

    checkPermissions(req.user, project.createdBy);

    // Delete the media files associated with the project and its updates from Cloudinary
    const mediaUrls = [...project.media.map(media => media.url)];
    const updateMediaUrls = project.updates.flatMap(update => update.media.map(media => media.url));
    const allMediaUrls = [...mediaUrls, ...updateMediaUrls];

    await Promise.all(
        allMediaUrls.map(async (url) => {
            const publicId = url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }),
    );

    // Delete the project (this will also delete associated records due to cascading delete)
    await project.destroy();
    await redis.del(["projects"]);

    // Return a success message
    res.status(StatusCodes.OK).json({ msg: `Project: ${ id } deleted` });
};


/**
 * Deletes all projects.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - The response object with a message that all projects were deleted.
 */
const deleteAllProjects = async (req, res) => {
    // Get the count of projects
    const count = await Project.count();

    // If no projects found, return a success message
    if (count < 1) return res.status(StatusCodes.OK).json({ msg: 'No projects found' });

    // Determine the where clause based on the user's role
    const where = req.user.role === 'admin' ? {} : { createdBy: req.user.userId };

    // Find all projects and their associated media and updates with their media
    const projects = await Project.findAll({
        where,
        include: [
            {
                model: Media,
                as: 'media',
            },
            {
                model: Update,
                as: 'updates',
                include: [
                    {
                        model: Media,
                        as: 'media',
                    },
                ],
            },
        ],
    });

    // Delete the media files associated with the projects and their updates from Cloudinary
    const allMediaUrls = projects.flatMap(project => [
        ...project.media.map(media => media.url),
        ...project.updates.flatMap(update => update.media.map(media => media.url)),
    ]);

    await Promise.all(
        allMediaUrls.map(async (url) => {
            const publicId = url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }),
    );

    // Delete all projects that match the where clause (this will also delete associated records due to cascading delete)
    await Project.destroy({ where });
    await redis.del(["projects"]);

    // Return a success message
    res.status(StatusCodes.OK).json({ msg: 'All projects deleted' });
};

/**
 * Retrieves all funding sources.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves with the list of funding sources.
 */
const getAllFundingSources = async (req, res) => {
    try {
        const fundingSources = await FundingSource.findAll({
            attributes: ['id', 'name'],
        });

        res.status(StatusCodes.OK).json({ fundingSources });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: 'Failed to retrieve funding sources',
            error: error.message,
        });
    }
};

/**
 * Retrieves a funding source by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves with the funding source.
 */
const getFundingSource = async (req, res) => {
    const { id } = req.params;

    try {
        const fundingSource = await FundingSource.findByPk(id, {
            attributes: ['id', 'name'],
        });

        ThrowErrorIf(!fundingSource, `Funding source: ${ id } not found`, NotFoundError);

        res.status(StatusCodes.OK).json({ fundingSource });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: 'Failed to retrieve funding source',
            error: error.message,
        });
    }
};


module.exports = {
    addProject,
    getAllProjects,
    getProject,
    updateProject,
    deleteProject,
    deleteAllProjects,
    getAllFundingSources,
    getFundingSource,
};

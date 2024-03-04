const fs = require('fs');
const path = require('path');
const { ThrowErrorIf, BadRequestError } = require("../../errors");
const { media: Media, progressHistories: ProgressHistory, projects: Project } = require("../../models");
const { paginationControllerFunc } = require("../index");

function validationInput(body, action) {
    const { projectId, id, date, remarks, progress } = body;

    switch (action) {
        case "create":
            validateCreate({ projectId, date, remarks, progress });
            break;
        case "deleteAll":
            validateDeleteAll({ projectId });
            break;
        case "delete":
            validateDelete({ projectId, id });
            break;
        case "edit":
            validateEdit({ projectId, id, date, remarks, progress });
            break;
        default:
            ThrowErrorIf(true, "Invalid action", BadRequestError);
    }
}

function validateCreate({ projectId, date, remarks, progress }) {
    ThrowErrorIf(
        !projectId || projectId === ':projectId' || projectId === '',
        'Project id is required',
        BadRequestError,
    );
    ThrowErrorIf(!date, "Date is required", BadRequestError);
    ThrowErrorIf(!remarks, "Remarks is required", BadRequestError);
    ThrowErrorIf(!progress, "Progress is required", BadRequestError);

    ThrowErrorIf(
        typeof date !== "string" || !Date.parse(date),
        "Invalid date format",
        BadRequestError,
    );
    ThrowErrorIf(
        typeof remarks !== "string",
        "Invalid remarks format",
        BadRequestError,
    );
    ThrowErrorIf(
        isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100,
        "Invalid progress format",
        BadRequestError,
    );
}

function validateDeleteAll({ projectId }) {
    // validate deleteAll action
    ThrowErrorIf(
        !projectId || projectId === ":projectId" || projectId === "",
        `Project id is required`,
        BadRequestError,
    );
}

function validateDelete({ projectId, id }) {
    // validate delete action
    ThrowErrorIf(
        !projectId || projectId === ":projectId" || projectId === "",
        `Project id is required`,
        BadRequestError,
    );
    ThrowErrorIf(
        !id || id === ":id" || id === "",
        `Progress history id is required`,
        BadRequestError,
    );
}

function validateEdit({ projectId, id, date, remarks, progress }) {
    // validate edit action
    ThrowErrorIf(
        !projectId || projectId === ":projectId" || projectId === "",
        `Project id is required`,
        BadRequestError,
    );
    ThrowErrorIf(
        !id || id === ":id" || id === "",
        `Progress history id is required`,
        BadRequestError,
    );
    ThrowErrorIf(
        date && (typeof date !== "string" || !Date.parse(date)),
        "Invalid date format",
        BadRequestError,
    );
    ThrowErrorIf(
        remarks && typeof remarks !== "string",
        "Invalid remarks format",
        BadRequestError,
    );
    ThrowErrorIf(
        progress &&
        (isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100),
        "Invalid progress format",
        BadRequestError,
    );
}

// --------------------------------------- CREATE --------------------------------------- //

const createMediaRecord = async (file, progressHistory, project) => {
    // Use the create method to create a new media record
    // Return the new media record
    return await Media.create({
        url: file.path,
        mime_type: file.mimetype,
        size: file.size,
        recorded_date: file.filename.split("_")[1],
        progressHistory_id: progressHistory.id,
        project_id: project.id,
    });
};

const handleError = async (error, files, projectId) => {
    // Delete the files regardless of the error status code
    for (let file of files) {
        const filePath = path.normalize(
            path.join(__dirname, "../../", file.path),
        );
        await fs.promises.unlink(filePath);
    }
    if (error.statusCode === 403) {
        throw error;
    } else if (error.statusCode !== 409) {
        await ProgressHistory.destroy({ where: { project_id: projectId } });
    }
    // Throw the error after deleting the files and/or the progress history
    throw error;
};

// --------------------------------------- GET --------------------------------------- //

function getProgressHistoryQuery(query) {
    const { sort, page, limit } = query;

    const options = {
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: Media,
                as: 'media',
                attributes: ['url', 'mime_type', 'size', 'recorded_date'],
            },
        ],
    };

    sort && sortProgressHistory(options, sort, ['latest', 'oldest']);
    (page && limit) && paginationControllerFunc(page, limit, options);

    return options;
}

function sortProgressHistory(options, sort, validSort) {
    ThrowErrorIf(!validSort.includes(sort), 'Invalid sort query', BadRequestError);
    if (sort === 'latest') {
        options.order = [['createdAt', 'DESC']];
    } else if (sort === 'oldest') {
        options.order = [['createdAt', 'ASC']];
    }
}

module.exports = {
    getProgressHistoryQuery,
    createMediaRecord,
    handleError,
    validationInput,
};
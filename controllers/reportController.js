const { StatusCodes } = require("http-status-codes");
const { sequelize, users: User, reports: Report, media: Media } = require('../models');
const { ThrowErrorIf, NotFoundError, UnauthorizedError, ConflictError, BadRequestError } = require("../errors");
const { findOrCreateReport, getReportQuery } = require("../utils/helpers");
const path = require("path");
const fs = require("fs");
const { where } = require("sequelize");

const createReport = async (req, res) => {
    const files = req.files;
    const { projectId, commentId } = req.params;
    const { content } = req.body;

    try {
        const result = await sequelize.transaction(async (t) => {
            const user = await User.findByPk(req.user.userId, { transaction: t });
            ThrowErrorIf(!user, 'User not found', NotFoundError);

            let newReport;
            if (projectId) {
                newReport = await findOrCreateReport('project', projectId, content, user, { transaction: t });
            } else if (commentId) {
                newReport = await findOrCreateReport('comment', commentId, content, user, { transaction: t });
            } else {
                throw new BadRequestError('Project or comment id is required');
            }

            if (files) {
                const mediaRecords = await Promise.all(files.map(async file => {
                    return await Media.create({
                        url: file.path,
                        mime_type: file.mimetype,
                        size: file.size,
                        report_id: newReport.id,
                    }, { transaction: t });
                }));
                await newReport.addMedia(mediaRecords, { transaction: t });
            }

            return newReport;
        });

        result.dataValues.media = await result.getMedia();

        await result.reload();

        // If the transaction succeeds, send the response
        res.status(StatusCodes.CREATED).json({ msg: 'Report created', report: result });
    } catch (error) {
        // If the transaction fails, delete the uploaded files
        await Promise.all(files.map(async (file) => {
            const filePath = path.normalize(
                path.join(__dirname, "../", file.path),
            );
            await fs.promises.unlink(filePath);
        }));
        throw error;
    }
};


const getAllReports = async (req, res) => {
    const options = getReportQuery(req.query);
    const count = await Report.count();
    const reports = await Report.findAll(options);
    if (reports.length < 1) return res.status(StatusCodes.OK).json({ msg: 'No reports found' });
    else return res.status(StatusCodes.OK).json({ totalCount: count, count: reports.length, reports });
};

const getReport = async (req, res) => {
    const { id } = req.params;
    ThrowErrorIf(!id || id === ':id' || id === '', 'Report id is required', BadRequestError);

    const report = await Report.findByPk(id);
    ThrowErrorIf(!report, 'Report not found', NotFoundError);

    res.status(StatusCodes.OK).json({ report });
};

const updateReport = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    ThrowErrorIf(!id || id === ':id' || id === '', 'Report id is required', BadRequestError);
    ThrowErrorIf(!status, 'Status is required', BadRequestError);

    const report = await Report.findByPk(id);
    ThrowErrorIf(!report, 'Report not found', NotFoundError);
    ThrowErrorIf(report.status === status, `Report is already ${ status }`, ConflictError);

    report.status = status;
    await report.save();

    res.status(StatusCodes.OK).json({ msg: `Report id: ${ id } updated to ${ status }` });
};

const deleteReport = async (req, res) => {
    const { id } = req.params;
    ThrowErrorIf(!id || id === ':id' || id === '', 'Report id is required', BadRequestError);

    const report = await Report.findByPk(id);
    ThrowErrorIf(!report, 'Report not found or may have been already deleted', NotFoundError);
    await report.destroy();
    res.status(StatusCodes.OK).json({ msg: `Report id: ${ id } deleted` });
};

const deleteAllReports = async (req, res) => {
    const count = await Report.count();
    if (count < 1) return res.status(StatusCodes.OK).json({ msg: 'No reports found' });
    else {
        const reports = await Report.findAll({ where: {} });
        await Promise.all(reports.map(async (report) => {
            const mediaRecords = await report.getMedia();
            await Promise.all(
                mediaRecords.map(async (media) => {
                    const filePath = path.normalize(
                        path.join(__dirname, "../", media.url),
                    );
                    await fs.promises.unlink(filePath);
                }),
            );
        }));
        await Report.destroy({ where: {} });
        return res.status(StatusCodes.OK).json({ msg: 'All reports deleted' });
    }
};

module.exports = {
    getAllReports,
    getReport,
    createReport,
    updateReport,
    deleteReport,
    deleteAllReports,
};

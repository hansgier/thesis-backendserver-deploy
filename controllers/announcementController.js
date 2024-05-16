const { StatusCodes } = require('http-status-codes');
const { announcements: Announcement, users: User } = require('../models');
const { NotFoundError, ThrowErrorIf, BadRequestError, ConflictError } = require("../errors");
const { getAnnouncementQuery } = require("../utils/helpers");
const { checkPermissions } = require("../utils");

const postAnnouncement = async (req, res) => {
    const { title, content } = req.body;
    // Check if the user exists
    const user = await User.findByPk(req.user.userId);
    ThrowErrorIf(!user, "User not found", NotFoundError);

    const announcement = await Announcement.create({
        title,
        content,
        createdBy: user.id,
    });
    res.status(StatusCodes.CREATED).json({ msg: 'Announcement created', announcement });
};

const getAllAnnouncements = async (req, res) => {
    const options = getAnnouncementQuery(req.query);
    const count = await Announcement.count();

    const announcements = await Announcement.findAll(options);

    if (announcements.length < 1) {
        return res.status(StatusCodes.OK).json({ msg: 'No announcements found' });
    } else return res.status(StatusCodes.OK).json({
        totalCount: count,
        count: announcements.length,
        announcements,
    });
};

const getAnnouncement = async (req, res) => {
    const { id } = req.params;
    ThrowErrorIf(!id || id === ':id' || id === '', 'Announcement id is required', BadRequestError);
    const announcement = await Announcement.findByPk(id);
    ThrowErrorIf(!announcement, 'Announcement not found', NotFoundError);
    res.status(StatusCodes.OK).json({ announcement });
};

const editAnnouncement = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    ThrowErrorIf(!id || id === ':id' || id === '', 'Announcement id is required', BadRequestError);

    const announcement = await Announcement.findOne({
        where: {
            id,
        },
    });
    ThrowErrorIf(!announcement, 'Announcement not found', NotFoundError);

    checkPermissions(req.user, announcement.createdBy);

    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;

    await announcement.save();

    res.status(StatusCodes.OK).json({
        msg: `Announcement id: ${ announcement.title } updated!`,
        announcement,
    });
};

const deleteAllAnnouncements = async (req, res) => {
    const count = await Announcement.count();
    if (count < 1) return res.status(StatusCodes.OK).json({ msg: 'No announcements' });
    if (req.user.role === 'barangay') {
        await Announcement.destroy({
            where: {
                createdBy: req.user.userId,
            },
        });
    } else {
        await Announcement.destroy({ where: {} });
    }
    res.status(StatusCodes.OK).json({ message: 'All announcements deleted' });
};

const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;
    ThrowErrorIf(!id || id === ':id' || id === '', 'Announcement id is required', BadRequestError);
    const announcement = await Announcement.findByPk(id);
    ThrowErrorIf(!announcement, 'Announcement not found', NotFoundError);

    checkPermissions(req.user, announcement.createdBy);

    await Announcement.destroy({ where: { id } });

    res.status(StatusCodes.OK).json({ message: `Announcement id: ${ id } deleted` });
};

module.exports = {
    postAnnouncement,
    getAllAnnouncements,
    getAnnouncement,
    editAnnouncement,
    deleteAllAnnouncements,
    deleteAnnouncement,
};
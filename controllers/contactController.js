const { sequelize, barangays: Barangay, users: User, contacts: Contact, Project } = require('../models');
const { StatusCodes } = require("http-status-codes");
const { ThrowErrorIf, NotFoundError, BadRequestError } = require("../errors");
const { checkPermissions, cacheExpiries } = require("../utils");
const cloudinary = require("cloudinary").v2;


const getAllContacts = async (req, res) => {
    const contacts = await Contact.findAll({
        where: {},
    });
    const totalCount = await Contact.count();

    // If no barangays are found, return a message
    if (totalCount < 1) return res.status(StatusCodes.OK).json({ msg: 'No contacts found' });
    const data = {
        totalCount: totalCount,
        contacts,
    };

    res.status(StatusCodes.OK).json(data);
};

const getContact = async (req, res) => {
    const { id } = req.params;
    const contact = await Contact.findByPk(req.params.id);
    ThrowErrorIf(!contact, 'Contact not found', NotFoundError);
    res.status(StatusCodes.OK).json({ contact });
};

const createContact = async (req, res) => {
    const { name, logo, address, emails, phones } = req.body;

    const t = await sequelize.transaction();

    try {
        const contact = await Contact.create(
            {
                name,
                logo,
                address,
                emails,
                phones,
                created_by: req.user.userId,
            },
            { transaction: t },
        );

        await t.commit();
        res.status(StatusCodes.CREATED).json({ msg: 'Success! New contact created', contact });
    } catch (err) {
        await t.rollback();
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
};

const updateContact = async (req, res) => {
    const { id } = req.params;
    const { name, logo, address, emails, phones } = req.body;

    ThrowErrorIf(!id || id === ':id' || id === '', 'Id is required', BadRequestError);

    const t = await sequelize.transaction();

    try {
        const contact = await Contact.findByPk(id, { transaction: t });
        ThrowErrorIf(!contact, 'Contact not found', NotFoundError);
        checkPermissions(req.user, contact.created_by);

        contact.name = name;
        contact.logo = logo;
        contact.address = address;
        contact.emails = emails;
        contact.phones = phones;

        await contact.save({ transaction: t });
        await t.commit();

        res.status(200).json({ msg: `Contact ID: ${ id } updated`, contact });
    } catch (err) {
        await t.rollback();
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
};

const deleteContact = async (req, res) => {
    const { id } = req.params;
    ThrowErrorIf(!id || id === ':id' || id === '', 'Id is required', BadRequestError);

    const contact = await Contact.findByPk(id);
    ThrowErrorIf(!contact, 'Contact not found', NotFoundError);

    checkPermissions(req.user, contact.created_by);

    if (contact.logo) {
        const publicId = contact.logo.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
    }

    await contact.destroy();

    res.status(StatusCodes.OK).json({ msg: `Contact ID: ${ id } deleted` });
};

const deleteAllContacts = async (req, res) => {
    const { role, userId } = req.user;
    const isAdmin = role === 'admin' || role === 'assistant_admin';
    const where = isAdmin ? {} : { created_by: userId };

    const totalCount = await Contact.count({ where });

    // If no contacts found, return a success message
    if (totalCount < 1) return res.status(StatusCodes.OK).json({ msg: 'No contacts to be deleted' });

    // Get all contacts to delete their logos from Cloudinary
    const contacts = await Contact.findAll({ where, attributes: ['logo'] });
    // Delete logos from Cloudinary in parallel
    const deleteLogosPromises = contacts.map(async (contact) => {
        if (contact.logo) {
            const publicId = contact.logo.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
    });

    await Promise.all(deleteLogosPromises);

    await Contact.destroy({ where });
    res.status(StatusCodes.OK).json({ msg: 'All contacts deleted' });
};


module.exports = {
    getAllContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact,
    deleteAllContacts,
};
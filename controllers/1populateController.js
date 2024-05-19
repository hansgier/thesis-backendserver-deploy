const { sequelize, users: User, barangays: Barangay, tags: Tag, contacts: Contact } = require('../models');
const { StatusCodes } = require("http-status-codes");
const { usersM, barangaysM, contactsM } = require('../mockData');
const { TAGS } = require('../utils');

const tagsM = TAGS.map(tag => {
    return {
        name: tag,
    };
});

const populateMockData = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        await Promise.all([
            Barangay.bulkCreate(barangaysM, { transaction: t }),
            Tag.bulkCreate(tagsM, { transaction: t }),
            User.bulkCreate(usersM, { transaction: t }),
            Contact.bulkCreate(contactsM, { transaction: t }),
        ]);
        await t.commit();
        res.status(StatusCodes.CREATED).json({ msg: 'Success! Mock data populated' });
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'Failed to populate mock data' });
    }
};

module.exports = populateMockData;
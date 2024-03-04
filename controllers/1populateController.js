const { users: User, barangays: Barangay, tags: Tag } = require('../models');
const { StatusCodes } = require("http-status-codes");
const { usersM, barangaysM } = require('../mockData');
const { TAGS } = require('../utils');

const tagsM = TAGS.map(tag => {
    return {
        name: tag,
    };
});

const populateMockData = async (req, res) => {
    await Barangay.bulkCreate(barangaysM);
    await Tag.bulkCreate(tagsM);
    await User.bulkCreate(usersM);

    res.status(StatusCodes.CREATED).json({ msg: 'Success! Mock data populated' });
};

module.exports = populateMockData;
const { TAGS } = require('../utils');
module.exports = (sequelize, DataTypes) => {
    const Tag = sequelize.define('tag', {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            timestamps: true,
        },
    );

    return Tag;
};

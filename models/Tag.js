const { TAGS } = require('../utils');
module.exports = (sequelize, DataTypes) => {
    const Tag = sequelize.define('tag', {
            name: {
                type: DataTypes.ENUM(...TAGS),
                allowNull: false,
                validate: {
                    isIn: {
                        args: [TAGS],
                        msg: `Tags must be one of the following: ${ TAGS }`,
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    return Tag;
};

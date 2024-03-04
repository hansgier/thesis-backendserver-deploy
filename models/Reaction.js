const { REACTIONS } = require('../utils');
module.exports = (sequelize, DataTypes) => {
    const Reaction = sequelize.define('reaction', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            reaction_type: {
                type: DataTypes.ENUM(...REACTIONS),
                allowNull: false,
                validate: {
                    isIn: {
                        args: [REACTIONS],
                        msg: `Reaction type must be one of the following: ${ REACTIONS }`,
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    return Reaction;
};

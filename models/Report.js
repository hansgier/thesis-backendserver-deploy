const { PROBLEM_TYPES } = require("../utils");
module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define('report', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('pending', 'resolved', 'rejected'),
                allowNull: false,
                defaultValue: 'pending',
                validate: {
                    isIn: {
                        args: [['pending', 'resolved', 'rejected']],
                        msg: 'Invalid status',
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    return Report;
};

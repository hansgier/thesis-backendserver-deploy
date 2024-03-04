module.exports = (sequelize, DataTypes) => {
    const ProgressHistory = sequelize.define('progress_history', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                validate: {
                    isDate: {
                        args: true,
                        msg: 'Date must be a valid date',
                    },
                    notEmpty: {
                        args: true,
                        msg: 'Date is required',
                    },
                },
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: {
                    isText(value) {
                        if (typeof value !== 'string') {
                            throw new Error('Remarks must be a text');
                        }
                    },
                },
            },
            progress: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: {
                        args: [0],
                        msg: 'Progress cannot be negative',
                    },
                    max: {
                        args: [100],
                        msg: 'Progress cannot exceed 100',
                    },
                    isInt: {
                        args: true,
                        msg: 'Progress must be an integer',
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    return ProgressHistory;
};

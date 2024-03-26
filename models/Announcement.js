module.exports = (sequelize, DataTypes) => {
    const Announcement = sequelize.define('announcements', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a title',
                    },
                    isString(value) {
                        if (typeof value !== 'string') {
                            throw new Error('Title must be a string');
                        }
                    },
                },
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide content',
                    },
                },
            },
        },
    );

    return Announcement;
};

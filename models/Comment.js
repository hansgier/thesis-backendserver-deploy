module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('comment', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a comment',
                    },
                    isText(value) {
                        if (typeof value !== 'string') {
                            throw new Error('Content must be a text');
                        }
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    return Comment;
};

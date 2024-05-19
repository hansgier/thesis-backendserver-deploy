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
                },
            },
        },
        {
            timestamps: true,
        },
    );

    return Comment;
};

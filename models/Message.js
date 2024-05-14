module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('message', {
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
                    msg: 'Please provide a message content',
                },
            },
        },
    }, {
        timestamps: true,
    });

    return Message;
};
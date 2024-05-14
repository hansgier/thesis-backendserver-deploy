module.exports = (sequelize, DataTypes) => {
    const Conversation = sequelize.define('conversation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    }, {
        timestamps: true,
    });

    return Conversation;
};
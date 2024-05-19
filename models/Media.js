module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('media', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            url: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a url',
                    },
                },
            },
            mime_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a mime type',
                    },
                },
            },
            size: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a size',
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    return Media;
};

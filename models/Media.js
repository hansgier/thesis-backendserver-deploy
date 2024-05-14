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
                    isUrl(value) {
                        if (typeof value !== 'string') {
                            throw new Error('Url must be a string');
                        }
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
                    isMimeType(value) {
                        if (typeof value !== 'string') {
                            throw new Error('MIME type must be a string');
                        }
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
                    isInt: {
                        args: true,
                        msg: 'Size must be an integer',
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

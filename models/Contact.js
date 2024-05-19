module.exports = (sequelize, DataTypes) => {
    const Contact = sequelize.define('contact', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    args: true,
                    msg: 'Please provide a name',
                },
            },
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        emails: {
            type: DataTypes.TEXT, // Use TEXT instead of ARRAY for MySQL
            allowNull: true,
            defaultValue: '',
        },
        phones: {
            type: DataTypes.TEXT, // Use TEXT instead of ARRAY for MySQL
            allowNull: true,
            defaultValue: '',
        },
    }, {
        timestamps: true,
    });

    return Contact;
};
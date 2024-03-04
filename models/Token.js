module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define('token', {
            refreshToken: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a refresh token',
                    },
                    notNull: {
                        args: true,
                        msg: 'Please provide a refresh token',
                    },
                },
            },
            ip: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide an IP address',
                    },
                    notNull: {
                        args: true,
                        msg: 'Please provide an IP address',
                    },
                },
            },
            userAgent: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a user agent',
                    },
                    notNull: {
                        args: true,
                        msg: 'Please provide a user agent',
                    },
                },
            },
            isValid: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            timestamps: true,
        },
    );

    return Token;
};

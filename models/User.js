const bcrypt = require('bcryptjs');
const { ThrowErrorIf, ConflictError } = require("../errors");
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a username',
                    },
                    max: {
                        args: [50],
                        msg: 'Username must be at most 50 characters',
                    },
                },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    len: {
                        args: [6, 255],
                        msg: 'Password must be at least 6 characters',
                    },
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a password',
                    },
                },
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide an email',
                    },
                    isEmail: {
                        args: true,
                        msg: 'Please provide a valid email',
                    },
                },
            },
            role: {
                type: DataTypes.ENUM('admin', 'assistant_admin', 'resident', 'barangay', 'guest'),
                allowNull: false,
                defaultValue: 'resident',
                validate: {
                    isIn: {
                        args: [['admin', 'assistant_admin', 'resident', 'barangay', 'guest']],
                        msg: 'Please provide a valid role',
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    User.beforeBulkCreate(async (users) => {
        let userCount = await User.count({});
        for (const user of users) {
            if (user.role === 'barangay') {
                const existingBarangayUser = await User.findOne({
                    where: {
                        barangay_id: user.barangay_id,
                        role: 'barangay',
                    },
                });
                ThrowErrorIf(existingBarangayUser, 'Barangay has already an existing user', ConflictError);
            }
            if (userCount < 1) {
                user.role = 'admin';
                userCount++;
            }
            user.password = await bcrypt.hash(user.password, 10);
        }
    });

    return User;
};


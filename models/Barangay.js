module.exports = (sequelize, DataTypes) => {
    const Barangay = sequelize.define('barangays', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a name',
                    },
                    max: {
                        args: [50],
                        msg: 'Name must be at most 50 characters',
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    return Barangay;
};

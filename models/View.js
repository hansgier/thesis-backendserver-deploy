module.exports = (sequelize, DataTypes) => {
    const View = sequelize.define('view', {
            viewed_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            timestamps: false,
        },
    );

    return View;
};

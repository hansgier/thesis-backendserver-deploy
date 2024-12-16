module.exports = (sequelize, DataTypes) => {
    const FundingSource = sequelize.define('FundingSource', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    }, {
        tableName: 'funding_sources',
        timestamps: true,
    });

    return FundingSource;
};
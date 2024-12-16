const dbConfig = require('../db/dbConfig');
const { Sequelize, DataTypes } = require('sequelize');
const associations = require('./associations');

const sequelize = new Sequelize(
    dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
        host: dbConfig.HOST,
        port: dbConfig.PORT,
        dialect: dbConfig.dialect,
        pool: {
            max: dbConfig.pool.max,
            min: dbConfig.pool.min,
            acquire: dbConfig.pool.acquire,
            idle: dbConfig.pool.idle,
        },
    },
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require('./User')(sequelize, DataTypes);
db.barangays = require('./Barangay')(sequelize, DataTypes);
db.projects = require('./Project')(sequelize, DataTypes);
db.media = require('./Media')(sequelize, DataTypes);
db.comments = require('./Comment')(sequelize, DataTypes);
db.updates = require('./Update')(sequelize, DataTypes);
db.reactions = require('./Reaction')(sequelize, DataTypes);
db.tags = require('./Tag')(sequelize, DataTypes);
db.announcements = require('./Announcement')(sequelize, DataTypes);
db.conversations = require('./Conversation')(sequelize, DataTypes);
db.messages = require('./Message')(sequelize, DataTypes);
db.contacts = require('./Contact')(sequelize, DataTypes);
db.fundingSources = require('./fundingSource')(sequelize, DataTypes);

associations(db);

module.exports = db;
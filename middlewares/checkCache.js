const redis = require('../config/redis');

const checkProjectsCache = async (req, res, next) => {
    const cachedData = await redis.get("projects");

    if (cachedData) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};

const checkAnnouncementsCache = async (req, res, next) => {
    const cachedData = await redis.get('announcements');

    if (cachedData) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};

const checkContactsCache = async (req, res, next) => {
    const cachedData = await redis.get('contacts');

    if (cachedData) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};

const checkBarangaysCache = async (req, res, next) => {
    const cachedData = await redis.get('barangays');

    if (cachedData) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};

const checkUsersCache = async (req, res, next) => {
    const cachedData = await redis.get('users');

    if (cachedData) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};


module.exports = {
    checkProjectsCache,
    checkAnnouncementsCache,
    checkContactsCache,
    checkBarangaysCache,
    checkUsersCache,
};
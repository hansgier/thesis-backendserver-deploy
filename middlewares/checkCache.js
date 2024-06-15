const redis = require('../config/redis');

const checkProjectsCache = async (req, res, next) => {
    const cachedData = await redis.get("projects");

    if (cachedData) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};

const checkSingleProjectCache = async (req, res, next) => {
    const cachedData = await redis.get("single_project");
    const { id } = req.params;

    if (cachedData) {
        const parseData = JSON.parse(cachedData);
        const { project } = parseData;
        if (project.id !== id) {
            await redis.del(["single_project"]);
            return next();
        } else {
            res.send(JSON.parse(cachedData));
        }
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

const checkUpdatesCache = async (req, res, next) => {
    const cachedData = await redis.get('updates');

    if (cachedData) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};


const checkCommentsCache = async (req, res, next) => {
    const cachedData = await redis.get('comments');

    if (cachedData) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};

const checkReactionsCache = async (req, res, next) => {
    const cachedData = await redis.get('reactions');

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

const checkMediaCache = async (req, res, next) => {
    const cachedData = await redis.get('media');
    const { projectId, updateId } = req.params;

    if (cachedData && (projectId || updateId)) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};

const checkConversationsCache = async (req, res, next) => {
    const cachedData = await redis.get('conversations');
    const { projectId, updateId } = req.params;

    if (cachedData && (projectId || updateId)) {
        res.send(JSON.parse(cachedData));
    } else {
        next();
    }
};


//TODO: tiwasa ang mga cache functionality

module.exports = {
    checkProjectsCache,
    checkSingleProjectCache,
    checkAnnouncementsCache,
    checkCommentsCache,
    checkConversationsCache,
    checkContactsCache,
    checkMediaCache,
    checkBarangaysCache,
    checkUpdatesCache,
    checkReactionsCache,
    checkUsersCache,
};
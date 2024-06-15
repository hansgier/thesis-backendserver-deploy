const Redis = require("ioredis");
const redisURL = process.env.REDIS_URL;
const redis = new Redis(redisURL);

module.exports = redis;
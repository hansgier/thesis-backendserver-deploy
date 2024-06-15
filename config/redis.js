const Redis = require("ioredis");
const redisURL = process.env.REDIS_TLS_URL;
const redis = new Redis(redisURL, {
    tls: {
        rejectUnauthorized: false,
    },
});

module.exports = redis;
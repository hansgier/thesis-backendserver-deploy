const Redis = require("ioredis");
// const redisURL = process.env.REDIS_URL;
// const redis = new Redis(redisURL, {
//     // Add connection options
//     retryStrategy: (times) => {
//         const delay = Math.min(times * 50, 2000);
//         return delay;
//     },
//     maxRetriesPerRequest: 3,
// });

const redis = new Redis()
redis.disconnect()



module.exports = redis;
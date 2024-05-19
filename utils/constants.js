const tokenExpirations = {
    ACCESS_TOKEN_EXPIRY: 1000 * 60 * 60 * 24, // 24 hours in milliseconds
    REFRESH_TOKEN_EXPIRY: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days in milliseconds
};

const TAGS = [
    'Administration And Governance',
    'General Public Services',
    'Health',
    'Education',
    'Livelihood',
    'Infrastructure',
    'Environmental Management',
    'Sports And Recreation',
    "Others",
];

const STATUS = [
    'planned',
    'ongoing',
    'on_hold',
    'completed',
    'cancelled',
];

const REACTIONS = [
    'like',
    'dislike',
];

module.exports = { tokenExpirations, TAGS, REACTIONS, STATUS };
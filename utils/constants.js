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

const cacheExpiries = {
    projects: 86400, //1 day
    single_project: 86400, //1 day
    announcements: 86400, //1 day
    contacts: 86400, //1 day
    conversations: 3600, // 1 hr
    messages: 60, // 1 min
    comments: 60, // 1 min
    reactions: 60, // 1 min
    updates: 86400, // 1 hr
    media: 86400, // 1 day
    users: 86400, // 1 day
    barangays: 86400, // 1 day
};

module.exports = { tokenExpirations, TAGS, REACTIONS, STATUS, cacheExpiries };
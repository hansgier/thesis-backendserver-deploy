/**
 * Define associations between models
 * @param {Object} db - Sequelize instance
 */
module.exports = (db) => {
    // Destructure models from db
    const {
        users: User,
        tokens: Token,
        barangays: Barangay,
        projects: Project,
        media: Media,
        comments: Comment,
        reactions: Reaction,
        reports: Report,
        progressHistories: ProgressHistory,
        tags: Tag,
        views: View,
    } = db;

    // User - Token (one-to-many)
    User.hasMany(Token, { foreignKey: 'user_id', as: 'tokens' });
    Token.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    // User - Barangay (many-to-one)
    User.belongsTo(Barangay, { foreignKey: 'barangay_id', as: 'barangay' });
    Barangay.hasMany(User, { foreignKey: 'barangay_id', as: 'users' });

    // User - Project (one-to-many)
    User.hasMany(Project, { foreignKey: 'createdBy', as: 'projects' });
    Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

    // User - Comment (one-to-many)
    User.hasMany(Comment, { foreignKey: 'commented_by', as: 'comments', onDelete: 'cascade' });
    Comment.belongsTo(User, { foreignKey: 'commented_by', as: 'commenter' });

    // User - Reaction (one-to-many)
    User.hasMany(Reaction, { foreignKey: 'reacted_by', as: 'reactions', onDelete: 'cascade' });
    Reaction.belongsTo(User, { foreignKey: 'reacted_by', as: 'reactor' });

    // User - Report (one-to-many)
    User.hasMany(Report, { foreignKey: 'reported_by', as: 'reports', onDelete: 'cascade' });
    Report.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });

    // User - View (one-to-many)
    User.hasMany(View, { foreignKey: 'user_id', as: 'views', onDelete: 'cascade' });
    View.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    // Project - Barangay (many-to-many)
    Project.belongsToMany(Barangay, {
        through: 'ProjectBarangays',
        foreignKey: 'project_id',
        otherKey: 'barangay_id',
        as: 'barangays',
        onDelete: 'cascade',
    });
    Barangay.belongsToMany(Project, {
        through: 'ProjectBarangays',
        foreignKey: 'barangay_id',
        otherKey: 'project_id',
        as: 'projects',
        onDelete: 'cascade',
    });

    // Project - Comment (one-to-many)
    Project.hasMany(Comment, { foreignKey: 'project_id', as: 'comments', onDelete: 'cascade' });
    Comment.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

    // Project - Media (one-to-many)
    Project.hasMany(Media, { foreignKey: 'project_id', as: 'media', onDelete: 'cascade' });
    Media.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

    // Project - ProgressHistory (one-to-many)
    Project.hasMany(ProgressHistory, { foreignKey: 'project_id', as: 'progressHistories', onDelete: 'cascade' });
    ProgressHistory.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

    // Project - Reaction (one-to-many)
    Project.hasMany(Reaction, { foreignKey: 'project_id', as: 'reactions', onDelete: 'cascade' });
    Reaction.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

    // Project - Report (one-to-many)
    Project.hasMany(Report, { foreignKey: 'project_id', as: 'reports' });
    Report.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

    // Project - View (one-to-many)
    Project.hasMany(View, { foreignKey: 'project_id', as: 'viewers', onDelete: 'cascade' });
    View.belongsTo(Project, { foreignKey: 'project_id', as: 'viewedProject' });

    // Project - Tag (many-to-many)
    Project.belongsToMany(Tag, {
        through: 'ProjectTags',
        foreignKey: 'project_id',
        otherKey: 'tag_id',
        as: 'tags',
        onDelete: 'cascade',
    });
    Tag.belongsToMany(Project, {
        through: 'ProjectTags',
        foreignKey: 'tag_id',
        otherKey: 'project_id',
        as: 'projects',
        onDelete: 'cascade',
    });

    // Comment - Reaction (one-to-many)
    Comment.hasMany(Reaction, { foreignKey: 'comment_id', as: 'reactions', onDelete: 'cascade' });
    Reaction.belongsTo(Comment, { foreignKey: 'comment_id', as: 'comment' });

    // Comment - Report (one-to-many)
    Comment.hasMany(Report, { foreignKey: 'comment_id', as: 'reports' });
    Report.belongsTo(Comment, { foreignKey: 'comment_id', as: 'comment' });

    // ProgressHistory - Media (one-to-many)
    ProgressHistory.hasMany(Media, { foreignKey: 'progressHistory_id', as: 'media', onDelete: 'cascade' });
    Media.belongsTo(ProgressHistory, { foreignKey: 'progressHistory_id', as: 'progressHistory' });

    // Report - Media (one-to-many)
    Report.hasMany(Media, { foreignKey: 'report_id', as: 'media', onDelete: 'cascade' });
    Media.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });
};
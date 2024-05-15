/**
 * Define associations between models
 * @param {Object} db - Sequelize instance
 */
module.exports = (db) => {
    // Destructure models from db
    const {
        users: User,
        barangays: Barangay,
        projects: Project,
        media: Media,
        comments: Comment,
        reactions: Reaction,
        updates: Update,
        tags: Tag,
        views: View,
        announcements: Announcement,
        conversations: Conversation,
        messages: Message,
    } = db;
    
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

    // Project - Update (one-to-many)
    Project.hasMany(Update, { foreignKey: 'project_id', as: 'updates', onDelete: 'cascade' });
    Update.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

    // Project - Reaction (one-to-many)
    Project.hasMany(Reaction, { foreignKey: 'project_id', as: 'reactions', onDelete: 'cascade' });
    Reaction.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

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

    // Update - Media (one-to-many)
    Update.hasMany(Media, { foreignKey: 'update_id', as: 'media', onDelete: 'cascade' });
    Media.belongsTo(Update, { foreignKey: 'update_id', as: 'update' });

    // User - Announcement (one-to-many)
    User.hasMany(Announcement, { foreignKey: 'createdBy', as: 'announcements' });
    Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

    // User - Conversation (many-to-many)
    User.belongsToMany(Conversation, {
        through: 'UserConversations',
        foreignKey: 'user_id',
        otherKey: 'conversation_id',
        as: 'conversations',
    });
    Conversation.belongsToMany(User, {
        through: 'UserConversations',
        foreignKey: 'conversation_id',
        otherKey: 'user_id',
        as: 'users',
    });

    // Conversation - Message (one-to-many)
    Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
    Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

    // User - Message (one-to-many)
    User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
    Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
};
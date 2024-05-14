const db = require('../models');
const { conversations: Conversation, messages: Message, users: User } = require('../models');
const { NotFoundError, ThrowErrorIf, UnauthorizedError, BadRequestError } = require("../errors");
const { Op, Sequelize } = require("sequelize");

exports.createConversation = async (userId1, userId2) => {
    // Check if both user IDs exist in the database
    const [user1, user2] = await Promise.all([
        User.findByPk(userId1),
        User.findByPk(userId2),
    ]);

    // Throw an error if either user is not found
    ThrowErrorIf(!user1, `User with ID ${ userId1 } not found`, NotFoundError);
    ThrowErrorIf(!user2, `User with ID ${ userId2 } not found`, NotFoundError);
    
    // If no conversation exists, create a new one within a transaction
    return await db.sequelize.transaction(async (t) => {
        const newConversation = await Conversation.create({}, { transaction: t });
        await newConversation.addUser(userId1, { through: 'UserConversations', transaction: t });
        await newConversation.addUser(userId2, { through: 'UserConversations', transaction: t });
        return newConversation;
    });
};


exports.getAllConversations = async (userId) => {
    // Find the user
    const user = await User.findByPk(userId);
    ThrowErrorIf(!user, `User with ID ${ userId } not found`, NotFoundError);

    // Get all conversations associated with the user
    const conversations = await user.getConversations({
        include: [
            {
                model: User,
                as: 'users',
                attributes: ['id', 'username'],
                through: {
                    attributes: [],
                },
            },
        ],
    });

    return conversations;
};


exports.getMessages = async (conversationId, req) => {
    // Validate conversationId
    if (!conversationId || typeof conversationId !== 'string') {
        throw new BadRequestError('Invalid conversation ID');
    }

    // Check if the conversation exists and the user is a participant
    const conversation = await Conversation.findOne({
        where: { id: conversationId },
        include: [
            {
                model: User,
                as: 'users',
                attributes: ['id'],
            },
        ],
    });

    if (!conversation) {
        throw new NotFoundError('Conversation not found');
    }


    const userIds = conversation.users.map((user) => user.id);
    if (!userIds.includes(req.user.userId)) {
        throw new UnauthorizedError('Not authorized to access this conversation');
    }

    // Fetch messages with senders
    const messages = await conversation.getMessages({
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username'],
            },
        ],
    });

    return messages;
};

exports.sendMessage = async (conversationId, senderId, content) => {
    // Validate conversationId and content
    if (!conversationId || typeof conversationId !== 'string') {
        throw new BadRequestError('Invalid conversation ID');
    }

    if (!content || typeof content !== 'string') {
        throw new BadRequestError('Invalid message content');
    }

    // Check if the conversation exists and the user is a participant
    const conversation = await Conversation.findByPk(conversationId, {
        include: [
            {
                model: User,
                as: 'users',
                attributes: ['id'],
            },
        ],
    });

    if (!conversation) {
        throw new NotFoundError('Conversation not found');
    }

    const userIds = conversation.users.map((user) => user.id);
    if (!userIds.includes(senderId)) {
        throw new UnauthorizedError('Not authorized to send messages in this conversation');
    }

    // Create a new message within a transaction
    return await db.sequelize.transaction(async (t) => {
        const newMessage = await Message.create(
            {
                content,
                conversation_id: conversationId,
                sender_id: senderId,
            },
            { transaction: t },
        );
        return newMessage;
    });
};
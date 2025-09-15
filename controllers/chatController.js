const chatService = require('../services/chatService');
const { StatusCodes } = require("http-status-codes");
const { ThrowErrorIf, BadRequestError } = require("../errors");
const { cacheExpiries } = require("../utils");

const createConversation = async (req, res) => {
    const { user2Id } = req.body;
    ThrowErrorIf(!user2Id || user2Id === '', 'userId is required', BadRequestError);
    const conversation = await chatService.createConversation(req.user.userId, user2Id);
    res.status(StatusCodes.CREATED).json({
        msg: `Conversation created with an ID of: ${ conversation.id }`,
        conversation,
    });
};

const getAllConversations = async (req, res) => {
    const { userId } = req.user;
    const conversations = await chatService.getAllConversations(userId);
    const data = { total_conversation: conversations.length, conversations };
    res.status(StatusCodes.OK).json(data);
};

const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    ThrowErrorIf(!conversationId || conversationId === '', 'conversationId is required', BadRequestError);
    const messages = await chatService.getMessages(conversationId, req);
    const data = { total_msg: messages.length, messages };
    res.status(StatusCodes.OK).json(data);
};

const sendMessage = async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    ThrowErrorIf(!conversationId || conversationId === '', 'conversationId is required', BadRequestError);
    ThrowErrorIf(!content || content === '', 'conversationId is required', BadRequestError);
    const message = await chatService.sendMessage(conversationId, req.user.userId, content);
    res.status(StatusCodes.CREATED).json({ message });
};

module.exports = {
    createConversation,
    getMessages,
    sendMessage,
    getAllConversations,
};
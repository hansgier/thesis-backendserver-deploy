const express = require('express');
const router = express.Router();
const { authenticateUser } = require("../middlewares/authentication");
const { createConversation, getMessages, sendMessage, getAllConversations } = require("../controllers/chatController");

router.route("/")
    .get(authenticateUser, getAllConversations)
    .post(authenticateUser, createConversation);

router.route('/:conversationId/messages')
    .get(authenticateUser, getMessages);
router.route('/:conversationId/messages')
    .post(authenticateUser, sendMessage);

module.exports = router;
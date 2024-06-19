const router = require('express').Router();
const { authenticateUser, authorizePermission } = require("../middlewares/authentication");
const { createConversation, getMessages, sendMessage, getAllConversations } = require("../controllers/chatController");
const {
    getAllContacts,
    createContact,
    getContact,
    updateContact,
    deleteAllContacts, deleteContact,
} = require("../controllers/contactController");
const { checkContactsCache } = require("../middlewares/checkCache");

router.route("/")
    .get(authenticateUser, checkContactsCache, getAllContacts)
    .post(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), createContact)
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteAllContacts);

router.route('/:id')
    .get(authenticateUser, getContact)
    .patch(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), updateContact)
    .delete(authenticateUser, authorizePermission('admin', 'barangay', 'assistant_admin'), deleteContact);

module.exports = router;
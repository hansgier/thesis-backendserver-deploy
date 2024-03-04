const router = require('express').Router();
const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');
const { getAllReactions, deleteAllReactions } = require("../controllers/reactionController");


router.route('/')
    .get(authenticateUser, authorizePermissions, getAllReactions)
    .delete(authenticateUser, authorizePermissions, deleteAllReactions);

module.exports = router;

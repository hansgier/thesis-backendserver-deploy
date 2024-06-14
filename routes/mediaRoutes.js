const { deleteMedia } = require("../controllers/mediaController");
const router = require('express').Router();


router.route('/').delete(deleteMedia);
router.route('/:id').delete(deleteMedia);

module.exports = router;
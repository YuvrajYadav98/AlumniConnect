const express = require("express");
const {
  listConversations,
  getMessageThread,
  sendMessageRest,
  markThreadRead,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Static path declared before the dynamic "/:userId" path, so Express
// never mistakes "conversations" for a user id.
router.get("/conversations", listConversations);

router.get("/:userId", getMessageThread);
router.post("/:userId", sendMessageRest);
router.patch("/:userId/read", markThreadRead);

module.exports = router;

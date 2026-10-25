const express = require("express");
const {
  sendConnectionRequest,
  getConnectionStatus,
  acceptConnectionRequest,
  rejectConnectionRequest,
  deleteConnection,
  blockUser,
  listConnections,
  listPendingRequests,
} = require("../controllers/connectionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Static paths declared before dynamic "/:userId" / "/:id" paths, so
// Express never mistakes "pending", "status", or "block" for an id.
router.get("/", listConnections);
router.get("/pending", listPendingRequests);
router.get("/status/:userId", getConnectionStatus);
router.put("/block/:userId", blockUser);

router.post("/:userId", sendConnectionRequest);
router.put("/:id/accept", acceptConnectionRequest);
router.put("/:id/reject", rejectConnectionRequest);
router.delete("/:id", deleteConnection);

module.exports = router;

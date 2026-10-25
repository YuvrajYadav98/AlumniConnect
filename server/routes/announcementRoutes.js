const express = require("express");
const {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(protect);

router.get("/", listAnnouncements);
router.post("/", authorize(ROLES.ADMIN), createAnnouncement);
router.delete("/:id", authorize(ROLES.ADMIN), deleteAnnouncement);

module.exports = router;

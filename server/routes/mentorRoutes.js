const express = require("express");
const { listMentors } = require("../controllers/mentorController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", listMentors);

module.exports = router;

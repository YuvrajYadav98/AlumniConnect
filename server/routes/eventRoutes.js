const express = require("express");
const {
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  getEventParticipants,
  listEvents,
  getEventById,
  uploadEventImage,
} = require("../controllers/eventController");
const {
  registerForEvent,
  cancelRegistration,
  listMyRegisteredEvents,
} = require("../controllers/eventRegistrationController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { handleSingleUpload } = require("../middleware/uploadMiddleware");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(protect);

// Static paths declared before dynamic "/:id" paths, so Express never
// mistakes "registrations" for an event id.
router.get("/registrations/me", listMyRegisteredEvents);

router.get("/", listEvents);
router.post("/", authorize(ROLES.ADMIN), createEvent);

router.get("/:id", getEventById);
router.put("/:id", authorize(ROLES.ADMIN), updateEvent);
router.delete("/:id", authorize(ROLES.ADMIN), deleteEvent);

router.put("/:id/publish", authorize(ROLES.ADMIN), publishEvent);
router.put("/:id/cancel", authorize(ROLES.ADMIN), cancelEvent);
router.put(
  "/:id/image",
  authorize(ROLES.ADMIN),
  handleSingleUpload("image"),
  uploadEventImage
);
router.get("/:id/participants", authorize(ROLES.ADMIN), getEventParticipants);

router.post("/:id/register", registerForEvent);
router.delete("/:id/register", cancelRegistration);

module.exports = router;

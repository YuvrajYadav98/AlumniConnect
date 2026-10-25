const mongoose = require("mongoose");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { buildContainsRegex } = require("../utils/regexHelpers");
const { ROLES } = require("../utils/roles");
const { notifyUsers } = require("../utils/notify");

const ALLOWED_FIELDS = [
  "title",
  "description",
  "image",
  "eventType",
  "date",
  "startTime",
  "endTime",
  "registrationDeadline",
  "mode",
  "location",
  "meetingLink",
  "maxParticipants",
];

const pickAllowedFields = (body) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

// Streams a Buffer (from multer's memory storage) up to Cloudinary
// without ever writing it to disk.
const streamUploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "alumni-connect/event-images",
        transformation: [
          { width: 1200, height: 630, crop: "fill" },
          { quality: "auto", fetch_format: "auto" },
        ],
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// @desc    Upload/replace an event's banner image
// @route   PUT /api/events/:id/image
// @access  Private (admin only)
const uploadEventImage = asyncHandler(async (req, res) => {
  const event = await findEventOr404(req.params.id, res);

  if (!req.file) {
    res.status(400);
    throw new Error("No image file was provided");
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    res.status(500);
    throw new Error("Image upload is not configured on the server (missing Cloudinary credentials)");
  }

  const result = await streamUploadToCloudinary(req.file.buffer);

  event.image = result.secure_url;
  await event.save();

  res.status(200).json({ success: true, image: event.image, event });
});

// @desc    Create a new event (starts as an unpublished draft)
// @route   POST /api/events
// @access  Private (admin only)
const createEvent = asyncHandler(async (req, res) => {
  const data = pickAllowedFields(req.body);

  const event = await Event.create({
    ...data,
    organizer: req.user._id,
    isPublished: false,
  });

  res.status(201).json({ success: true, event });
});

// Shared lookup used by every admin action below.
const findEventOr404 = async (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid event id");
  }
  const event = await Event.findById(id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  return event;
};

// @desc    Update an event's details
// @route   PUT /api/events/:id
// @access  Private (admin only)
const updateEvent = asyncHandler(async (req, res) => {
  const event = await findEventOr404(req.params.id, res);
  const data = pickAllowedFields(req.body);

  Object.assign(event, data);
  await event.save();

  res.status(200).json({ success: true, event });
});

// @desc    Permanently delete an event and its registrations
// @route   DELETE /api/events/:id
// @access  Private (admin only)
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await findEventOr404(req.params.id, res);

  await Promise.all([
    EventRegistration.deleteMany({ event: event._id }),
    event.deleteOne(),
  ]);

  res.status(200).json({ success: true, message: "Event deleted" });
});

// @desc    Publish a draft event, making it visible to alumni/students
// @route   PUT /api/events/:id/publish
// @access  Private (admin only)
const publishEvent = asyncHandler(async (req, res) => {
  const event = await findEventOr404(req.params.id, res);

  event.isPublished = true;
  await event.save();

  // Notify everyone eligible to attend - approved students and
  // verified alumni (the same population that can see the event in
  // listJobs/listAlumniDirectory-style visibility elsewhere). A single
  // insertMany rather than N individual notify() calls, since this can
  // reach every user on the platform.
  const audience = await User.find({
    $or: [
      { role: ROLES.STUDENT },
      { role: ROLES.ALUMNI, verificationStatus: "approved" },
    ],
  }).select("_id");

  await notifyUsers(
    audience.map((u) => u._id),
    {
      sender: req.user._id,
      type: "event",
      title: "New event: " + event.title,
      message: `A new ${event.eventType} has been announced for ${new Date(
        event.date
      ).toLocaleDateString()}.`,
      relatedEntity: event._id,
      relatedEntityType: "Event",
    }
  );

  res.status(200).json({ success: true, message: "Event published", event });
});

// @desc    Cancel an event (stays visible, marked cancelled - not deleted)
// @route   PUT /api/events/:id/cancel
// @access  Private (admin only)
const cancelEvent = asyncHandler(async (req, res) => {
  const event = await findEventOr404(req.params.id, res);

  event.status = "cancelled";
  await event.save();

  res.status(200).json({ success: true, message: "Event cancelled", event });
});

// @desc    View the list of participants registered for an event
// @route   GET /api/events/:id/participants
// @access  Private (admin only)
const getEventParticipants = asyncHandler(async (req, res) => {
  await findEventOr404(req.params.id, res); // 404s if the event doesn't exist
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { event: req.params.id, status: { $ne: "cancelled" } };

  const [registrations, total] = await Promise.all([
    EventRegistration.find(filter)
      .sort({ registeredAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email role profileImage"),
    EventRegistration.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: registrations.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    participants: registrations,
  });
});

// @desc    List events. Alumni/students only ever see published events;
//          admins can additionally request drafts via ?includeUnpublished=true
// @route   GET /api/events?search=&when=upcoming|past&includeUnpublished=&page=&limit=
// @access  Private (any authenticated user)
const listEvents = asyncHandler(async (req, res) => {
  const { search, when, includeUnpublished } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};

  // Only an admin requesting it explicitly can see unpublished drafts -
  // any other caller (or an admin not asking for it) only sees published events.
  if (!(req.user.role === ROLES.ADMIN && includeUnpublished === "true")) {
    filter.isPublished = true;
  }

  const now = new Date();
  if (when === "upcoming") {
    filter.date = { $gte: now };
  } else if (when === "past") {
    filter.date = { $lt: now };
  }

  const searchRegex = buildContainsRegex(search);
  if (searchRegex) {
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate("organizer", "name profileImage")
      .lean(), // read-only response - skip Mongoose document hydration
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: events.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    events,
  });
});

// @desc    Get a single event's details
// @route   GET /api/events/:id
// @access  Private (any authenticated user; unpublished events are
//          admin/organizer-only)
const getEventById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid event id");
  }

  const event = await Event.findById(req.params.id).populate(
    "organizer",
    "name profileImage"
  );

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  if (!event.isPublished && req.user.role !== ROLES.ADMIN) {
    res.status(404);
    throw new Error("Event not found");
  }

  // Let the caller know their own registration status, so the frontend
  // doesn't need a second request just to decide what button to show.
  const myRegistration = await EventRegistration.findOne({
    event: event._id,
    user: req.user._id,
  });

  const registeredCount = await EventRegistration.countDocuments({
    event: event._id,
    status: { $ne: "cancelled" },
  });

  res.status(200).json({
    success: true,
    event,
    registeredCount,
    isFull: event.maxParticipants ? registeredCount >= event.maxParticipants : false,
    myRegistrationStatus: myRegistration?.status || null,
  });
});

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  getEventParticipants,
  listEvents,
  getEventById,
  uploadEventImage,
};

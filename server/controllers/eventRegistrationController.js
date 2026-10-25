const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { notifyUser } = require("../utils/notify");

// @desc    Register the logged-in user for an event
// @route   POST /api/events/:id/register
// @access  Private (alumni or student)
const registerForEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid event id");
  }

  const event = await Event.findById(id);
  if (!event || !event.isPublished) {
    res.status(404);
    throw new Error("Event not found");
  }

  if (event.status === "cancelled") {
    res.status(400);
    throw new Error("This event has been cancelled");
  }

  if (new Date() > new Date(event.registrationDeadline)) {
    res.status(400);
    throw new Error("The registration deadline for this event has passed");
  }

  // Duplicate-registration prevention: a unique {event, user} index backs
  // this up at the DB level, but check first so we can give a clean
  // message and reuse a previously-cancelled row instead of erroring.
  const existing = await EventRegistration.findOne({ event: id, user: req.user._id });

  if (existing && existing.status !== "cancelled") {
    return res.status(200).json({
      success: true,
      message: "You are already registered for this event",
      registration: existing,
    });
  }

  // Capacity check applies whether this is a brand-new registration or a
  // re-registration after a prior cancellation.
  if (event.maxParticipants) {
    const activeCount = await EventRegistration.countDocuments({
      event: id,
      status: { $ne: "cancelled" },
    });
    if (activeCount >= event.maxParticipants) {
      res.status(400);
      throw new Error("This event has reached its maximum number of participants");
    }
  }

  if (!existing) {
    const registration = await EventRegistration.create({
      event: id,
      user: req.user._id,
      status: "registered",
    });

    await notifyUser({
      recipient: event.organizer,
      sender: req.user._id,
      type: "event",
      title: "New event registration",
      message: `${req.user.name} registered for "${event.title}".`,
      relatedEntity: event._id,
      relatedEntityType: "Event",
    });

    return res.status(201).json({ success: true, registration });
  }

  existing.status = "registered";
  existing.registeredAt = new Date();
  await existing.save();

  await notifyUser({
    recipient: event.organizer,
    sender: req.user._id,
    type: "event",
    title: "New event registration",
    message: `${req.user.name} registered for "${event.title}".`,
    relatedEntity: event._id,
    relatedEntityType: "Event",
  });

  res.status(200).json({ success: true, registration: existing });
});

// @desc    Cancel the logged-in user's registration for an event
// @route   DELETE /api/events/:id/register
// @access  Private
const cancelRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid event id");
  }

  const registration = await EventRegistration.findOne({ event: id, user: req.user._id });

  if (!registration || registration.status === "cancelled") {
    res.status(404);
    throw new Error("You are not registered for this event");
  }

  registration.status = "cancelled";
  await registration.save();

  res.status(200).json({ success: true, message: "Registration cancelled" });
});

// @desc    List the events the logged-in user has registered for
// @route   GET /api/events/registrations/me?when=upcoming|past&page=&limit=
// @access  Private
const listMyRegisteredEvents = asyncHandler(async (req, res) => {
  const { when } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  const now = new Date();

  // Aggregation instead of find()+populate() so the upcoming/past split
  // (which depends on the *event's* date, not anything on the
  // registration itself) and the pagination both happen in MongoDB
  // rather than fetching every one of the user's registrations into
  // Node and slicing them in memory.
  const pipeline = [
    { $match: { user: req.user._id, status: { $ne: "cancelled" } } },
    {
      $lookup: {
        from: "events",
        localField: "event",
        foreignField: "_id",
        as: "event",
      },
    },
    // Also drops registrations whose event was since deleted, since an
    // unmatched $lookup produces an empty array and $unwind discards it.
    { $unwind: "$event" },
    ...(when === "upcoming" ? [{ $match: { "event.date": { $gte: now } } }] : []),
    ...(when === "past" ? [{ $match: { "event.date": { $lt: now } } }] : []),
    { $sort: { registeredAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          { $project: { _id: 1, status: 1, registeredAt: 1, event: 1 } },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await EventRegistration.aggregate(pipeline);
  const registrations = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  res.status(200).json({
    success: true,
    count: registrations.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    registrations,
  });
});

module.exports = { registerForEvent, cancelRegistration, listMyRegisteredEvents };

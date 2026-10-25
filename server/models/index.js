// Central export point so controllers can do:
//   const { User, Event, Job } = require("../models");
module.exports = {
  User: require("./User"),
  AlumniProfile: require("./AlumniProfile"),
  Event: require("./Event"),
  EventRegistration: require("./EventRegistration"),
  Job: require("./Job"),
  SavedJob: require("./SavedJob"),
  JobApplication: require("./JobApplication"),
  Achievement: require("./Achievement"),
  Connection: require("./Connection"),
  Message: require("./Message"),
  Notification: require("./Notification"),
  Announcement: require("./Announcement"),
  MentorshipRequest: require("./MentorshipRequest"),
};

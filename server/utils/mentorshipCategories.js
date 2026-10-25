// Centralized enum so the AlumniProfile schema, mentor-profile
// controller (validating categories a mentor sets), and mentorship
// request controller (validating the category a student requests)
// all stay in sync with a single source of truth.

const MENTORSHIP_CATEGORIES = Object.freeze([
  "MERN Stack",
  "Java",
  "DSA",
  "Web Development",
  "AI",
  "Cloud",
  "Career Guidance",
  "Interview Preparation",
  "Placement",
]);

module.exports = { MENTORSHIP_CATEGORIES };

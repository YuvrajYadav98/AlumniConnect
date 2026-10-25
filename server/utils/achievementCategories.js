// Single source of truth for achievement categories, shared by the
// Achievement schema and the submit-achievement controller's validation.
const ACHIEVEMENT_CATEGORIES = Object.freeze([
  "award",
  "promotion",
  "certification",
  "hackathon",
  "startup",
  "research_paper",
  "patent",
  "competition",
  "other",
]);

// Human-readable labels for the slug values above.
const ACHIEVEMENT_CATEGORY_LABELS = Object.freeze({
  award: "Award",
  promotion: "Promotion",
  certification: "Certification",
  hackathon: "Hackathon",
  startup: "Startup",
  research_paper: "Research Paper",
  patent: "Patent",
  competition: "Competition",
  other: "Other",
});

module.exports = { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_CATEGORY_LABELS };

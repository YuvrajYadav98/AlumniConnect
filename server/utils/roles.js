// Centralized enum values so they stay in sync across models/controllers.

const ROLES = Object.freeze({
  ADMIN: "admin",
  ALUMNI: "alumni",
  STUDENT: "student",
});

const ROLE_VALUES = Object.values(ROLES);

module.exports = { ROLES, ROLE_VALUES };

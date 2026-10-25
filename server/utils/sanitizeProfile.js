const { ROLES } = require("./roles");

/**
 * Returns a plain object version of an AlumniProfile with sensitive
 * fields redacted, unless the viewer is the profile owner or an admin,
 * or the corresponding privacy flag has been opted into by the owner.
 *
 * `profile` must already have `user` populated (needs user._id and,
 * optionally, user.email).
 */
const sanitizeProfileForViewer = (profileDoc, viewer) => {
  const profile = profileDoc.toObject ? profileDoc.toObject() : { ...profileDoc };
  const ownerId = profile.user?._id || profile.user;
  const isOwner = viewer && ownerId && String(ownerId) === String(viewer._id);
  const isAdmin = viewer?.role === ROLES.ADMIN;

  if (isOwner || isAdmin) {
    return profile; // full visibility
  }

  const privacy = profile.privacy || {};

  if (!privacy.showPhone) profile.phone = undefined;
  if (!privacy.showDateOfBirth) profile.dateOfBirth = undefined;
  if (!privacy.showAddress) profile.address = undefined;
  if (!privacy.showEmail && profile.user && typeof profile.user === "object") {
    profile.user = { ...profile.user, email: undefined };
  }

  // Roll number is an internal academic identifier - never shown to
  // anyone other than the owner or an admin, regardless of privacy flags.
  profile.rollNumber = undefined;

  return profile;
};

module.exports = { sanitizeProfileForViewer };

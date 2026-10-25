// Fields checked for a "complete" alumni profile. Kept as a flat list so
// the same weight (1 point each) applies to every simple field, plus a
// few composite checks (arrays / nested objects) below.
const SIMPLE_FIELDS = [
  "phone",
  "gender",
  "dateOfBirth",
  "city",
  "state",
  "country",
  "college",
  "degree",
  "branch",
  "graduationYear",
  "currentCompany",
  "jobTitle",
  "industry",
  "bio",
];

const ARRAY_FIELDS = ["skills", "achievements", "certifications", "interests", "workExperience"];

/**
 * Returns an integer 0-100 representing how "complete" an AlumniProfile
 * is. `profileImage` is passed separately since it actually lives on the
 * User document, not AlumniProfile. Returns 0 if no profile exists yet.
 */
const calculateProfileCompletion = (profile, profileImage) => {
  if (!profile) return 0;

  let total = 0;
  let filled = 0;

  for (const field of SIMPLE_FIELDS) {
    total += 1;
    if (profile[field] !== undefined && profile[field] !== null && profile[field] !== "") {
      filled += 1;
    }
  }

  for (const field of ARRAY_FIELDS) {
    total += 1;
    if (Array.isArray(profile[field]) && profile[field].length > 0) filled += 1;
  }

  total += 1; // social links
  const social = profile.socialLinks?.toObject
    ? profile.socialLinks.toObject()
    : profile.socialLinks;
  if (social && Object.values(social).some(Boolean)) filled += 1;

  total += 1; // profile image
  if (profileImage) filled += 1;

  return Math.round((filled / total) * 100);
};

module.exports = { calculateProfileCompletion };

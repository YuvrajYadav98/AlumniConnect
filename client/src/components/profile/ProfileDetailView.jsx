import { ExternalLink } from "lucide-react";
import AlumniAchievementsSection from "./AlumniAchievementsSection";

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800 font-medium">{value}</dd>
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">Not specified</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="text-xs bg-slate-100 text-slate-600 rounded-full px-3 py-1"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/**
 * Renders an AlumniProfile (already privacy-filtered by the backend)
 * read-only. Works both for viewing your own profile and someone else's
 * - fields the backend redacted simply won't be present, so they're
 * naturally skipped by <Field> without any extra logic here.
 */
export default function ProfileDetailView({ profile }) {
  const user = profile.user || {};
  const social = profile.socialLinks || {};

  return (
    <div className="space-y-6">
      <Section title="Personal Information">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Phone" value={profile.phone} />
          <Field label="Gender" value={profile.gender?.replace(/_/g, " ")} />
          <Field
            label="Date of Birth"
            value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : null}
          />
          <Field label="Address" value={profile.address} />
          <Field label="City" value={profile.city} />
          <Field label="State" value={profile.state} />
          <Field label="Country" value={profile.country} />
        </dl>
      </Section>

      <Section title="Academic Information">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="College" value={profile.college} />
          <Field label="Degree" value={profile.degree} />
          <Field label="Branch" value={profile.branch} />
          <Field label="Batch" value={profile.batch} />
          <Field label="Admission Year" value={profile.admissionYear} />
          <Field label="Graduation Year" value={profile.graduationYear} />
          <Field label="Roll Number" value={profile.rollNumber} />
        </dl>
      </Section>

      <Section title="Career Information">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Current Company" value={profile.currentCompany} />
          <Field label="Job Title" value={profile.jobTitle} />
          <Field label="Industry" value={profile.industry} />
          <Field
            label="Experience"
            value={
              profile.experienceYears !== undefined && profile.experienceYears !== null
                ? `${profile.experienceYears} years`
                : null
            }
          />
        </dl>

        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2">Skills</p>
          <TagList items={profile.skills} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {social.linkedin && (
            <a
              href={social.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
            >
              <ExternalLink size={16} /> LinkedIn
            </a>
          )}
          {social.github && (
            <a
              href={social.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
            >
              <ExternalLink size={16} /> GitHub
            </a>
          )}
          {social.portfolio && (
            <a
              href={social.portfolio}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
            >
              <ExternalLink size={16} /> Portfolio
            </a>
          )}
        </div>
      </Section>

      <Section title="Additional">
        {profile.bio && <p className="text-sm text-slate-700 mb-4">{profile.bio}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-2">Achievements</p>
            <TagList items={profile.achievements} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Certifications</p>
            <TagList items={profile.certifications} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Interests</p>
            <TagList items={profile.interests} />
          </div>
        </div>
      </Section>

      <Section title="Verified Achievements">
        <AlumniAchievementsSection userId={user._id} />
      </Section>
    </div>
  );
}

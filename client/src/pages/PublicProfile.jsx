import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getProfileByUserId } from "../services/alumniService";
import { getErrorMessage } from "../utils/getErrorMessage";
import ProfileDetailView from "../components/profile/ProfileDetailView";
import ConnectButton from "../components/ConnectButton";
import MessageButton from "../components/MessageButton";

export default function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setProfile(null);

    (async () => {
      try {
        const data = await getProfileByUserId(userId);
        setProfile(data.profile);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <section className="max-w-3xl mx-auto">
      <Link
        to="/alumni"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to directory
      </Link>

      {loading ? (
        <p className="text-center text-slate-500 py-16">Loading profile...</p>
      ) : error ? (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center ring-4 ring-white shadow shrink-0">
                {profile.user?.profileImage ? (
                  <img loading="lazy" decoding="async"
                    src={profile.user.profileImage}
                    alt={profile.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-slate-500">
                    {profile.user?.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  {profile.user?.name}
                </h1>
                <p className="text-sm text-slate-500">
                  {profile.jobTitle || "—"}{" "}
                  {profile.currentCompany && `at ${profile.currentCompany}`}
                </p>
                {profile.isAvailableForMentorship && (
                  <span className="inline-block mt-2 text-xs bg-green-50 text-green-700 ring-1 ring-green-200 rounded-full px-2 py-0.5">
                    Open to mentoring
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MessageButton userId={userId} />
              <ConnectButton userId={userId} />
            </div>
          </div>

          <ProfileDetailView profile={profile} />
        </>
      )}
    </section>
  );
}

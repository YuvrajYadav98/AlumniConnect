import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../services/alumniService";
import { getErrorMessage } from "../utils/getErrorMessage";
import Button from "../components/Button";
import ProgressBar from "../components/dashboard/ProgressBar";
import ProfileDetailView from "../components/profile/ProfileDetailView";

export default function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();
        setProfile(data.profile);
        setCompletion(data.profileCompletion ?? 0);
      } catch (err) {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(getErrorMessage(err));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (user?.role !== "alumni") {
    return (
      <section className="max-w-md mx-auto bg-white p-8 rounded-lg border border-slate-200 text-center">
        <p className="text-slate-600">
          Alumni profiles are only available for alumni accounts.
        </p>
      </section>
    );
  }

  if (loading) {
    return <p className="text-center text-slate-500 py-16">Loading profile...</p>;
  }

  if (notFound) {
    return (
      <section className="max-w-md mx-auto bg-white p-8 rounded-lg border border-slate-200 text-center">
        <p className="text-slate-600 mb-4">You haven't created your alumni profile yet.</p>
        <Link to="/profile/edit">
          <Button>Create Profile</Button>
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center ring-4 ring-white shadow shrink-0">
          {user.profileImage ? (
            <img loading="lazy" decoding="async" src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-slate-500">
              {user.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 w-full">
          <h1 className="text-2xl font-semibold text-slate-800">{user.name}</h1>
          <p className="text-sm text-slate-500">
            {profile.jobTitle || "—"} {profile.currentCompany && `at ${profile.currentCompany}`}
          </p>
          <div className="mt-3 max-w-xs">
            <ProgressBar
              percent={completion}
              colorClass={
                completion >= 80 ? "bg-green-600" : completion >= 40 ? "bg-amber-500" : "bg-rose-500"
              }
            />
          </div>
        </div>
        <Link to="/profile/edit">
          <Button className="flex items-center gap-1">
            <Pencil size={14} /> Edit Profile
          </Button>
        </Link>
      </div>

      <ProfileDetailView profile={{ ...profile, user }} />
    </section>
  );
}

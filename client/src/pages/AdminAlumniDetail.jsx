import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  getAlumniById,
  approveAlumni,
  rejectAlumni,
  deleteAlumni,
} from "../services/adminAlumniService";
import { getErrorMessage } from "../utils/getErrorMessage";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import ProfileDetailView from "../components/profile/ProfileDetailView";

export default function AdminAlumniDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alumniUser, setAlumniUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioning, setActioning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAlumniById(id);
      setAlumniUser(data.alumni);
      setProfile(data.profile);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleApprove = async () => {
    setActioning(true);
    try {
      const data = await approveAlumni(id);
      setAlumniUser(data.alumni);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    setActioning(true);
    try {
      const data = await rejectAlumni(id);
      setAlumniUser(data.alumni);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async () => {
    setActioning(true);
    try {
      await deleteAlumni(id);
      navigate("/admin/alumni", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setActioning(false);
    }
  };

  if (loading) {
    return <p className="text-center text-slate-500 py-16">Loading...</p>;
  }

  return (
    <section className="max-w-3xl mx-auto">
      <Link
        to="/admin/alumni"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to alumni list
      </Link>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {alumniUser && (
        <>
          <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {alumniUser.profileImage ? (
                    <img loading="lazy" decoding="async"
                      src={alumniUser.profileImage}
                      alt={alumniUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-slate-500">
                      {alumniUser.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-800">{alumniUser.name}</h1>
                  <p className="text-sm text-slate-500">{alumniUser.email}</p>
                  <div className="mt-1">
                    <StatusBadge status={alumniUser.verificationStatus} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {alumniUser.verificationStatus !== "approved" && (
                  <Button
                    onClick={handleApprove}
                    disabled={actioning}
                    className="bg-green-600 hover:bg-green-500 text-sm px-3 py-1.5"
                  >
                    Approve
                  </Button>
                )}
                {alumniUser.verificationStatus !== "rejected" && (
                  <Button
                    onClick={handleReject}
                    disabled={actioning}
                    className="bg-amber-600 hover:bg-amber-500 text-sm px-3 py-1.5"
                  >
                    Reject
                  </Button>
                )}
                <Button
                  onClick={() => setConfirmDelete(true)}
                  disabled={actioning}
                  className="bg-red-600 hover:bg-red-500 text-sm px-3 py-1.5"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {profile ? (
            <ProfileDetailView profile={{ ...profile, user: alumniUser }} />
          ) : (
            <div className="bg-white p-6 rounded-lg border border-slate-200 text-sm text-slate-500">
              This alumni hasn't created their profile yet.
            </div>
          )}
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Delete alumni account?</h2>
            <p className="text-sm text-slate-500 mb-6">
              This permanently deletes the account and its profile. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setConfirmDelete(false)}
                className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={actioning} className="bg-red-600 hover:bg-red-500">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

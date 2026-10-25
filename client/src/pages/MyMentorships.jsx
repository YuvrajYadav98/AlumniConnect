import { useEffect, useState, useCallback } from "react";
import { Check, X, XCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listMyMentorshipRequests,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  completeMentorship,
  cancelMentorshipRequest,
} from "../services/mentorshipRequestService";
import { getErrorMessage } from "../utils/getErrorMessage";
import StatusBadge from "../components/StatusBadge";

const STATUS_TABS = ["all", "pending", "accepted", "completed", "rejected"];

export default function MyMentorships() {
  const { user } = useAuth();
  const isMentorView = user?.role === "alumni";

  const [status, setStatus] = useState("all");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMyMentorshipRequests(
        status === "all" ? {} : { status }
      );
      setRequests(data.requests);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const runAction = async (id, fn) => {
    setActioningId(id);
    try {
      await fn(id);
      await fetchRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">
        {isMentorView ? "Mentorship Requests" : "My Mentorship Requests"}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {isMentorView
          ? "Requests students have sent you for mentorship."
          : "Mentorship requests you've sent to alumni mentors."}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
              status === s
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">No mentorship requests here.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const otherPerson = isMentorView ? r.student : r.mentor;
            const busy = actioningId === r._id;
            return (
              <div
                key={r._id}
                className="bg-white border border-slate-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {otherPerson?.profileImage ? (
                        <img loading="lazy" decoding="async"
                          src={otherPerson.profileImage}
                          alt={otherPerson.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-slate-500">
                          {otherPerson?.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {otherPerson?.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isMentorView ? "Student" : "Mentor"} · {r.category}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="mt-3 text-sm">
                  <p className="font-medium text-slate-700">{r.topic}</p>
                  <p className="text-slate-500 mt-0.5">{r.message}</p>
                  {r.mentorNote && (
                    <p className="text-xs text-slate-400 mt-2 italic">
                      Mentor note: {r.mentorNote}
                    </p>
                  )}
                </div>

                {isMentorView && r.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => runAction(r._id, acceptMentorshipRequest)}
                      disabled={busy}
                      className="flex items-center gap-1.5 text-sm font-medium bg-slate-800 text-white rounded-md px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => runAction(r._id, rejectMentorshipRequest)}
                      disabled={busy}
                      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}

                {isMentorView && r.status === "accepted" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => runAction(r._id, completeMentorship)}
                      disabled={busy}
                      className="flex items-center gap-1.5 text-sm font-medium bg-green-600 text-white rounded-md px-3 py-1.5 hover:bg-green-500 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> Mark Completed
                    </button>
                  </div>
                )}

                {!isMentorView && r.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => runAction(r._id, cancelMentorshipRequest)}
                      disabled={busy}
                      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
                    >
                      <XCircle size={14} /> Cancel Request
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

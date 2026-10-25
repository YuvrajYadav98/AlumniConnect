import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, X, Trash2, Eye } from "lucide-react";

import {
  getAllAlumni,
  approveAlumni,
  rejectAlumni,
  deleteAlumni,
} from "../services/adminAlumniService";

import { getErrorMessage } from "../utils/getErrorMessage";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminAlumni() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");

  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedBranch = useDebouncedValue(branch, 400);

  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const filters = {};

      if (status) {
        filters.status = status;
      }

      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }

      if (debouncedBranch) {
        filters.branch = debouncedBranch;
      }

      const data = await getAllAlumni(filters);

      setAlumni(data?.alumni || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, debouncedBranch]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  // Search form submit handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    // Search and branch values are already handled
    // through the debounced values above.
    fetchAlumni();
  };

  const handleApprove = async (id) => {
    setActioningId(id);
    setError("");

    try {
      await approveAlumni(id);

      setAlumni((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                verificationStatus: "approved",
                isApproved: true,
              }
            : a
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    setActioningId(id);
    setError("");

    try {
      await rejectAlumni(id);

      setAlumni((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                verificationStatus: "rejected",
                isApproved: false,
              }
            : a
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id) => {
    setActioningId(id);
    setError("");

    try {
      await deleteAlumni(id);

      setAlumni((prev) => prev.filter((a) => a._id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <section>
      <h1 className="mb-2 text-2xl font-semibold text-slate-800">
        Alumni Verification
      </h1>

      <p className="mb-6 text-sm text-slate-500">
        Review, approve, or reject alumni accounts. Only approved alumni appear
        in the public directory.
      </p>

      {/* Status Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              status === tab.value
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearchSubmit}
        className="mb-6 flex flex-wrap gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        />

        <input
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Filter by branch..."
          className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        />

        <button
          type="submit"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Search
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p className="text-slate-500">Loading alumni...</p>
      ) : alumni.length === 0 ? (
        <p className="text-slate-500">
          No alumni accounts match these filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {alumni.map((a) => (
                <tr key={a._id}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {a.name}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {a.email}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {a.profile?.branch || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={a.verificationStatus} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* View */}
                      <Link
                        to={`/admin/alumni/${a._id}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                        title="View details"
                      >
                        <Eye size={16} />
                      </Link>

                      {/* Approve */}
                      {a.verificationStatus !== "approved" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(a._id)}
                          disabled={actioningId === a._id}
                          className="rounded p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                      )}

                      {/* Reject */}
                      {a.verificationStatus !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => handleReject(a._id)}
                          disabled={actioningId === a._id}
                          className="rounded p-1.5 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(a._id)}
                        disabled={actioningId === a._id}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold text-slate-800">
              Delete alumni account?
            </h2>

            <p className="mb-6 text-sm text-slate-500">
              This permanently deletes the account and its profile. This cannot
              be undone.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                disabled={actioningId === confirmDelete}
                className="bg-red-600 hover:bg-red-500"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


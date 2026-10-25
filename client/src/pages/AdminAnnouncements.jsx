import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../services/announcementService";
import { getErrorMessage } from "../utils/getErrorMessage";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import FormTextarea from "../components/FormTextarea";
import Button from "../components/Button";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { audience: "all", isPinned: false } });

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAnnouncements({ limit: 50 });
      setAnnouncements(data.announcements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onSubmit = async (formData) => {
    setError("");
    try {
      await createAnnouncement({ ...formData, isPinned: !!formData.isPinned });
      reset();
      setShowForm(false);
      await fetchAnnouncements();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Manage Announcements</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          <span className="inline-flex items-center gap-1.5">
            <Plus size={14} /> {showForm ? "Cancel" : "New Announcement"}
          </span>
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="bg-white border border-slate-200 rounded-lg p-5 mb-6"
        >
          <FormInput
            label="Title"
            error={errors.title}
            registration={register("title", { required: "Title is required" })}
          />
          <FormTextarea
            label="Content"
            error={errors.content}
            registration={register("content", { required: "Content is required" })}
          />
          <FormSelect label="Audience" registration={register("audience")}>
            <option value="all">Everyone</option>
            <option value="alumni">Alumni</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </FormSelect>
          <label className="flex items-center gap-2 text-sm text-slate-700 mb-4">
            <input type="checkbox" {...register("isPinned")} />
            Pin to the top
          </label>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Posting..." : "Post Announcement"}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : announcements.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a._id}
              className="bg-white border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{a.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">
                  {a.audience} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a._id)}
                disabled={deletingId === a._id}
                className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

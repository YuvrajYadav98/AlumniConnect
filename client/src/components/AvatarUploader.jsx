import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatar } from "../services/userService";
import { getErrorMessage } from "../utils/getErrorMessage";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Circular avatar with a camera button overlay. Handles the upload
 * itself (via userService.uploadAvatar) and reports the new URL back
 * to the parent via onUploaded, so the parent doesn't need to know
 * anything about Cloudinary or FormData.
 */
export default function AvatarUploader({ currentImage, name, onUploaded }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(currentImage || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be smaller than 5MB");
      return;
    }

    // Show an instant local preview while the upload happens
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const data = await uploadAvatar(file);
      setPreview(data.profileImage);
      onUploaded?.(data.profileImage);
    } catch (err) {
      setError(getErrorMessage(err));
      setPreview(currentImage || "");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center ring-4 ring-white shadow">
          {preview ? (
            <img loading="lazy" decoding="async" src={preview} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-slate-500">{initials}</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="animate-spin text-white" size={22} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 bg-slate-800 hover:bg-slate-700 text-white rounded-full p-2 shadow"
          aria-label="Change profile photo"
        >
          <Camera size={14} />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

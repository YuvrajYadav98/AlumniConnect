import { Loader2 } from "lucide-react";

/**
 * Suspense fallback for lazy-loaded routes. Shown briefly while a
 * page's JS chunk downloads - on a warm cache or fast connection this
 * usually flashes for well under 100ms.
 */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <Loader2 size={22} className="animate-spin" />
    </div>
  );
}

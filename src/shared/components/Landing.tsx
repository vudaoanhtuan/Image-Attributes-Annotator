import { useState } from "react";
import { pickAndOpenDataset } from "@/lib/openDataset";

export default function Landing({ version }: { version: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleOpen = async () => {
    setError(null);
    setBusy(true);
    try {
      await pickAndOpenDataset();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 border-t border-neutral-200">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          Image Attributes Annotator
        </h1>
        <p className="text-neutral-500 mt-1">v{version || "..."}</p>
      </div>
      <button
        onClick={handleOpen}
        disabled={busy}
        className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-medium text-white shadow"
      >
        {busy ? "Opening..." : "Open dataset"}
      </button>
      {error && (
        <p className="text-red-600 text-sm max-w-md text-center">{error}</p>
      )}
      <p className="text-xs text-neutral-500 max-w-md text-center">
        Select a folder containing <code>images/</code> and (optionally){" "}
        <code>labels/</code>.
      </p>
    </div>
  );
}

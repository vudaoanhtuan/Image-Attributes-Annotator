import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { useDatasetStore } from "@/store/datasetStore";

export default function Landing({ version }: { version: string }) {
  const openDataset = useDatasetStore((s) => s.open);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleOpen = async () => {
    setError(null);
    const selected = await open({ directory: true, multiple: false });
    if (!selected || typeof selected !== "string") return;
    setBusy(true);
    try {
      await openDataset(selected);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          BB Attribute Labeler
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

import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Landing from "@/shared/components/Landing";
import AnnotatorWorkspace from "@/features/annotator/AnnotatorWorkspace";
import CleanerWorkspace from "@/features/cleaner/CleanerWorkspace";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import {
  useOpenDatasetHotkey,
  useAttributeHotkeys,
  useViewModeHotkeys,
  useToggleLeftSidebarHotkey,
} from "@/lib/hotkeys";
import { installAppMenu } from "@/lib/menu";

export default function App() {
  const path = useDatasetStore((s) => s.path);
  const viewMode = useDatasetStore((s) => s.viewMode);
  const [version, setVersion] = useState("");

  useOpenDatasetHotkey();
  useAttributeHotkeys();
  useViewModeHotkeys();
  useToggleLeftSidebarHotkey();

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion("dev"));
    installAppMenu().catch((e) => console.error("menu install failed", e));
  }, []);

  useEffect(() => {
    const w = getCurrentWindow();
    const unlistenP = w.onCloseRequested(async (event) => {
      const { flush, boundImage } = useLabelStore.getState();
      if (!boundImage) return;
      event.preventDefault();
      await flush();
      await w.destroy();
    });
    return () => {
      unlistenP.then((un) => un()).catch(() => {});
    };
  }, []);

  if (!path) return <Landing version={version} />;
  return viewMode === "annotator" ? (
    <AnnotatorWorkspace />
  ) : (
    <CleanerWorkspace />
  );
}

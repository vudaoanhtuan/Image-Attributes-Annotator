import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Landing from "@/components/Landing";
import Workspace from "@/components/Workspace";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import { useOpenDatasetHotkey } from "@/lib/hotkeys";
import { installAppMenu } from "@/lib/menu";

export default function App() {
  const path = useDatasetStore((s) => s.path);
  const [version, setVersion] = useState("");

  useOpenDatasetHotkey();

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion("dev"));
    installAppMenu().catch((e) => console.error("menu install failed", e));
  }, []);

  useEffect(() => {
    const w = getCurrentWindow();
    const unlistenP = w.onCloseRequested(async (event) => {
      const { dirty, flush } = useLabelStore.getState();
      if (dirty) {
        event.preventDefault();
        await flush();
        await w.destroy();
      }
    });
    return () => {
      unlistenP.then((un) => un()).catch(() => {});
    };
  }, []);

  return path ? <Workspace version={version} /> : <Landing version={version} />;
}

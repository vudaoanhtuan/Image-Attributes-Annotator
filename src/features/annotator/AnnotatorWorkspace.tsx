import { useEffect, useRef } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import { useUiStore } from "@/store/uiStore";
import { useArrowHotkeys } from "@/lib/hotkeys";
import ImageList from "./ImageList";
import ImageFilters from "./ImageFilters";
import ImageViewer from "./ImageViewer";
import DirectionPicker from "./DirectionPicker";
import AttributePanel from "./AttributePanel";
import StatusBar from "./StatusBar";
import WorkspaceLayout from "@/shared/components/WorkspaceLayout";

export default function AnnotatorWorkspace() {
  const path = useDatasetStore((s) => s.path)!;
  const images = useDatasetStore((s) => s.images);
  const currentIndex = useDatasetStore((s) => s.currentIndex);
  const config = useDatasetStore((s) => s.config);
  const directionAttr = config?.attributes.find((a) => a.type === "direction");
  const loadFor = useLabelStore((s) => s.loadFor);
  const flush = useLabelStore((s) => s.flush);
  const leftSidebarVisible = useUiStore((s) => s.leftSidebarVisible);

  useArrowHotkeys();

  const prevImageRef = useRef<string | null>(null);

  useEffect(() => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;
    const prev = prevImageRef.current;
    (async () => {
      if (prev && prev !== currentImage) {
        await flush();
      }
      prevImageRef.current = currentImage;
      await loadFor(currentImage);
    })();
  }, [currentIndex, images, loadFor, flush]);

  const currentImage = images[currentIndex];

  return (
    <WorkspaceLayout className="border-t border-neutral-200">
      {leftSidebarVisible && (
        <WorkspaceLayout.LeftSideBar>
          <ImageFilters />
          <ImageList />
        </WorkspaceLayout.LeftSideBar>
      )}
      <WorkspaceLayout.Main>
        <div className="flex-1 flex items-center justify-center min-w-0 p-6">
          {currentImage ? (
            directionAttr && directionAttr.type === "direction" ? (
              <DirectionPicker
                datasetPath={path}
                imageName={currentImage}
                attrKey={directionAttr.key}
                count={directionAttr.count}
                startDeg={directionAttr.startDeg}
              />
            ) : (
              <ImageViewer datasetPath={path} imageName={currentImage} />
            )
          ) : (
            <div className="text-neutral-500">No images in dataset.</div>
          )}
        </div>
      </WorkspaceLayout.Main>
      <WorkspaceLayout.RightSideBar>
        <AttributePanel />
      </WorkspaceLayout.RightSideBar>
      <WorkspaceLayout.StatusBar>
        <StatusBar />
      </WorkspaceLayout.StatusBar>
    </WorkspaceLayout>
  );
}

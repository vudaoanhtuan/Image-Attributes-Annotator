import { useEffect, useRef } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import { useArrowHotkeys } from "@/lib/hotkeys";
import ImageList from "./ImageList";
import ImageViewer from "./ImageViewer";
import DirectionPicker from "./DirectionPicker";
import AttributePanel from "./AttributePanel";
import StatusBar from "./StatusBar";

export default function Workspace({ version: _version }: { version: string }) {
  const path = useDatasetStore((s) => s.path)!;
  const images = useDatasetStore((s) => s.images);
  const currentIndex = useDatasetStore((s) => s.currentIndex);
  const closeDataset = useDatasetStore((s) => s.close);
  const config = useDatasetStore((s) => s.config);
  const directionAttr = config?.attributes.find((a) => a.type === "direction");
  const loadFor = useLabelStore((s) => s.loadFor);
  const flush = useLabelStore((s) => s.flush);

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

  const handleClose = async () => {
    await flush();
    useLabelStore.setState({
      draft: {},
      dirty: false,
      status: "idle",
      boundImage: null,
    });
    prevImageRef.current = null;
    closeDataset();
  };

  const currentImage = images[currentIndex];

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 flex min-h-0">
        <ImageList />
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
        <AttributePanel />
      </div>
      <StatusBar onClose={handleClose} />
    </div>
  );
}

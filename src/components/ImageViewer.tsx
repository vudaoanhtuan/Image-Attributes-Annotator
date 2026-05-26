import { imageUrl } from "@/lib/tauri";
import { useDatasetStore } from "@/store/datasetStore";

export default function ImageViewer({
  datasetPath,
  imageName,
}: {
  datasetPath: string;
  imageName: string;
}) {
  const setImageSize = useDatasetStore((s) => s.setImageSize);
  return (
    <img
      key={imageName}
      src={imageUrl(datasetPath, imageName)}
      alt={imageName}
      className="w-[400px] h-[400px] object-contain"
      draggable={false}
      onLoad={(e) =>
        setImageSize({
          width: e.currentTarget.naturalWidth,
          height: e.currentTarget.naturalHeight,
        })
      }
    />
  );
}

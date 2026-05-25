import { imageUrl } from "@/lib/tauri";

export default function ImageViewer({
  datasetPath,
  imageName,
}: {
  datasetPath: string;
  imageName: string;
}) {
  return (
    <img
      src={imageUrl(datasetPath, imageName)}
      alt={imageName}
      className="w-[400px] h-[400px] object-contain"
      draggable={false}
    />
  );
}

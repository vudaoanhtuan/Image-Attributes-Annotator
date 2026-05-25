import { FixedSizeList as List } from "react-window";
import { useEffect, useRef } from "react";
import { useDatasetStore } from "@/store/datasetStore";

const ROW_HEIGHT = 32;

function stem(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

export default function ImageList() {
  const images = useDatasetStore((s) => s.images);
  const currentIndex = useDatasetStore((s) => s.currentIndex);
  const setIndex = useDatasetStore((s) => s.setIndex);
  const labeledSet = useDatasetStore((s) => s.labeledSet);
  const listRef = useRef<List>(null);

  useEffect(() => {
    listRef.current?.scrollToItem(currentIndex, "smart");
  }, [currentIndex]);

  return (
    <div className="h-full w-64 border-r border-neutral-200 bg-white flex flex-col">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Images ({images.length})
      </div>
      <div className="flex-1">
        <List
          ref={listRef}
          height={window.innerHeight - 80}
          width={256}
          itemCount={images.length}
          itemSize={ROW_HEIGHT}
        >
          {({ index, style }) => {
            const name = images[index];
            const isCurrent = index === currentIndex;
            const isLabeled = labeledSet.has(stem(name));
            return (
              <div
                style={style}
                onClick={() => setIndex(index)}
                className={`flex items-center gap-2 px-3 cursor-pointer text-sm truncate ${
                  isCurrent
                    ? "bg-blue-100 text-blue-900"
                    : "hover:bg-neutral-100 text-neutral-800"
                }`}
                title={name}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                    isLabeled ? "bg-transparent" : "bg-amber-500"
                  }`}
                />
                <span className="truncate">{name}</span>
              </div>
            );
          }}
        </List>
      </div>
    </div>
  );
}

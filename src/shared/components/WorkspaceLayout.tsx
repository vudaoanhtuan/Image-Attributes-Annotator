import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

type SlotKey = "left" | "right" | "main" | "bottom" | "status";

type SideProps = {
  children: ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
};

type SlotProps = SideProps | { children: ReactNode };

type SlotComponent = ((props: SlotProps) => null) & { __slot: SlotKey };

function makeSlot(key: SlotKey, displayName: string): SlotComponent {
  const Slot = (_props: SlotProps) => null;
  Slot.displayName = displayName;
  const tagged = Slot as unknown as SlotComponent;
  tagged.__slot = key;
  return tagged;
}

const LeftSideBar = makeSlot("left", "WorkspaceLayout.LeftSideBar");
const RightSideBar = makeSlot("right", "WorkspaceLayout.RightSideBar");
const Main = makeSlot("main", "WorkspaceLayout.Main");
const BottomSideBar = makeSlot("bottom", "WorkspaceLayout.BottomSideBar");
const StatusBar = makeSlot("status", "WorkspaceLayout.StatusBar");

type SlotElement = ReactElement<SideProps> & { type: SlotComponent };

function pickSlots(children: ReactNode) {
  const slots: Partial<Record<SlotKey, SlotElement>> = {};
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = (child as ReactElement).type as Partial<SlotComponent>;
    const key = type?.__slot;
    if (!key) return;
    slots[key] = child as SlotElement;
  });
  return slots;
}

function usePersistentSize(storageKey: string | undefined, fallback: number) {
  const [size, setSize] = useState<number>(() => {
    if (typeof window === "undefined" || !storageKey) return fallback;
    const raw = window.localStorage.getItem(storageKey);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  });
  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, String(size));
  }, [storageKey, size]);
  return [size, setSize] as const;
}

type DragAxis = "x" | "y";

function useDragResize(
  axis: DragAxis,
  direction: 1 | -1,
  getSize: () => number,
  setSize: (n: number) => void,
  clamp: (n: number) => number,
) {
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startPos = axis === "x" ? e.clientX : e.clientY;
    const startSize = getSize();
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const pos = axis === "x" ? ev.clientX : ev.clientY;
      const delta = (pos - startPos) * direction;
      setSize(clamp(startSize + delta));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return onMouseDown;
}

const HANDLE_V = "w-1 cursor-col-resize bg-transparent hover:bg-blue-400/40 active:bg-blue-500/60 transition-colors shrink-0";
const HANDLE_H = "h-1 cursor-row-resize bg-transparent hover:bg-blue-400/40 active:bg-blue-500/60 transition-colors shrink-0";

type Props = {
  children: ReactNode;
  className?: string;
  storageKey?: string;
};

function WorkspaceLayout({ children, className, storageKey = "workspace-layout" }: Props) {
  const slots = pickSlots(children);

  const leftCfg = slots.left?.props ?? { children: null };
  const rightCfg = slots.right?.props ?? { children: null };
  const bottomCfg = slots.bottom?.props ?? { children: null };

  const leftMin = (leftCfg as SideProps).minSize ?? 160;
  const leftMax = (leftCfg as SideProps).maxSize ?? 600;
  const rightMin = (rightCfg as SideProps).minSize ?? 200;
  const rightMax = (rightCfg as SideProps).maxSize ?? 700;
  const bottomMin = (bottomCfg as SideProps).minSize ?? 80;
  const bottomMax = (bottomCfg as SideProps).maxSize ?? 600;

  const [leftWidth, setLeftWidth] = usePersistentSize(
    storageKey ? `${storageKey}:left` : undefined,
    (leftCfg as SideProps).defaultSize ?? 256,
  );
  const [rightWidth, setRightWidth] = usePersistentSize(
    storageKey ? `${storageKey}:right` : undefined,
    (rightCfg as SideProps).defaultSize ?? 320,
  );
  const [bottomHeight, setBottomHeight] = usePersistentSize(
    storageKey ? `${storageKey}:bottom` : undefined,
    (bottomCfg as SideProps).defaultSize ?? 200,
  );

  const leftRef = useRef(leftWidth);
  const rightRef = useRef(rightWidth);
  const bottomRef = useRef(bottomHeight);
  leftRef.current = leftWidth;
  rightRef.current = rightWidth;
  bottomRef.current = bottomHeight;

  const onDragLeft = useDragResize(
    "x",
    1,
    () => leftRef.current,
    setLeftWidth,
    (n) => Math.max(leftMin, Math.min(leftMax, n)),
  );
  const onDragRight = useDragResize(
    "x",
    -1,
    () => rightRef.current,
    setRightWidth,
    (n) => Math.max(rightMin, Math.min(rightMax, n)),
  );
  const onDragBottom = useDragResize(
    "y",
    -1,
    () => bottomRef.current,
    setBottomHeight,
    (n) => Math.max(bottomMin, Math.min(bottomMax, n)),
  );

  return (
    <div className={`h-full w-full flex flex-col ${className ?? ""}`}>
      <div className="flex-1 flex min-h-0">
        {slots.left && (
          <>
            <div
              style={{ width: leftWidth }}
              className="shrink-0 h-full min-w-0 flex flex-col"
            >
              {slots.left.props.children}
            </div>
            <div className={HANDLE_V} onMouseDown={onDragLeft} />
          </>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 min-w-0 flex">{slots.main?.props.children}</div>
            {slots.right && (
              <>
                <div className={HANDLE_V} onMouseDown={onDragRight} />
                <div
                  style={{ width: rightWidth }}
                  className="shrink-0 h-full min-w-0 flex flex-col"
                >
                  {slots.right.props.children}
                </div>
              </>
            )}
          </div>
          {slots.bottom && (
            <>
              <div className={HANDLE_H} onMouseDown={onDragBottom} />
              <div style={{ height: bottomHeight }} className="shrink-0 w-full min-h-0">
                {slots.bottom.props.children}
              </div>
            </>
          )}
        </div>
      </div>
      {slots.status?.props.children}
    </div>
  );
}

WorkspaceLayout.LeftSideBar = LeftSideBar;
WorkspaceLayout.RightSideBar = RightSideBar;
WorkspaceLayout.Main = Main;
WorkspaceLayout.BottomSideBar = BottomSideBar;
WorkspaceLayout.StatusBar = StatusBar;

export default WorkspaceLayout;

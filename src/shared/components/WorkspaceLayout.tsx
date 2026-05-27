import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

type SlotProps = { children: ReactNode };
type SlotComponent = ((props: SlotProps) => null) & { __slot: SlotKey };

type SlotKey = "left" | "right" | "main" | "bottom" | "status";

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

type Props = { children: ReactNode; className?: string };

function pickSlots(children: ReactNode) {
  const slots: Partial<Record<SlotKey, ReactNode>> = {};
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = (child as ReactElement).type as Partial<SlotComponent>;
    const key = type?.__slot;
    if (!key) return;
    slots[key] = (child.props as SlotProps).children;
  });
  return slots;
}

function WorkspaceLayout({ children, className }: Props) {
  const slots = pickSlots(children);
  return (
    <div className={`h-full w-full flex flex-col ${className ?? ""}`}>
      <div className="flex-1 flex min-h-0">
        {slots.left}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 min-w-0 flex">{slots.main}</div>
            {slots.right}
          </div>
          {slots.bottom}
        </div>
      </div>
      {slots.status}
    </div>
  );
}

WorkspaceLayout.LeftSideBar = LeftSideBar;
WorkspaceLayout.RightSideBar = RightSideBar;
WorkspaceLayout.Main = Main;
WorkspaceLayout.BottomSideBar = BottomSideBar;
WorkspaceLayout.StatusBar = StatusBar;

export default WorkspaceLayout;

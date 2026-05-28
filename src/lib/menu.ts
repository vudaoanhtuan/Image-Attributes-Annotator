import { Menu, Submenu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { CheckMenuItem } from "@tauri-apps/api/menu/checkMenuItem";
import { pickAndOpenDataset } from "./openDataset";
import { closeDataset } from "./closeDataset";
import { switchViewMode } from "./switchViewMode";
import { useLabelStore } from "@/store/labelStore";
import { useUiStore } from "@/store/uiStore";

export async function installAppMenu() {
  const openItem = await MenuItem.new({
    id: "open-dataset",
    text: "Open Dataset",
    accelerator: "CmdOrCtrl+O",
    action: () => {
      void pickAndOpenDataset();
    },
  });

  const saveItem = await MenuItem.new({
    id: "save",
    text: "Save",
    accelerator: "CmdOrCtrl+S",
    action: () => {
      void useLabelStore.getState().flush();
    },
  });

  const closeItem = await MenuItem.new({
    id: "close-dataset",
    text: "Close Dataset",
    accelerator: "CmdOrCtrl+W",
    action: () => {
      void closeDataset();
    },
  });

  const appQuit = await PredefinedMenuItem.new({ item: "Quit" });

  const appMenu = await Submenu.new({
    text: "Image Attributes Annotator",
    items: [appQuit],
  });

  const fileMenu = await Submenu.new({
    text: "File",
    items: [openItem, saveItem, closeItem],
  });

  const annotateItem = await MenuItem.new({
    id: "view-annotate",
    text: "Annotate",
    accelerator: "CmdOrCtrl+1",
    action: () => {
      void switchViewMode("annotator");
    },
  });

  const cleanItem = await MenuItem.new({
    id: "view-clean",
    text: "Clean",
    accelerator: "CmdOrCtrl+2",
    action: () => {
      void switchViewMode("cleaner");
    },
  });

  const viewSep = await PredefinedMenuItem.new({ item: "Separator" });

  const toggleLeftSidebarItem = await CheckMenuItem.new({
    id: "view-toggle-left-sidebar",
    text: "Show Left Sidebar",
    accelerator: "CmdOrCtrl+L",
    checked: useUiStore.getState().leftSidebarVisible,
    action: () => {
      useUiStore.getState().toggleLeftSidebar();
    },
  });

  useUiStore.subscribe((state, prev) => {
    if (state.leftSidebarVisible !== prev.leftSidebarVisible) {
      void toggleLeftSidebarItem.setChecked(state.leftSidebarVisible);
    }
  });

  const viewMenu = await Submenu.new({
    text: "View",
    items: [annotateItem, cleanItem, viewSep, toggleLeftSidebarItem],
  });

  const undo = await PredefinedMenuItem.new({ item: "Undo" });
  const redo = await PredefinedMenuItem.new({ item: "Redo" });
  const editSep = await PredefinedMenuItem.new({ item: "Separator" });
  const cut = await PredefinedMenuItem.new({ item: "Cut" });
  const copy = await PredefinedMenuItem.new({ item: "Copy" });
  const paste = await PredefinedMenuItem.new({ item: "Paste" });
  const selectAll = await PredefinedMenuItem.new({ item: "SelectAll" });

  const editMenu = await Submenu.new({
    text: "Edit",
    items: [undo, redo, editSep, cut, copy, paste, selectAll],
  });

  const menu = await Menu.new({ items: [appMenu, fileMenu, editMenu, viewMenu] });
  await menu.setAsAppMenu();
}

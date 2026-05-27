import { Menu, Submenu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { pickAndOpenDataset } from "./openDataset";
import { closeDataset } from "./closeDataset";
import { switchViewMode } from "./switchViewMode";
import { useLabelStore } from "@/store/labelStore";

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

  const sep = await PredefinedMenuItem.new({ item: "Separator" });
  const quit = await PredefinedMenuItem.new({ item: "Quit" });

  const fileMenu = await Submenu.new({
    text: "File",
    items: [openItem, saveItem, closeItem, sep, quit],
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

  const viewMenu = await Submenu.new({
    text: "View",
    items: [annotateItem, cleanItem],
  });

  const menu = await Menu.new({ items: [fileMenu, viewMenu] });
  await menu.setAsAppMenu();
}

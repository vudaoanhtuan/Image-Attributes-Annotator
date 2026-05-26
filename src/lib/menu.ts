import { Menu, Submenu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { pickAndOpenDataset } from "./openDataset";
import { closeDataset } from "./closeDataset";
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

  const menu = await Menu.new({ items: [fileMenu] });
  await menu.setAsAppMenu();
}

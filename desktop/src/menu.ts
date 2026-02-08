import { Menu } from "@tauri-apps/api/menu/menu";
import { MenuItem } from "@tauri-apps/api/menu/menuItem";
import { PredefinedMenuItem } from "@tauri-apps/api/menu/predefinedMenuItem";
import { CheckMenuItem } from "@tauri-apps/api/menu/checkMenuItem";
import { Submenu } from "@tauri-apps/api/menu/submenu";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import { message } from "@tauri-apps/plugin-dialog";

const CURRENT_VERSION = "0.1.2";
const LANDING_PAGE = "https://zeroshotlog.github.io/portman/";
const GITHUB_API = "https://api.github.com/repos/zeroshotlog/portman/releases/latest";

async function checkForUpdates() {
  try {
    const response = await fetch(GITHUB_API);
    if (!response.ok) throw new Error("Failed to fetch");

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, "");

    if (latestVersion !== CURRENT_VERSION) {
      const shouldOpen = await invoke<boolean>("show_update_dialog", {
        latestVersion,
        currentVersion: CURRENT_VERSION,
      });
      if (shouldOpen) {
        open(LANDING_PAGE);
      }
    } else {
      await invoke("show_up_to_date_dialog", { currentVersion: CURRENT_VERSION });
    }
  } catch {
    await message("Failed to check for updates. Please try again later.", { title: "Error", kind: "error" });
  }
}

let lightCheck: CheckMenuItem;
let darkCheck: CheckMenuItem;
let autoCheck: CheckMenuItem;

function dispatch(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export async function setupMenu() {
  // === Custom menu items ===
  const settingsItem = await MenuItem.new({
    text: "Settings\u2026",
    id: "settings",
    accelerator: "CmdOrCtrl+,",
    action: () => dispatch("portman:open-settings"),
  });

  const findItem = await MenuItem.new({
    text: "Find\u2026",
    id: "find",
    accelerator: "CmdOrCtrl+F",
    action: () => dispatch("portman:focus-search"),
  });

  const refreshItem = await MenuItem.new({
    text: "Refresh",
    id: "refresh",
    accelerator: "CmdOrCtrl+R",
    action: () => dispatch("portman:refresh"),
  });

  const listViewItem = await MenuItem.new({
    text: "as List",
    id: "view-list",
    accelerator: "CmdOrCtrl+1",
    action: () => dispatch("portman:set-view", "list"),
  });

  const gridViewItem = await MenuItem.new({
    text: "as Grid",
    id: "view-grid",
    accelerator: "CmdOrCtrl+2",
    action: () => dispatch("portman:set-view", "grid"),
  });

  const helpItem = await MenuItem.new({
    text: "Portman Help",
    id: "help",
    action: () => open("https://zeroshotlog.github.io/portman/docs/guide/getting-started.html"),
  });

  // === Appearance check items ===
  lightCheck = await CheckMenuItem.new({
    text: "Light",
    id: "appearance-light",
    checked: false,
    action: () => dispatch("portman:set-theme", "light"),
  });

  darkCheck = await CheckMenuItem.new({
    text: "Dark",
    id: "appearance-dark",
    checked: false,
    action: () => dispatch("portman:set-theme", "dark"),
  });

  autoCheck = await CheckMenuItem.new({
    text: "System",
    id: "appearance-auto",
    checked: true,
    action: () => dispatch("portman:set-theme", "auto"),
  });

  const appearanceSubmenu = await Submenu.new({
    text: "Appearance",
    items: [lightCheck, darkCheck, autoCheck],
  });

  // === About (via Rust command for proper icon support) ===
  const about = await MenuItem.new({
    text: "About Portman",
    id: "about",
    action: () => invoke("show_about"),
  });

  const checkUpdatesItem = await MenuItem.new({
    text: "Check for Updates\u2026",
    id: "check-updates",
    action: checkForUpdates,
  });

  const sep = () => PredefinedMenuItem.new({ item: "Separator" });

  // === App menu ===
  const appMenu = await Submenu.new({
    text: "Portman",
    items: [
      about,
      checkUpdatesItem,
      await sep(),
      settingsItem,
      await sep(),
      await PredefinedMenuItem.new({ item: "Services" }),
      await sep(),
      await PredefinedMenuItem.new({ text: "Hide Portman", item: "Hide" }),
      await PredefinedMenuItem.new({ item: "HideOthers" }),
      await PredefinedMenuItem.new({ item: "ShowAll" }),
      await sep(),
      await PredefinedMenuItem.new({ text: "Quit Portman", item: "Quit" }),
    ],
  });

  // === Edit menu ===
  const editMenu = await Submenu.new({
    text: "Edit",
    items: [
      await PredefinedMenuItem.new({ item: "Undo" }),
      await PredefinedMenuItem.new({ item: "Redo" }),
      await sep(),
      await PredefinedMenuItem.new({ item: "Cut" }),
      await PredefinedMenuItem.new({ item: "Copy" }),
      await PredefinedMenuItem.new({ item: "Paste" }),
      await PredefinedMenuItem.new({ item: "SelectAll" }),
      await sep(),
      findItem,
    ],
  });

  // === View menu ===
  const viewMenu = await Submenu.new({
    text: "View",
    items: [
      refreshItem,
      await sep(),
      listViewItem,
      gridViewItem,
      await sep(),
      appearanceSubmenu,
      await sep(),
      await PredefinedMenuItem.new({ item: "Fullscreen" }),
    ],
  });

  // === Window menu ===
  const windowMenu = await Submenu.new({
    text: "Window",
    items: [
      await PredefinedMenuItem.new({ item: "Minimize" }),
      await PredefinedMenuItem.new({ item: "Maximize" }),
      await sep(),
      await PredefinedMenuItem.new({ item: "CloseWindow" }),
    ],
  });
  await windowMenu.setAsWindowsMenuForNSApp();

  // === Help menu ===
  const helpMenu = await Submenu.new({
    text: "Help",
    items: [helpItem],
  });
  await helpMenu.setAsHelpMenuForNSApp();

  // === Build and set ===
  const menu = await Menu.new({
    items: [appMenu, editMenu, viewMenu, windowMenu, helpMenu],
  });
  await menu.setAsAppMenu();

  // === Sync appearance checks with theme ===
  syncThemeChecks();
  window.addEventListener("portman:theme-changed", ((e: CustomEvent) => {
    syncThemeChecksFor(e.detail);
  }) as EventListener);
}

function syncThemeChecks() {
  const stored = localStorage.getItem("portman-theme") || "auto";
  syncThemeChecksFor(stored);
}

function syncThemeChecksFor(pref: string) {
  lightCheck?.setChecked(pref === "light");
  darkCheck?.setChecked(pref === "dark");
  autoCheck?.setChecked(pref === "auto");
}

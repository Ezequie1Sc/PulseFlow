import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  systemPreferences,
} from "electron";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Capture } from "./capture.ts";
import type { Setup } from "./model.ts";
const file = path.join(__dirname, "index.html"),
  url = pathToFileURL(file).href;
if (existsSync(".env")) process.loadEnvFile(".env");
const key = process.env.SMARTSPECTRA_API_KEY?.trim() || "";
delete process.env.SMARTSPECTRA_API_KEY;
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1250,
    height: 880,
    minWidth: 680,
    minHeight: 540,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: false,
    },
  });
  win.removeMenu();
  let capture: Capture | undefined,
    closing = false;
  let native: typeof import("./capture.ts") | undefined;
  try {
    native = require("./native.cjs");
    capture = new native!.Capture((event) => {
      if (!closing && !win.isDestroyed())
        win.webContents.send("pulse:event", event);
    });
  } catch {
    /* Configuration screen remains usable when the runtime cannot load. */
  }
  const trusted = (e: Electron.IpcMainInvokeEvent) =>
    e.sender === win.webContents &&
    e.senderFrame === win.webContents.mainFrame &&
    e.senderFrame.url === url;
  function handle(name: string, fn: (...args: unknown[]) => unknown) {
    ipcMain.handle("pulse:" + name, (e, ...args) => {
      if (!trusted(e) || closing) throw Error("Window unavailable.");
      return fn(...args);
    });
  }
  handle("setup", (): Setup => {
    let devices: Setup["cameras"] = [],
      issue = "";
    try {
      devices = native?.cameras() ?? [];
    } catch {
      issue = "Camera discovery failed. Check Windows camera access.";
    }
    if (!capture)
      issue = "SDK unavailable. Reinstall dependencies using Node x64.";
    else if (!key)
      issue = "API key missing. Set SMARTSPECTRA_API_KEY and restart.";
    else if (
      process.platform === "win32" &&
      systemPreferences.getMediaAccessStatus("camera") === "denied"
    )
      issue =
        "Camera permission denied. Enable desktop camera access in Windows Settings, then refresh.";
    else if (!devices.length && !issue)
      issue = "No camera detected. Connect a camera and refresh.";
    return { configured: !!capture && !!key, cameras: devices, issue };
  });
  handle("start", (id, consent) => {
    if (
      typeof id !== "string" ||
      id.length > 4096 ||
      consent !== true ||
      !key ||
      !capture
    )
      throw Error("Check the camera, API key and consent before starting.");
    return capture.start(id, key);
  });
  handle("stop", () => capture?.stop());
  session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.on("did-start-navigation", (details) => {
    if (details.isMainFrame && !details.isSameDocument)
      void capture?.stop().catch(() => win.close());
  });
  win.webContents.on("render-process-gone", () => win.close());
  win.on("close", (e) => {
    e.preventDefault();
    if (closing) return;
    closing = true;
    Promise.resolve(capture?.stop())
      .catch(() => {})
      .finally(() => win.destroy());
  });
  void win.loadFile(file);
});
app.on("window-all-closed", () => app.quit());

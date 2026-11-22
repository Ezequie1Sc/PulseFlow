import { contextBridge, ipcRenderer } from "electron";
import type { Bridge } from "./model.ts";
const bridge: Bridge = {
  setup: () => ipcRenderer.invoke("pulse:setup"),
  start: (id, consent) => ipcRenderer.invoke("pulse:start", id, consent),
  stop: () => ipcRenderer.invoke("pulse:stop"),
  listen: (fn) => ipcRenderer.on("pulse:event", (_e, event) => fn(event)),
};
contextBridge.exposeInMainWorld("pulse", bridge);

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { build } from "esbuild";
import { createRequire } from "node:module";
const actual = createRequire(import.meta.url);
test("desktop enforces isolation, local sender, explicit consent and a narrow preload", async () => {
  const bundle = (
    await build({
      entryPoints: ["src/main.ts"],
      platform: "node",
      format: "cjs",
      packages: "external",
      bundle: true,
      write: false,
    })
  ).outputFiles[0].text;
  const handlers = {},
    frame = { url: "file:///test/index.html" };
  const wc = {
    mainFrame: frame,
    on() {},
    setWindowOpenHandler(fn) {
      assert.deepEqual(fn().action, "deny");
    },
  };
  let options, started;
  class BrowserWindow {
    constructor(o) {
      options = o;
      this.webContents = wc;
    }
    on() {}
    removeMenu() {}
    loadFile() {}
  }
  const electron = {
    app: { whenReady: () => Promise.resolve(), on() {} },
    BrowserWindow,
    ipcMain: { handle: (k, f) => (handlers[k] = f) },
    session: {
      defaultSession: {
        setPermissionRequestHandler() {},
        setPermissionCheckHandler() {},
      },
    },
  };
  const native = {
    Capture: class {
      start(id) {
        started = id;
      }
    },
    cameras: () => [{ id: "selected", name: "Test" }],
  };
  const proc = {
    env: { SMARTSPECTRA_API_KEY: "unit-test-only" },
    platform: "linux",
  };
  vm.runInNewContext(bundle, {
    __dirname: "/test",
    process: proc,
    require: (k) =>
      k === "electron"
        ? electron
        : k === "./native.cjs"
          ? native
          : k === "node:fs"
            ? { existsSync: () => false }
            : actual(k),
  });
  await Promise.resolve();
  assert.equal(options.webPreferences.contextIsolation, true);
  assert.equal(options.webPreferences.sandbox, true);
  assert.equal(options.webPreferences.nodeIntegration, false);
  assert.equal(proc.env.SMARTSPECTRA_API_KEY, undefined);
  const sender = { sender: wc, senderFrame: frame },
    start = handlers["pulse:start"];
  assert.throws(() =>
    start(
      { sender: wc, senderFrame: { url: "https://invalid.example" } },
      "selected",
      true,
    ),
  );
  assert.throws(() => start(sender, "selected", false));
  assert.throws(() => start(sender, {}, true));
  start(sender, "selected", true);
  assert.equal(started, "selected");
  const result = handlers["pulse:setup"](sender);
  assert.equal(result.configured, true);
  assert(!JSON.stringify(result).includes("unit-test-only"));
});


import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { createRequire } from "node:module";

const actual = createRequire(import.meta.url);

test(
  "desktop enforces isolation, local sender, explicit consent and a narrow preload",
  async () => {
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

    const handlers = {};

    // Utilizar la misma URL local que genera main.ts.
    const frame = {
      url: pathToFileURL(
        path.join("/test", "index.html"),
      ).href,
    };

    const wc = {
      mainFrame: frame,

      on() {},

      setWindowOpenHandler(fn) {
        assert.deepEqual(fn().action, "deny");
      },
    };

    let options;
    let started;

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
      app: {
        whenReady: () => Promise.resolve(),
        on() {},
      },

      BrowserWindow,

      ipcMain: {
        handle: (key, fn) => {
          handlers[key] = fn;
        },
      },

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

      cameras: () => [
        {
          id: "selected",
          name: "Test",
        },
      ],
    };

    const proc = {
      env: {
        SMARTSPECTRA_API_KEY: "unit-test-only",
      },

      platform: "linux",
    };

    vm.runInNewContext(bundle, {
      __dirname: "/test",

      process: proc,

      require: (name) =>
        name === "electron"
          ? electron
          : name === "./native.cjs"
            ? native
            : name === "node:fs"
              ? { existsSync: () => false }
              : actual(name),
    });

    await Promise.resolve();

    // Comprobar configuración segura de Electron.
    assert.equal(
      options.webPreferences.contextIsolation,
      true,
    );

    assert.equal(
      options.webPreferences.sandbox,
      true,
    );

    assert.equal(
      options.webPreferences.nodeIntegration,
      false,
    );

    // La API key no debe permanecer expuesta
    // en las variables de entorno del proceso.
    assert.equal(
      proc.env.SMARTSPECTRA_API_KEY,
      undefined,
    );

    const sender = {
      sender: wc,
      senderFrame: frame,
    };

    const start = handlers["pulse:start"];

    // Rechazar mensajes procedentes de otra URL.
    assert.throws(() =>
      start(
        {
          sender: wc,
          senderFrame: {
            url: "https://invalid.example",
          },
        },
        "selected",
        true,
      ),
    );

    // Rechazar inicio sin consentimiento explícito.
    assert.throws(() =>
      start(sender, "selected", false),
    );

    // Rechazar identificadores de cámara inválidos.
    assert.throws(() =>
      start(sender, {}, true),
    );

    // Aceptar inicio desde la ventana autorizada.
    start(sender, "selected", true);

    assert.equal(started, "selected");

    // El estado de configuración no debe
    // revelar la API key.
    const result = handlers["pulse:setup"](sender);

    assert.equal(result.configured, true);

    assert(
      !JSON.stringify(result).includes("unit-test-only"),
    );
  },
);

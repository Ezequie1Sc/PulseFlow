import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { Window } from "happy-dom";
const html = await readFile("ui/index.html", "utf8");
const js = (
  await build({ entryPoints: ["ui/app.ts"], bundle: true, write: false })
).outputFiles[0].text;
test("consent, empty readings, exercise controls, summary and erasure", async () => {
  const w = new Window({
    settings: {
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  });
  try {
    w.document.body.innerHTML = html.slice(
      html.indexOf("<body>") + 6,
      html.indexOf("</body>"),
    );
    w.ResizeObserver = class {
      observe() {}
    };
    w.Option = function (name, value) {
      const option = w.document.createElement("option");
      option.textContent = name;
      option.value = value;
      return option;
    };
    w.HTMLElement.prototype.scrollIntoView = () => {};
    let starts = 0,
      stops = 0,
      receive;
    w.pulse = {
      setup: async () => ({
        configured: true,
        cameras: [{ id: "test", name: "Test device" }],
        issue: "",
      }),
      start: async (id, consent) => {
        assert.equal(id, "test");
        assert.equal(consent, true);
        starts++;
      },
      stop: async () => {
        stops++;
      },
      listen: (fn) => {
        receive = fn;
      },
    };
    w.eval(js);
    const tick = () => new Promise((r) => setTimeout(r, 0)),
      el = (id) => w.document.getElementById(id);
    await tick();
    el("enter").click();
    assert.equal(el("dashboard").hidden, false);
    assert.equal(starts, 0);
    el("enter").click();
    el("cancel").click();
    assert.equal(starts, 0);
    el("enter").click();
    el("allow").click();
    await tick();
    assert.equal(
      starts,
      1,
      el("issue").textContent +
        " device=" +
        el("devices").value +
        " " +
        el("sdk").textContent,
    );
    receive({ kind: "samples", values: [], missing: [] });
    assert.equal(el("pulseValue").textContent, "—");
    el("exerciseStart").click();
    assert.equal(el("phase").textContent, "Inhale");
    el("exerciseStart").click();
    assert.equal(el("phase").textContent, "Paused");
    el("exerciseStart").click();
    el("end").click();
    assert.equal(el("summary").hidden, false);
    assert.match(el("stats").textContent, /Not available/);
    receive({ kind: "error", message: "Camera disconnected." });
    assert.match(el("issue").textContent, /disconnected/);
    assert.equal(el("cam").textContent, "Camera off");
    el("privacy").click();
    el("erase").click();
    await tick();
    assert.equal(stops, 1);
    assert(el("summary").hidden);
  } finally {
    await w.happyDOM.abort();
    await w.close();
  }
});

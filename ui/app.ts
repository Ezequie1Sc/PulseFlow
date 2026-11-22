import { Session } from "./session.ts";
import { Chart } from "./chart.ts";
import { notifier } from "./toasts.ts";
import type { CaptureEvent, Channel } from "../src/model.ts";
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const button = (id: string) => el<HTMLButtonElement>(id);
const channels: Channel[] = ["pulse", "breath"];
const charts = {
  pulse: new Chart(el("pulseChart")),
  breath: new Chart(el("breathChart")),
};
const last = { pulse: 0, breath: 0 };
const notify = notifier(el("toasts")),
  dialog = el<HTMLDialogElement>("dialog"),
  devices = el<HTMLSelectElement>("devices");
let session = new Session(),
  dashboard = false,
  active = false,
  busy = false,
  available = false,
  signalSeen = false,
  consent = false;
let hint = "",
  issue = "",
  frame = 0,
  latestFrame = 0;
function controls() {
  button("enter").textContent = dashboard
    ? busy
      ? "Please wait…"
      : active
        ? "Stop monitoring"
        : "Start monitoring"
    : "Get Started";
  button("enter").disabled = dashboard && (busy || (!active && !available));
  devices.disabled = active || busy;
  button("refresh").disabled = active || busy;
  el("cam").textContent = busy
    ? "Camera pending"
    : active
      ? "Camera on"
      : "Camera off";
  el("issue").textContent = issue;
  el("initial").textContent =
    issue || "SDK configured. Camera access requires consent.";
}
async function setup() {
  try {
    const result = await window.pulse.setup();
    issue = result.issue;
    available = result.configured && result.cameras.length > 0 && !result.issue;
    el("sdk").textContent = result.configured
      ? "SDK configured"
      : "Setup required";
    const old = devices.value;
    devices.replaceChildren();
    result.cameras.forEach((d) => devices.add(new Option(d.name, d.id)));
    if (result.cameras.length)
      devices.value = result.cameras.some((c) => c.id === old)
        ? old
        : result.cameras[0].id;
    if (!devices.length) devices.add(new Option("No camera detected", ""));
  } catch {
    issue = "Desktop connection unavailable. Restart PulseFlow.";
    available = false;
    el("sdk").textContent = "SDK unavailable";
  }
  controls();
}
function clearLive() {
  for (const c of channels) {
    last[c] = 0;
    el(c + "Value").textContent = "—";
  }
}
function stopped() {
  active = false;
  clearLive();
  signalSeen = false;
  hint = "";
  el("signal").textContent = "Waiting for signal";
  const c = el<HTMLCanvasElement>("preview");
  c.width = 1;
  c.hidden = true;
  el("previewHint").hidden = false;
  el("previewHint").textContent = "Camera off";
  controls();
}
async function stop() {
  busy = true;
  controls();
  try {
    await window.pulse.stop();
  } catch {
    issue = "Camera cleanup could not be confirmed. Close PulseFlow.";
    notify(issue, "error");
  }
  busy = false;
  stopped();
}
function openDialog(forCapture: boolean) {
  consent = forCapture;
  button("allow").hidden = !consent;
  button("erase").hidden = consent;
  button("cancel").textContent = consent ? "Not Now" : "Close";
  dialog.showModal();
  button("cancel").focus();
}
button("cancel").onclick = () => {
  dialog.close();
  if (consent)
    notify(
      "Camera access was not granted. You can still use guided breathing.",
      "info",
    );
};
button("privacy").onclick = () => openDialog(false);
button("refresh").onclick = () => void setup();
button("enter").onclick = () => {
  if (!dashboard) {
    dashboard = true;
    el("welcome").hidden = true;
    el("dashboard").hidden = false;
    controls();
    return;
  }
  if (active) void stop();
  else openDialog(true);
};
button("allow").onclick = async () => {
  if (!consent || busy) return;
  dialog.close();
  busy = true;
  active = true;
  issue = "";
  controls();
  el("signal").classList.add("loading");
  el("previewHint").textContent = "Waiting for camera preview";
  for (const c of channels) charts[c].clear();
  try {
    await window.pulse.start(devices.value, true);
    if (active) notify("Camera connected.", "success");
  } catch (e) {
    issue = String((e as Error).message).replace(
      /^Error invoking remote method.*?Error: /,
      "",
    );
    stopped();
    notify(issue, "error");
  } finally {
    busy = false;
    controls();
    el("signal").classList.remove("loading");
  }
};
function updateSignal(now: number) {
  if (!active) return;
  for (const c of channels)
    if (last[c] && now - last[c] > 5000) {
      last[c] = 0;
      el(c + "Value").textContent = "—";
    }
  const valid = !!(last.pulse || last.breath);
  el("signal").textContent = valid
    ? "Receiving signal"
    : hint || "Waiting for signal";
  if (signalSeen && !valid)
    notify("Signal lost. Face the camera in even light.", "warning");
  signalSeen = valid;
}
function receive(e: CaptureEvent) {
  if (e.kind === "error") {
    issue = e.message;
    stopped();
    notify(issue, "error");
    return;
  }
  if (!active) return;
  if (e.kind === "frame") {
    const c = el<HTMLCanvasElement>("preview");
    c.width = e.width;
    c.height = e.height;
    c.hidden = false;
    el("previewHint").hidden = true;
    c.getContext("2d")?.putImageData(
      new ImageData(new Uint8ClampedArray(e.pixels), e.width, e.height),
      0,
      0,
    );
    latestFrame = performance.now();
  } else if (e.kind === "status") {
    hint = e.valid ? "" : e.message;
    if (!e.valid) clearLive();
  } else {
    const now = performance.now(),
      changed = new Set<Channel>();
    for (const p of e.values) {
      charts[p.channel].add(p);
      changed.add(p.channel);
      session.add(p, now);
      if (
        !last[p.channel] &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        el(p.channel + "Value").animate([{ opacity: 0.35 }, { opacity: 1 }], {
          duration: 220,
        });
      last[p.channel] = now;
      el(p.channel + "Value").textContent = p.value.toFixed(1);
    }
    for (const c of e.missing) {
      last[c] = 0;
      el(c + "Value").textContent = "—";
    }
    for (const c of changed) charts[c].draw();
  }
  updateSignal(performance.now());
}
function showExercise() {
  const now = performance.now(),
    running = session.state === "active",
    paused = session.state === "paused",
    done = session.state === "complete";
  const t = session.elapsed(now),
    phase = session.phase(now);
  const label = running
    ? phase.label
    : paused
      ? "Paused"
      : done
        ? "Session complete"
        : "Ready";
  if (el("phase").textContent !== label) el("phase").textContent = label;
  el("circle").style.transform =
    "scale(" +
    (done || session.state === "ready" ? 0.65 : 0.65 + 0.5 * phase.size) +
    ")";
  const seconds = Math.ceil((session.duration - t) / 1000);
  el("timer").textContent =
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0");
  button("exerciseStart").textContent = running
    ? "Pause"
    : paused
      ? "Resume"
      : "Start";
  button("exerciseStart").disabled = done;
  button("end").disabled = !running && !paused;
  for (const id of ["inhale", "exhale"])
    el<HTMLInputElement>(id).disabled = session.state !== "ready";
}
function animate() {
  showExercise();
  if (session.elapsed(performance.now()) >= session.duration) {
    finish();
    return;
  }
  frame = requestAnimationFrame(animate);
}
function finish() {
  cancelAnimationFrame(frame);
  session.end(performance.now());
  showExercise();
  el("summary").hidden = false;
  const stats = el("stats");
  stats.replaceChildren();
  for (const [k, v] of Object.entries({
    Duration: (session.elapsed(performance.now()) / 1000).toFixed(1) + " s",
    "Average heart rate (BPM)": session.average("pulse"),
    "Average breathing rate (br/min)": session.average("breath"),
    "Valid pulse / breathing samples":
      session.counts.pulse + " / " + session.counts.breath,
    Completion:
      session.elapsed(performance.now()) >= session.duration
        ? "Completed"
        : "Ended early",
  })) {
    const dt = document.createElement("dt"),
      dd = document.createElement("dd");
    dt.textContent = k;
    dd.textContent = v;
    stats.append(dt, dd);
  }
  notify("Session complete.", "success", "exercise");
  el("summary").scrollIntoView({ block: "nearest" });
}
button("exerciseStart").onclick = () => {
  const now = performance.now();
  if (session.state === "active") {
    if (session.elapsed(now) >= session.duration) {
      finish();
      return;
    }
    session.pause(now);
    cancelAnimationFrame(frame);
    notify("Session paused.", "info", "exercise");
    showExercise();
    return;
  }
  if (session.state === "paused") {
    session.resume(now);
    notify("Session resumed.", "info", "exercise");
  } else if (
    session.start(
      now,
      el<HTMLInputElement>("inhale").valueAsNumber,
      el<HTMLInputElement>("exhale").valueAsNumber,
    )
  )
    notify("Session started.", "info", "exercise");
  else {
    notify("Choose whole phase lengths between 1 and 15 seconds.", "warning");
    return;
  }
  animate();
};
button("end").onclick = finish;
function reset() {
  cancelAnimationFrame(frame);
  session = new Session();
  el("summary").hidden = true;
  el("stats").replaceChildren();
  showExercise();
}
button("newSession").onclick = () => {
  reset();
  button("exerciseStart").click();
};
button("erase").onclick = async () => {
  dialog.close();
  await stop();
  reset();
  for (const c of channels) charts[c].clear();
  notify("Session data cleared.", "success");
};
setInterval(() => {
  const now = performance.now();
  updateSignal(now);
  if (active && latestFrame && now - latestFrame > 2500) {
    el("preview").hidden = true;
    el("previewHint").hidden = false;
    el("previewHint").textContent = "Waiting for camera preview";
  }
}, 500);
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  issue = "Unexpected desktop error. Restart PulseFlow.";
  controls();
  notify(issue, "error");
});
window.pulse?.listen?.(receive);
void setup();

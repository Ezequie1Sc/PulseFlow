import type { Reading } from "../src/model.ts";
export class Chart {
  points: Reading[] = [];
  constructor(private canvas: HTMLCanvasElement) {
    new ResizeObserver(() => this.draw()).observe(canvas);
    canvas.onpointermove = (e) => {
      if (!this.points.length) return;
      const bounds = canvas.getBoundingClientRect();
      const fraction = Math.min(
        1,
        Math.max(0, (e.clientX - bounds.left - 34) / (bounds.width - 46)),
      );
      const target =
        this.points[0].time +
        fraction * (this.points.at(-1)!.time - this.points[0].time);
      const p = this.points.reduce((a, b) =>
        Math.abs(a.time - target) < Math.abs(b.time - target) ? a : b,
      );
      canvas.title =
        p.value.toFixed(1) + (p.channel === "pulse" ? " BPM" : " br/min");
    };
  }
  add(p: Reading) {
    this.points.push(p);
    if (this.points.length > 150) this.points.shift();
  }
  clear() {
    this.points = [];
    this.canvas.title = "";
    this.draw();
  }
  draw() {
    const c = this.canvas,
      w = c.clientWidth,
      h = c.clientHeight,
      d = devicePixelRatio;
    if (!w || !h) return;
    c.width = w * d;
    c.height = h * d;
    const g = c.getContext("2d")!;
    g.scale(d, d);
    g.font = "10px monospace";
    const vals = this.points.map((p) => p.value),
      lo = Math.floor(Math.min(...vals)),
      hi = Math.max(lo + 1, Math.ceil(Math.max(...vals)));
    for (const f of [0, 0.5, 1]) {
      const y = 9 + (h - 32) * f;
      g.strokeStyle = "#262626";
      g.beginPath();
      g.moveTo(34, y);
      g.lineTo(w - 12, y);
      g.stroke();
      if (vals.length) {
        g.fillStyle = "#a1a1aa";
        g.fillText(String(Math.round(hi - (hi - lo) * f)), 1, y + 3);
      }
    }
    if (!vals.length) {
      g.fillStyle = "#a1a1aa";
      g.fillText("Waiting for signal", 35, h - 4);
      return;
    }
    const first = this.points[0].time,
      last = this.points.at(-1)!.time;
    g.strokeStyle = this.points[0].channel === "pulse" ? "#fafafa" : "#a1a1aa";
    g.fillStyle = g.strokeStyle;
    g.beginPath();
    this.points.forEach((p, i) => {
      const x = 34 + ((w - 46) * (p.time - first)) / Math.max(1, last - first),
        y = 9 + ((h - 32) * (hi - p.value)) / (hi - lo);
      if (!i || p.time - this.points[i - 1].time > 5e6) g.moveTo(x, y);
      else g.lineTo(x, y);
      g.fillRect(x - 1, y - 1, 2, 2);
    });
    g.stroke();
    g.fillText("0s", 34, h - 4);
    g.fillText(((last - first) / 1e6).toFixed(0) + "s", w - 32, h - 4);
  }
}

import type { Channel, Reading } from "../src/model.ts";
export class Session {
  state: "ready" | "active" | "paused" | "complete" = "ready";
  private anchor = 0;
  private bank = 0;
  inhale = 4;
  exhale = 6;
  duration = 60000;
  totals = { pulse: 0, breath: 0 };
  counts = { pulse: 0, breath: 0 };
  elapsed(now: number) {
    return Math.min(
      this.duration,
      this.bank +
        (this.state === "active" ? Math.max(0, now - this.anchor) : 0),
    );
  }
  start(now: number, i: number, e: number) {
    if (
      this.state !== "ready" ||
      ![i, e].every((v) => Number.isInteger(v) && v >= 1 && v <= 15)
    )
      return false;
    this.inhale = i;
    this.exhale = e;
    this.anchor = now;
    this.state = "active";
    return true;
  }
  pause(now: number) {
    if (this.state === "active") {
      this.bank = this.elapsed(now);
      this.state = "paused";
    }
  }
  resume(now: number) {
    if (this.state === "paused") {
      this.anchor = now;
      this.state = "active";
    }
  }
  end(now: number) {
    this.bank = this.elapsed(now);
    this.state = "complete";
  }
  phase(now: number) {
    const t = (this.elapsed(now) / 1000) % (this.inhale + this.exhale);
    return t < this.inhale
      ? { label: "Inhale", size: t / this.inhale }
      : { label: "Exhale", size: 1 - (t - this.inhale) / this.exhale };
  }
  add(r: Reading, now: number) {
    if (this.state !== "active" || this.elapsed(now) >= this.duration) return;
    this.totals[r.channel] += r.value;
    this.counts[r.channel]++;
  }
  average(c: Channel) {
    return this.counts[c]
      ? (this.totals[c] / this.counts[c]).toFixed(1)
      : "Not available";
  }
}

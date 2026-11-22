import type { Channel, Reading } from "./model.ts";
interface Point {
  timestamp?: unknown;
  value?: number | null;
  stable?: boolean | null;
}
export class Measurements {
  private last = { pulse: -1, breath: -1 };
  consume(channel: Channel, points: readonly Point[] = []) {
    const values: Reading[] = [];
    let missing = false;
    for (const point of points) {
      if (point.timestamp == null) continue;
      const time = Number(point.timestamp);
      if (!Number.isSafeInteger(time) || time < 0 || time <= this.last[channel])
        continue;
      this.last[channel] = time;
      missing =
        point.stable !== true ||
        typeof point.value !== "number" ||
        !Number.isFinite(point.value) ||
        point.value <= 0;
      if (!missing) values.push({ channel, time, value: point.value! });
    }
    return { values, missing };
  }
}

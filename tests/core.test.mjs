import test from "node:test";
import assert from "node:assert/strict";
import { Session } from "../ui/session.ts";
import { Measurements } from "../src/measurements.ts";
import { sdkError } from "../src/errors.ts";
import { ToastKeys } from "../ui/toasts.ts";
import { Metrics, decodeMetrics } from "@smartspectra/node-sdk/messages";
test("single clock holds phase and duration across pauses", () => {
  const s = new Session();
  assert(s.start(100, 4, 6));
  assert.equal(s.phase(2100).size, 0.5);
  s.pause(2100);
  assert.equal(s.elapsed(9000), 2000);
  assert.equal(s.phase(9000).size, 0.5);
  s.resume(10000);
  assert.equal(s.phase(12000).label, "Exhale");
  assert.equal(s.phase(15000).size, 0.5);
  s.end(15000);
  assert.equal(s.elapsed(90000), 7000);
});
test("valid configuration, timer ceiling and empty summary", () => {
  const s = new Session();
  assert(!s.start(0, 0, 6));
  assert(s.start(0, 4, 6));
  assert(!s.start(1, 2, 2));
  assert.equal(s.elapsed(999999), 60000);
  assert.equal(s.average("pulse"), "Not available");
});
test("summary counts only while active and before deadline", () => {
  const s = new Session();
  s.start(0, 4, 6);
  const fixture = { channel: "pulse", time: 1, value: 60 };
  s.add(fixture, 10);
  s.pause(20);
  s.add(fixture, 30);
  s.resume(50);
  s.add({ ...fixture, value: 70 }, 80);
  s.add(fixture, 90000);
  assert.equal(s.average("pulse"), "65.0");
  assert.equal(s.counts.pulse, 2);
  assert.equal(s.counts.breath, 0);
});
test("actual protobuf schema decodes stable samples and rejects stale, invalid and duplicate points", () => {
  const fixture = Metrics.encode(
    Metrics.create({
      cardio: {
        pulseRate: [
          { timestamp: 100, value: 72, stable: true },
          { timestamp: 101, value: 80, stable: false },
        ],
      },
    }),
  ).finish();
  const m = new Measurements(),
    data = decodeMetrics(fixture);
  const result = m.consume("pulse", data.cardio.pulseRate);
  assert.equal(result.values.length, 1);
  assert(result.missing);
  assert.equal(m.consume("pulse", data.cardio.pulseRate).values.length, 0);
  for (const value of [0, -1, NaN, Infinity])
    assert.equal(
      new Measurements().consume("pulse", [
        { timestamp: 1, stable: true, value },
      ]).values.length,
      0,
    );
  assert.equal(m.consume("breath").values.length, 0);
});
test("toast keys suppress duplicates until dismissed", () => {
  const k = new ToastKeys();
  assert(k.claim("lost"));
  assert(!k.claim("lost"));
  k.remove("lost");
  assert(k.claim("lost"));
});
test("SDK errors provide recovery actions without exposing raw credentials", () => {
  assert.match(sdkError(2), /key/);
  assert.match(sdkError(7), /camera/i);
  assert.match(sdkError(13), /permissions/);
  assert.match(sdkError(undefined), /Restart/);
});

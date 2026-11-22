export type Channel = "pulse" | "breath";
export interface Reading {
  channel: Channel;
  value: number;
  time: number;
}
export type CaptureEvent =
  | { kind: "samples"; values: Reading[]; missing: Channel[] }
  | { kind: "status"; message: string; valid: boolean }
  | { kind: "error"; message: string }
  | { kind: "frame"; pixels: Uint8Array; width: number; height: number };
export interface Setup {
  configured: boolean;
  cameras: { id: string; name: string }[];
  issue: string;
}
export interface Bridge {
  setup(): Promise<Setup>;
  start(id: string, consent: boolean): Promise<void>;
  stop(): Promise<void>;
  listen(fn: (event: CaptureEvent) => void): void;
}
declare global {
  interface Window {
    pulse: Bridge;
  }
}

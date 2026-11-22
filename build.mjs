import { build } from "esbuild";
import { mkdir, cp } from "node:fs/promises";
await mkdir("build/icons", { recursive: true });
for (const part of ["main", "preload", "app"]) {
  const renderer = part === "app";
  await build({
    entryPoints: [renderer ? "ui/app.ts" : "src/" + part + ".ts"],
    bundle: true,
    outfile: "build/" + part + (renderer ? ".js" : ".cjs"),
    format: renderer ? "iife" : "cjs",
    platform: renderer ? "browser" : "node",
    packages: renderer ? "bundle" : "external",
    target: "es2022",
  });
}
await build({
  entryPoints: ["src/capture.ts"],
  outfile: "build/native.cjs",
  bundle: true,
  packages: "external",
  platform: "node",
  format: "cjs",
});
for (const name of ["index.html", "style.css"])
  await cp("ui/" + name, "build/" + name);
for (const font of ["geist", "geist-mono"])
  await cp(
    "node_modules/@fontsource-variable/" +
      font +
      "/files/" +
      font +
      "-latin-wght-normal.woff2",
    "build/" + font + ".woff2",
  );
for (const icon of [
  "activity",
  "heart",
  "wind",
  "video",
  "shield",
  "circle-check",
  "info",
  "triangle-alert",
  "circle-x",
  "arrow-right",
])
  await cp(
    "node_modules/lucide/icons/" + icon + ".svg",
    "build/icons/" + icon + ".svg",
  );

import { SmartSpectraSDK, PixelFormat } from "@smartspectra/node-sdk";
export function cameras() {
  return SmartSpectraSDK.availableCameras().map((c, i) => ({
    id: c.id,
    name: c.name || "Camera " + (i + 1),
  }));
}
export function preview(
  buf: Buffer,
  w: number,
  h: number,
  stride: number,
  format: number,
) {
  const alpha = format === PixelFormat.kRGBA || format === PixelFormat.kBGRA;
  const blue = format === PixelFormat.kBGR || format === PixelFormat.kBGRA;
  const planar = format === PixelFormat.kNV12 || format === PixelFormat.kNV21;
  const packed = format === PixelFormat.kYUYV;
  if (!planar && !packed && !alpha && !blue && format !== PixelFormat.kRGB)
    return;
  const channels = planar ? 1 : packed ? 2 : alpha ? 4 : 3;
  if (w < 1 || h < 1 || stride < w * channels || buf.length < h * stride)
    return;
  const width = Math.min(320, w),
    height = Math.max(1, Math.round((width * h) / w));
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const src =
          Math.floor((y * h) / height) * stride +
          Math.floor((x * w) / width) * channels,
        dst = (y * width + x) * 4;
      const grey =
        planar || packed
          ? buf[src]
          : Math.round(
              0.299 * buf[src + (blue ? 2 : 0)] +
                0.587 * buf[src + 1] +
                0.114 * buf[src + (blue ? 0 : 2)],
            );
      pixels.fill(grey, dst, dst + 3);
      pixels[dst + 3] = 255;
    }
  return { pixels, width, height };
}

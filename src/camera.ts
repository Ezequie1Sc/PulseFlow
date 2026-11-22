
import {
  SmartSpectraSDK,
  PixelFormat,
} from "@smartspectra/node-sdk";

/**
 * Obtiene las cámaras disponibles mediante SmartSpectra.
 */
export function cameras() {
  return SmartSpectraSDK.availableCameras().map((camera, index) => ({
    id: camera.id,
    name: camera.name || `Camera ${index + 1}`,
  }));
}

/**
 * Limita un valor al intervalo de un canal de color.
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Conversión YUV a RGB, asumiendo rango completo
 * y coeficientes BT.601.
 */
function yuvToRgb(
  y: number,
  u: number,
  v: number,
): [number, number, number] {
  const chromaU = u - 128;
  const chromaV = v - 128;

  return [
    clamp(y + 1.402 * chromaV),
    clamp(y - 0.344136 * chromaU - 0.714136 * chromaV),
    clamp(y + 1.772 * chromaU),
  ];
}

/**
 * Convierte un fotograma nativo de SmartSpectra
 * a RGBA para mostrarlo en la interfaz.
 *
 * Esta función genera únicamente la vista previa.
 * No modifica los fotogramas procesados por el SDK
 * para obtener señales fisiológicas.
 */
export function preview(
  buf: Buffer,
  w: number,
  h: number,
  stride: number,
  format: number,
) {
  const rgba = format === PixelFormat.kRGBA;
  const bgra = format === PixelFormat.kBGRA;

  const rgb = format === PixelFormat.kRGB;
  const bgr = format === PixelFormat.kBGR;

  const nv12 = format === PixelFormat.kNV12;
  const nv21 = format === PixelFormat.kNV21;

  const yuyv = format === PixelFormat.kYUYV;

  const supported =
    rgba || bgra || rgb || bgr || nv12 || nv21 || yuyv;

  if (!supported) {
    return;
  }

  // Validación de dimensiones.
  if (
    !Number.isSafeInteger(w) ||
    !Number.isSafeInteger(h) ||
    !Number.isSafeInteger(stride) ||
    w <= 0 ||
    h <= 0 ||
    stride <= 0
  ) {
    return;
  }

  const planar = nv12 || nv21;

  const channels = rgba || bgra
    ? 4
    : rgb || bgr
      ? 3
      : 0;

  const minimumStride = planar
    ? 2 * Math.ceil(w / 2)
    : yuyv
      ? 4 * Math.ceil(w / 2)
      : w * channels;

  if (stride < minimumStride) {
    return;
  }

  // Comprobar que el buffer contiene el fotograma.
  const requiredBytes = planar
    ? stride * h + stride * Math.ceil(h / 2)
    : stride * h;

  if (
    !Number.isSafeInteger(requiredBytes) ||
    buf.length < requiredBytes
  ) {
    return;
  }

  // Limitar el tamaño de la vista previa para
  // evitar transferencias innecesariamente grandes.
  const width = Math.min(320, w);

  const height = Math.max(
    1,
    Math.round((width * h) / w),
  );

  const pixels = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    const sourceY = Math.min(
      h - 1,
      Math.floor((y * h) / height),
    );

    for (let x = 0; x < width; x++) {
      const sourceX = Math.min(
        w - 1,
        Math.floor((x * w) / width),
      );

      const destination = (y * width + x) * 4;

      let red = 0;
      let green = 0;
      let blue = 0;

      /**
       * NV12 / NV21
       *
       * Plano Y seguido de crominancia intercalada.
       */
      if (nv12 || nv21) {
        const yIndex = sourceY * stride + sourceX;

        const chromaIndex =
          stride * h +
          Math.floor(sourceY / 2) * stride +
          Math.floor(sourceX / 2) * 2;

        if (
          yIndex >= buf.length ||
          chromaIndex + 1 >= buf.length
        ) {
          return;
        }

        const luminance = buf[yIndex];

        const u = buf[
          chromaIndex + (nv21 ? 1 : 0)
        ];

        const v = buf[
          chromaIndex + (nv21 ? 0 : 1)
        ];

        [red, green, blue] = yuvToRgb(
          luminance,
          u,
          v,
        );
      }

      /**
       * YUYV
       *
       * Cada grupo de cuatro bytes representa
       * dos píxeles que comparten crominancia.
       */
      else if (yuyv) {
        const pairStart =
          sourceY * stride +
          Math.floor(sourceX / 2) * 4;

        if (pairStart + 3 >= buf.length) {
          return;
        }

        const luminance =
          buf[pairStart + (sourceX % 2) * 2];

        const u = buf[pairStart + 1];
        const v = buf[pairStart + 3];

        [red, green, blue] = yuvToRgb(
          luminance,
          u,
          v,
        );
      }

      /**
       * RGB / BGR / RGBA / BGRA
       */
      else {
        const source =
          sourceY * stride +
          sourceX * channels;

        if (source + channels > buf.length) {
          return;
        }

        if (bgr || bgra) {
          blue = buf[source];
          green = buf[source + 1];
          red = buf[source + 2];
        } else {
          red = buf[source];
          green = buf[source + 1];
          blue = buf[source + 2];
        }
      }

      pixels[destination] = red;
      pixels[destination + 1] = green;
      pixels[destination + 2] = blue;
      pixels[destination + 3] = 255;
    }
  }

  return {
    pixels,
    width,
    height,
  };
}

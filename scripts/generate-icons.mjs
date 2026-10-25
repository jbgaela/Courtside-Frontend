import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'public/icons');
mkdirSync(ROOT, { recursive: true });

const FOREST = [22, 68, 48];
const LIME = [201, 245, 106];
const DEEP = [15, 53, 36];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function insideRoundedRect(px, py, size, radius, inset) {
  const min = inset;
  const max = size - inset;
  if (px < min || px > max || py < min || py > max) return false;
  const cx = Math.min(Math.max(px, min + radius), max - radius);
  const cy = Math.min(Math.max(py, min + radius), max - radius);
  return (
    (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2 ||
    (px >= min + radius && px <= max - radius) ||
    (py >= min + radius && py <= max - radius)
  );
}

function drawIcon(size, { maskable = false } = {}) {
  const scale = 3;
  const big = size * scale;
  const buffer = Buffer.alloc(big * big * 4);
  const center = big / 2;
  const ballRadius = big * (maskable ? 0.28 : 0.33);
  const holeRadius = big * 0.026;
  const inset = maskable ? 0 : big * 0.055;
  const radius = maskable ? 0 : big * 0.22;
  const holes = [
    [-0.45, -0.5],
    [-0.05, -0.6],
    [0.4, -0.35],
    [-0.58, 0.05],
    [-0.18, -0.05],
    [0.22, 0.12],
    [0.55, 0.3],
    [-0.35, 0.5],
    [0.08, 0.62],
    [0.45, -0.02],
  ];

  for (let y = 0; y < big; y += 1) {
    for (let x = 0; x < big; x += 1) {
      const index = (y * big + x) * 4;
      const bg = insideRoundedRect(x, y, big, radius, inset);
      if (!bg) {
        buffer[index + 3] = 0;
        continue;
      }
      buffer[index] = FOREST[0];
      buffer[index + 1] = FOREST[1];
      buffer[index + 2] = FOREST[2];
      buffer[index + 3] = 255;

      const dx = x - center;
      const dy = y - center;
      const distance = Math.hypot(dx, dy);
      if (distance <= ballRadius) {
        let isHole = false;
        for (const [hx, hy] of holes) {
          if (Math.hypot(dx - hx * ballRadius, dy - hy * ballRadius) <= holeRadius) {
            isHole = true;
            break;
          }
        }
        if (!isHole) {
          buffer[index] = LIME[0];
          buffer[index + 1] = LIME[1];
          buffer[index + 2] = LIME[2];
          buffer[index + 3] = 255;
        } else {
          buffer[index] = DEEP[0];
          buffer[index + 1] = DEEP[1];
          buffer[index + 2] = DEEP[2];
        }
      }
    }
  }

  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const source = ((y * scale + sy) * big + (x * scale + sx)) * 4;
          const alpha = buffer[source + 3] / 255;
          r += buffer[source] * alpha;
          g += buffer[source + 1] * alpha;
          b += buffer[source + 2] * alpha;
          a += alpha;
        }
      }
      const target = (y * size + x) * 4;
      const samples = scale * scale;
      if (a > 0) {
        out[target] = Math.round(r / a);
        out[target + 1] = Math.round(g / a);
        out[target + 2] = Math.round(b / a);
      }
      out[target + 3] = Math.round((a / samples) * 255);
    }
  }
  return encodePng(size, size, out);
}

const outputs = [
  ['icon-512.png', 512, {}],
  ['icon-192.png', 192, {}],
  ['apple-touch-icon.png', 180, {}],
  ['maskable-512.png', 512, { maskable: true }],
];

for (const [name, size, options] of outputs) {
  const png = drawIcon(size, options);
  const path = resolve(ROOT, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
  console.log(`wrote ${name} (${size}px, ${png.length} bytes)`);
}

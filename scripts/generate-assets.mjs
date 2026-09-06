import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
const dir = "public/assets";
mkdirSync(`${dir}/heroes`, { recursive: true });
const ids = [
  "yuria",
  "reina",
  "arin",
  "karin",
  "sera",
  "noel",
  "luna",
  "eve",
  "mia",
  "lize",
];
const colors = [
  "80e6d1",
  "f4b86c",
  "77bfff",
  "e2a0de",
  "8ef0cc",
  "a8befa",
  "b5a1ff",
  "ffd77e",
  "ffa4b1",
  "8edcf4",
];
const hairs = [
  "d5e7e7",
  "c67953",
  "6084c3",
  "b18bc6",
  "b8cfdc",
  "e9e4d9",
  "a295d4",
  "c79b62",
  "e8b2b4",
  "81b6c7",
];
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type),
    n = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  n.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([n, t, data, crc]);
}
function png(w, h, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w, 0);
  header.writeUInt32BE(h, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++)
    Buffer.from(pixels.slice(y * w * 4, (y + 1) * w * 4)).copy(
      rows,
      y * (1 + w * 4) + 1,
    );
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
for (let i = 0; i < ids.length; i++) {
  const pix = new Uint8Array(48 * 64 * 4);
  const rects = [];
  const r = (x, y, w, h, c) => {
    rects.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#${c}"/>`,
    );
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) {
        if (xx < 0 || xx >= 48 || yy < 0 || yy >= 64) continue;
        const n = (yy * 48 + xx) * 4;
        pix[n] = parseInt(c.slice(0, 2), 16);
        pix[n + 1] = parseInt(c.slice(2, 4), 16);
        pix[n + 2] = parseInt(c.slice(4, 6), 16);
        pix[n + 3] = 255;
      }
  };
  const c = colors[i],
    hair = hairs[i];
  r(13, 6, 23, 27, "111c30");
  r(10, 12, 28, 27, hair);
  r(8, 19, 6, 30, hair);
  r(34, 16, 5, 34, hair);
  r(15, 7, 17, 23, hair);
  r(17, 15, 16, 17, "f5d8ca");
  r(17, 27, 14, 4, "dfad9f");
  r(16, 12, 18, 7, hair);
  r(16, 15, 5, 7, hair);
  r(31, 15, 4, 10, hair);
  r(20, 23, 3, 3, "293549");
  r(28, 23, 3, 3, "293549");
  r(21, 23, 2, 2, c);
  r(29, 23, 2, 2, c);
  r(25, 28, 3, 1, "b97d85");
  r(23, 31, 5, 5, "f1cab8");
  r(14, 35, 22, 16, "1e3046");
  r(10, 37, 7, 16, "263d54");
  r(33, 36, 7, 17, "263d54");
  r(11, 48, 5, 5, "f1cab8");
  r(35, 48, 5, 5, "f1cab8");
  r(18, 35, 5, 12, "3b586c");
  r(22, 35, 5, 4, c);
  r(29, 36, 4, 14, c);
  r(17, 48, 17, 4, "101d30");
  r(23, 48, 5, 3, "b4c8cf");
  r(16, 52, 8, 9, "23364e");
  r(27, 52, 8, 9, "23364e");
  r(14, 60, 10, 4, "101929");
  r(27, 60, 11, 4, "101929");
  r(16, 55, 3, 4, c);
  r(32, 55, 3, 4, c);
  r(8, 16, 7, 6, "263b50");
  r(8, 17, 3, 4, c);
  if (i === 0) {
    r(5, 37, 12, 21, "d1e0df");
    r(8, 39, 7, 16, "345968");
    r(10, 41, 3, 12, c);
  } else if ([1, 2, 3].includes(i)) {
    r(39, 22, 3, 34, "a9cddd");
    r(40, 16, 2, 24, c);
    r(35, 47, 10, 3, "435d78");
  } else if (i === 6 || i === 9) {
    r(41, 23, 2, 34, "819aab");
    r(37, 19, 10, 8, c);
    r(40, 16, 4, 14, "edfdfb");
  } else if (i === 8) {
    r(35, 37, 10, 13, "e7ece8");
    r(39, 40, 3, 7, c);
    r(37, 42, 7, 3, c);
  } else {
    r(23, 41, 23, 6, "172435");
    r(26, 40, 12, 3, "607a8d");
    r(34, 44, 6, 3, c);
    r(40, 39, 7, 3, "293e56");
    r(29, 46, 4, 7, "26374b");
  }
  writeFileSync(`${dir}/heroes/${ids[i]}.png`, png(48, 64, pix));
  writeFileSync(
    `${dir}/heroes/${ids[i]}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64" shape-rendering="crispEdges">${rects.join("")}</svg>`,
  );
}
for (const size of [192, 512]) {
  const p = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const xx = x / size,
        yy = y / size;
      const bolt =
        (yy > 0.15 &&
          yy < 0.53 &&
          xx > 0.28 + (0.53 - yy) * 0.65 &&
          xx < 0.61) ||
        (yy >= 0.46 &&
          yy < 0.87 &&
          xx > 0.43 &&
          xx < 0.74 - (yy - 0.46) * 0.65);
      const k = (y * size + x) * 4;
      const c = bolt ? [132, 245, 208] : [16, 23, 39];
      p[k] = c[0];
      p[k + 1] = c[1];
      p[k + 2] = c[2];
      p[k + 3] = 255;
    }
  writeFileSync(`public/icon-${size}.png`, png(size, size, p));
}
console.log("10 original pixel heroes + PWA icons generated.");

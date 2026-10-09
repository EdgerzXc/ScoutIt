/**
 * Standalone, zero-dependency QR Code (Model 2, Byte Mode) Matrix Generator.
 * Supports Versions 1 to 6 (up to 134 alphanumeric/URL bytes) with Reed-Solomon ECC.
 * Used for luxury story cards, window standees, and physical QR flyers.
 */

// GF(256) tables with primitive polynomial 0x11D (285)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGalois() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = val;
    GF_EXP[i + 255] = val;
    GF_LOG[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], GF_EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const out = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ out[0];
    for (let j = 0; j < ecCount - 1; j++) {
      out[j] = out[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    out[ecCount - 1] = gfMul(gen[ecCount], factor);
  }
  return out;
}

// Version table for EC Level M (Byte Mode capacities & EC words)
// [version, totalCodewords, dataCodewords, ecCodewordsPerBlock, numBlocks]
const VERSION_SPECS = [
  { version: 1, size: 21, dataCap: 14, ecPerBlock: 10, blocks: 1, align: [] },
  { version: 2, size: 25, dataCap: 26, ecPerBlock: 16, blocks: 1, align: [6, 18] },
  { version: 3, size: 29, dataCap: 42, ecPerBlock: 26, blocks: 1, align: [6, 22] },
  { version: 4, size: 33, dataCap: 62, ecPerBlock: 18, blocks: 2, align: [6, 26] },
  { version: 5, size: 37, dataCap: 84, ecPerBlock: 24, blocks: 2, align: [6, 30] },
  { version: 6, size: 41, dataCap: 106, ecPerBlock: 16, blocks: 4, align: [6, 34] },
];

/**
 * Encodes text into a boolean 2D matrix (true = dark, false = light).
 * @param {string} text - URL or string to encode
 * @returns {{ size: number, modules: boolean[][] }}
 */
export function generateQrMatrix(text) {
  const bytes = new TextEncoder().encode(String(text || "https://scoutit.space"));
  
  // Find smallest version that fits
  const spec = VERSION_SPECS.find((v) => bytes.length + 3 <= v.dataCap) || VERSION_SPECS[VERSION_SPECS.length - 1];
  const size = spec.size;
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));

  // 1. Finder patterns at 3 corners
  function placeFinder(startX, startY) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startY + r][startX + c] = isBorder || isCenter;
      }
    }
    // Separators (white border)
    for (let i = 0; i < 8; i++) {
      if (startY + 7 < size && startX + i < size) matrix[startY + 7][startX + i] = false;
      if (startX + 7 < size && startY + i < size) matrix[startY + i][startX + 7] = false;
      if (startY - 1 >= 0 && startX + i < size) matrix[startY - 1][startX + i] = false;
      if (startX - 1 >= 0 && startY + i < size) matrix[startY + i][startX - 1] = false;
    }
  }

  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  // 2. Alignment patterns
  if (spec.align.length > 0) {
    const coords = spec.align;
    for (const r of coords) {
      for (const c of coords) {
        if (matrix[r][c] !== null) continue; // Skip if collides with finder
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            matrix[r + dr][c + dc] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // 4. Dark module
  matrix[4 * spec.version + 9][8] = true;

  // 5. Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // 6. Build Bitstream (Byte Mode: 0100, length, bytes, terminator, padding)
  const bitstream = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bitstream.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(bytes.length, 8); // Character count indicator
  for (const b of bytes) pushBits(b, 8);
  pushBits(0b0000, 4); // Terminator

  while (bitstream.length % 8 !== 0) bitstream.push(0);

  // Convert to codewords
  const dataCodewords = [];
  for (let i = 0; i < bitstream.length; i += 8) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) byteVal = (byteVal << 1) | bitstream[i + b];
    dataCodewords.push(byteVal);
  }

  // Pad to capacity
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataCodewords.length < spec.dataCap) {
    dataCodewords.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // 7. Generate EC codewords
  const blockSize = Math.floor(spec.dataCap / spec.blocks);
  const blocksData = [];
  const blocksEc = [];

  for (let b = 0; b < spec.blocks; b++) {
    const blockData = dataCodewords.slice(b * blockSize, (b + 1) * blockSize);
    blocksData.push(blockData);
    blocksEc.push(rsEncode(blockData, spec.ecPerBlock));
  }

  // Interleave data codewords then EC codewords
  const finalCodewords = [];
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.blocks; b++) {
      if (i < blocksData[b].length) finalCodewords.push(blocksData[b][i]);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) {
      finalCodewords.push(blocksEc[b][i]);
    }
  }

  // Convert final codewords back to bits
  const finalBits = [];
  for (const cw of finalCodewords) {
    for (let i = 7; i >= 0; i--) finalBits.push((cw >> i) & 1);
  }

  // 8. Place bits in matrix (right-to-left 2-column zig-zag)
  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (matrix[r][c] === null) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Apply mask pattern 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit === 1) ^ mask;
        }
      }
    }
    upward = !upward;
  }

  // 9. Format Info (Mask 0 + EC M -> 101010000010010)
  const FORMAT_BITS = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  // Around top-left finder
  for (let i = 0; i < 6; i++) matrix[8][i] = Boolean(FORMAT_BITS[i]);
  matrix[8][7] = Boolean(FORMAT_BITS[6]);
  matrix[8][8] = Boolean(FORMAT_BITS[7]);
  matrix[7][8] = Boolean(FORMAT_BITS[8]);
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = Boolean(FORMAT_BITS[i]);

  // Around top-right and bottom-left
  for (let i = 0; i < 8; i++) matrix[8][size - 1 - i] = Boolean(FORMAT_BITS[i]);
  for (let i = 8; i < 15; i++) matrix[size - 15 + i][8] = Boolean(FORMAT_BITS[i]);

  return {
    size,
    modules: matrix.map((row) => row.map(Boolean)),
  };
}

/**
 * Renders QR matrix to an SVG string.
 */
export function generateQrSvg(text, { color = "currentColor", background = "transparent", padding = 2 } = {}) {
  const { size, modules } = generateQrMatrix(text);
  const totalSize = size + padding * 2;
  const paths = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        paths.push(`M${c + padding},${r + padding}h1v1h-1z`);
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="${background}"/>` +
    `<path d="${paths.join("")}" fill="${color}"/>` +
    `</svg>`
  );
}

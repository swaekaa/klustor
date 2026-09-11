// ============================================================
// designAnalysis.ts — Image-based deterministic stat calculator
//
// NO fake Unlayer events. Uses pixel comparison between the
// original car template and the player's saved design to
// derive real, honest performance stats.
//
// Metrics computed:
//   nonWhiteRatio    — how much of the car has been painted
//   colorVariety     — how many distinct hues were used
//   edgeDensity      — stripe/detail density (Sobel approx)
//   brightnessVar    — contrast/boldness of the design
//
// All mapped to CarStats with sensible min/max clamping.
// ============================================================

import type { CarStats } from '../../types';

// ── Helper: load image to canvas ─────────────────────────────
function loadImageToCanvas(
  src: string,
  width: number,
  height: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = () => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
}

// ── Clamp helper ─────────────────────────────────────────────
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Sobel edge approximation ─────────────────────────────────
// Returns fraction of pixels considered "edges" (0–1)
function computeEdgeDensity(data: Uint8ClampedArray, w: number, h: number): number {
  let edgeCount = 0;
  const threshold = 30;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      // Grayscale values for 3×3 neighbors
      const gray = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

      const tl = gray(data[idx - w * 4 - 4], data[idx - w * 4 - 3], data[idx - w * 4 - 2]);
      const tm = gray(data[idx - w * 4], data[idx - w * 4 + 1], data[idx - w * 4 + 2]);
      const tr = gray(data[idx - w * 4 + 4], data[idx - w * 4 + 5], data[idx - w * 4 + 6]);
      const ml = gray(data[idx - 4], data[idx - 3], data[idx - 2]);
      const mr = gray(data[idx + 4], data[idx + 5], data[idx + 6]);
      const bl = gray(data[idx + w * 4 - 4], data[idx + w * 4 - 3], data[idx + w * 4 - 2]);
      const bm = gray(data[idx + w * 4], data[idx + w * 4 + 1], data[idx + w * 4 + 2]);
      const br = gray(data[idx + w * 4 + 4], data[idx + w * 4 + 5], data[idx + w * 4 + 6]);

      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tm - tr + bl + 2 * bm + br;
      const mag = Math.sqrt(gx * gx + gy * gy);

      if (mag > threshold) edgeCount++;
    }
  }

  return edgeCount / ((w - 2) * (h - 2));
}

// ── Compute dominant color variety (HSL hue binning) ─────────
// Returns a count of distinct hue bins (0–36 bins of 10° each)
function computeColorVariety(
  editedData: Uint8ClampedArray,
  templateData: Uint8ClampedArray,
  tolerance = 25
): number {
  const hueBins = new Set<number>();

  for (let i = 0; i < editedData.length; i += 4) {
    const rDiff = Math.abs(editedData[i] - templateData[i]);
    const gDiff = Math.abs(editedData[i + 1] - templateData[i + 1]);
    const bDiff = Math.abs(editedData[i + 2] - templateData[i + 2]);

    // Only consider pixels that differ from the template (user painted them)
    if (rDiff < tolerance && gDiff < tolerance && bDiff < tolerance) continue;
    if (editedData[i + 3] < 20) continue; // skip transparent

    // Convert RGB to HSL hue
    const r = editedData[i] / 255;
    const g = editedData[i + 1] / 255;
    const b = editedData[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    if (d < 0.1) continue; // skip near-gray/white/black

    let hue = 0;
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;

    hueBins.add(Math.floor(hue * 36)); // 36 bins × 10°
  }

  return hueBins.size;
}

// ── Non-white pixel ratio ─────────────────────────────────────
// Pixels that differ significantly from template
function computeNonWhiteRatio(
  editedData: Uint8ClampedArray,
  templateData: Uint8ClampedArray,
  tolerance = 25
): number {
  let changed = 0;
  const total = editedData.length / 4;

  for (let i = 0; i < editedData.length; i += 4) {
    if (editedData[i + 3] < 20) continue;
    const rDiff = Math.abs(editedData[i] - templateData[i]);
    const gDiff = Math.abs(editedData[i + 1] - templateData[i + 1]);
    const bDiff = Math.abs(editedData[i + 2] - templateData[i + 2]);
    if (rDiff > tolerance || gDiff > tolerance || bDiff > tolerance) changed++;
  }

  return changed / total;
}

// ── Brightness variance ───────────────────────────────────────
function computeBrightnessVariance(data: Uint8ClampedArray): number {
  let sum = 0, sumSq = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const br = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / (1000 * 255);
    sum += br;
    sumSq += br * br;
  }
  const mean = sum / n;
  return Math.sqrt(sumSq / n - mean * mean);
}

// ── MAIN EXPORT ───────────────────────────────────────────────
/**
 * Analyzes the player's Unlayer design against the original car template
 * and returns CarStats. All computation is client-side, deterministic,
 * and based on pixel-level image comparison.
 */
export async function analyzeDesign(
  templateDataUrl: string,
  editedDataUrl: string
): Promise<CarStats> {
  // Sample at a reduced resolution for performance
  const W = 256, H = 128;

  try {
    const [templateImg, editedImg] = await Promise.all([
      loadImageToCanvas(templateDataUrl, W, H),
      loadImageToCanvas(editedDataUrl, W, H),
    ]);

    const nonWhiteRatio  = computeNonWhiteRatio(editedImg.data, templateImg.data);
    const colorVariety   = computeColorVariety(editedImg.data, templateImg.data);
    const edgeDensity    = computeEdgeDensity(editedImg.data, W, H);
    const brightnessVar  = computeBrightnessVariance(editedImg.data);

    // ── Stat formulas ─────────────────────────────────────────
    // nonWhiteRatio:  0–1   (0 = blank, 1 = fully painted)
    // colorVariety:   0–36  (distinct hue bins)
    // edgeDensity:    0–1   (fraction of edge pixels)
    // brightnessVar:  0–0.5 (brightness standard deviation)

    const topSpeed = clamp(
      Math.round(100 + colorVariety * 0.8 + nonWhiteRatio * 25),
      100, 140
    );

    const acceleration = clamp(
      parseFloat((3 + edgeDensity * 40 + nonWhiteRatio * 4).toFixed(1)),
      3, 10
    );

    const handling = clamp(
      parseFloat((3 + brightnessVar * 25 + colorVariety * 0.15).toFixed(1)),
      3, 10
    );

    const designScore = clamp(
      parseFloat((
        colorVariety * 0.18 +
        edgeDensity * 25 +
        nonWhiteRatio * 5 +
        brightnessVar * 8
      ).toFixed(1)),
      0, 10
    );

    const overallRating = clamp(
      parseFloat((
        (topSpeed / 140 * 10 * 0.3) +
        (acceleration * 0.25) +
        (handling * 0.25) +
        (designScore * 0.2)
      ).toFixed(1)),
      0, 10
    );

    console.log('[KLUSTOR DESIGN ANALYSIS]', {
      nonWhiteRatio: nonWhiteRatio.toFixed(3),
      colorVariety,
      edgeDensity: edgeDensity.toFixed(3),
      brightnessVar: brightnessVar.toFixed(3),
      topSpeed, acceleration, handling, designScore, overallRating,
    });

    return { topSpeed, acceleration, handling, designScore, overallRating };

  } catch (err) {
    console.warn('[KLUSTOR] Design analysis failed, using defaults:', err);
    return defaultStats();
  }
}

/** Default stats for a plain/unedited car */
export function defaultStats(): CarStats {
  return {
    topSpeed: 100,
    acceleration: 3,
    handling: 3,
    designScore: 0,
    overallRating: 3,
  };
}

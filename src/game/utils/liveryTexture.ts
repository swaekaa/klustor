// ============================================================
// liveryTexture.ts — Converts Unlayer dataUrl to THREE.CanvasTexture
//
// Approach: Use the full image as a decal on the side panel.
// The template comparison approach:
//   - We load the original template and the user's edited image
//   - Pixels that are IDENTICAL to the original template are treated as background
//   - All other pixels (the user's edits) are preserved
//   - This avoids destroying intentional white artwork
//
// If no template is provided, the full image is used as-is on a white panel.
// ============================================================

import * as THREE from 'three';

/**
 * Build a CanvasTexture from an Unlayer dataUrl.
 * Uses the original template to mask background pixels,
 * preserving the user's actual artwork.
 */
export async function buildLiveryTexture(
  editedDataUrl: string,
  _originalTemplateUrl?: string // No longer needed for masking
): Promise<THREE.CanvasTexture> {
  return new Promise((resolve) => {
    const editedImg = new Image();
    editedImg.crossOrigin = 'anonymous';

    editedImg.onload = () => {
      const W = editedImg.naturalWidth || 1024;
      const H = editedImg.naturalHeight || 512;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Draw the user's design directly
      ctx.drawImage(editedImg, 0, 0);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      resolve(texture);
    };

    editedImg.onerror = () => {
      resolve(createFallbackTexture());
    };

    editedImg.src = editedDataUrl;
  });
}

/**
 * Create a default fallback livery texture when no user design exists.
 */
export function createFallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Cream background
  ctx.fillStyle = '#F2EFE4';
  ctx.fillRect(0, 0, 1024, 512);

  // KLUSTOR branding
  ctx.fillStyle = '#8FD5D1';
  ctx.font = 'bold 72px Trebuchet MS, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KLUSTOR', 512, 220);

  ctx.fillStyle = '#1E2933';
  ctx.font = 'bold 36px Trebuchet MS, sans-serif';
  ctx.fillText('// RACING', 512, 280);

  // Decorative stripe
  ctx.fillStyle = '#A8C7D8';
  ctx.fillRect(0, 340, 1024, 24);
  ctx.fillStyle = '#E9B58D';
  ctx.fillRect(0, 370, 1024, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

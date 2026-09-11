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
  originalTemplateUrl?: string
): Promise<THREE.CanvasTexture> {
  return new Promise((resolve, reject) => {
    const editedImg = new Image();
    editedImg.crossOrigin = 'anonymous';

    editedImg.onload = () => {
      const W = editedImg.naturalWidth || 1024;
      const H = editedImg.naturalHeight || 512;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      if (!originalTemplateUrl) {
        // No template — just render full image on white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(editedImg, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        resolve(texture);
        return;
      }

      // Load original template for comparison masking
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';

      templateImg.onload = () => {
        const templateCanvas = document.createElement('canvas');
        templateCanvas.width = W;
        templateCanvas.height = H;
        const tCtx = templateCanvas.getContext('2d')!;
        tCtx.drawImage(templateImg, 0, 0, W, H);
        const templateData = tCtx.getImageData(0, 0, W, H);

        // Draw edited image
        ctx.drawImage(editedImg, 0, 0, W, H);
        const editedData = ctx.getImageData(0, 0, W, H);

        // Process pixels: make template-identical pixels transparent
        const TOLERANCE = 30; // How much a pixel can differ from template and still be "background"
        for (let i = 0; i < editedData.data.length; i += 4) {
          const rDiff = Math.abs(editedData.data[i] - templateData.data[i]);
          const gDiff = Math.abs(editedData.data[i + 1] - templateData.data[i + 1]);
          const bDiff = Math.abs(editedData.data[i + 2] - templateData.data[i + 2]);
          
          if (rDiff < TOLERANCE && gDiff < TOLERANCE && bDiff < TOLERANCE) {
            // Pixel is same as template = background → transparent
            editedData.data[i + 3] = 0;
          }
          // Otherwise keep as-is (user's artwork)
        }

        ctx.putImageData(editedData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        resolve(texture);
      };

      templateImg.onerror = () => {
        // Fallback if template fails: use full image as-is
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(editedImg, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        resolve(texture);
      };

      templateImg.src = originalTemplateUrl;
    };

    editedImg.onerror = () => {
      // If edited image fails: create plain white texture
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = '#8FD5D1';
      ctx.font = 'bold 48px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KLUSTOR RACING', 512, 256);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      resolve(texture); // Resolve with fallback, don't reject
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

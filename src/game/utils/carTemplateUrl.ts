import type { TemplateView } from '../../types';

// Left/Right Plane: 4.2 x 0.55 (Aspect: 7.636)
// Left View SVG: We want the viewBox to be 1145 x 150
// The car drawing fits in ~550 x 145.
// Centered X: (1145 - 550) / 2 = 297.5

const leftDrawing = `
  <g transform="translate(297, -10)">
  </g>
`;

const rightDrawing = `
  <g transform="translate(297, -10)">
  </g>
`;

const frontDrawing = `
  <g transform="translate(338.5, 5)">
  </g>
`;

const rearDrawing = `
  <g transform="translate(338.5, 5)">
  </g>
`;

const topDrawing = `
  <g transform="translate(25, 25) scale(1, 2.3)">
  </g>
`;

function wrapSVG(viewBox: string, inner: string) {
  return 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <g stroke="#1A1A1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        ${inner}
      </g>
    </svg>
  `.trim());
}

const SVGS: Record<TemplateView, string> = {
  left: wrapSVG('0 0 1145 150', leftDrawing),
  right: wrapSVG('0 0 1145 150', rightDrawing),
  front: wrapSVG('0 0 857 120', frontDrawing),
  rear: wrapSVG('0 0 857 120', rearDrawing),
  top: wrapSVG('0 0 200 400', topDrawing),
};

export const CAR_TEMPLATE_URL = SVGS.left;

export async function getCarTemplateUrl(view: TemplateView = 'left'): Promise<string> {
  return SVGS[view];
}

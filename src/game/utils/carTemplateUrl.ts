import type { TemplateView } from '../../types';

// Left/Right Plane: 4.2 x 0.55 (Aspect: 7.636)
// Left View SVG: We want the viewBox to be 1145 x 150
// The car drawing fits in ~550 x 145.
// Centered X: (1145 - 550) / 2 = 297.5

const leftDrawing = `
  <g transform="translate(297, 2.5)">
    <!-- Body Outline -->
    <path d="M20,120 L5,95 L30,70 L140,40 L200,20 L280,5 L420,5 L490,25 L520,55 L530,80 L545,90 L545,100 L530,105 L520,120 L510,140 L430,145 
             A 40 40 0 0 0 340 145 L210,145 
             A 45 45 0 0 0 110 145 L20,140 Z"/>
    <!-- Door Lines -->
    <path d="M210,50 L210,140 M340,48 L340,140"/>
    <!-- Windshield -->
    <path d="M200,22 L218,52 L280,8 L278,6"/>
    <!-- Rear window -->
    <path d="M490,26 L480,55 L516,56"/>
    <!-- Side window -->
    <path d="M218,10 L480,10 L480,52 L218,52 Z"/>
    <!-- Headlight / Taillight -->
    <rect x="15" y="75" width="35" height="18"/>
    <rect x="505" y="88" width="30" height="18"/>
    <!-- Wheels -->
    <circle cx="175" cy="130" r="38"/>
    <circle cx="175" cy="130" r="22"/>
    <circle cx="400" cy="130" r="38"/>
    <circle cx="400" cy="130" r="22"/>
  </g>
`;

const rightDrawing = `
  <g transform="translate(297, 2.5)">
    <!-- Body Outline (Flipped horizontally around center 275) -->
    <g transform="translate(550, 0) scale(-1, 1)">
      <path d="M20,120 L5,95 L30,70 L140,40 L200,20 L280,5 L420,5 L490,25 L520,55 L530,80 L545,90 L545,100 L530,105 L520,120 L510,140 L430,145 
               A 40 40 0 0 0 340 145 L210,145 
               A 45 45 0 0 0 110 145 L20,140 Z"/>
      <path d="M210,50 L210,140 M340,48 L340,140"/>
      <path d="M200,22 L218,52 L280,8 L278,6"/>
      <path d="M490,26 L480,55 L516,56"/>
      <path d="M218,10 L480,10 L480,52 L218,52 Z"/>
      <rect x="15" y="75" width="35" height="18"/>
      <rect x="505" y="88" width="30" height="18"/>
      <circle cx="175" cy="130" r="38"/>
      <circle cx="175" cy="130" r="22"/>
      <circle cx="400" cy="130" r="38"/>
      <circle cx="400" cy="130" r="22"/>
    </g>
  </g>
`;

// Front/Rear Plane: 2.0 x 0.28 (Aspect: 7.14)
// ViewBox: 857 x 120
// Drawing width: ~180. Centered X: (857 - 180) / 2 = 338.5
const frontDrawing = `
  <g transform="translate(338.5, 5)">
    <path d="M15,110 L10,90 L20,50 L60,20 L100,15 L140,20 L180,50 L190,90 L185,110 Z"/>
    <path d="M35,22 L165,22 L160,48 L40,48 Z"/>
    <rect x="20" y="55" width="35" height="20"/>
    <rect x="145" y="55" width="35" height="20"/>
    <path d="M60,78 L140,78 L140,100 L60,100 Z"/>
    <path d="M10,110 A 28 28 0 0 1 66,110"/>
    <path d="M134,110 A 28 28 0 0 1 190,110"/>
  </g>
`;

const rearDrawing = `
  <g transform="translate(338.5, 5)">
    <path d="M15,110 L10,90 L15,55 L55,20 L145,20 L185,55 L190,90 L185,110 Z"/>
    <path d="M40,22 L160,22 L155,46 L45,46 Z"/>
    <rect x="18" y="52" width="35" height="20"/>
    <rect x="147" y="52" width="35" height="20"/>
    <rect x="30" y="16" width="140" height="8"/>
    <circle cx="80" cy="108" r="8"/>
    <circle cx="120" cy="108" r="8"/>
    <rect x="40" y="95" width="120" height="15"/>
  </g>
`;

// Top Plane: 2.1 x 4.2 (Aspect: 0.5)
// ViewBox: 200 x 400
// Drawing width: ~150, height ~350.
// Centered X: 25, Y: 25.
// Note: we will change PlayerCar to map this correctly.
const topDrawing = `
  <g transform="translate(25, 25) scale(1, 2.3)">
    <!-- Top profile drawing. Scaled in Y to match the length of the car better -->
    <path d="M40,5 Q90,0 140,5 L150,15 L160,120 L155,145 Q100,155 45,145 L40,120 L50,15 Z"/>
    <ellipse cx="100" cy="75" rx="45" ry="55"/>
    <line x1="50" y1="15" x2="150" y2="15"/>
    <line x1="55" y1="30" x2="145" y2="30"/>
    <rect x="35" y="140" width="130" height="10"/>
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

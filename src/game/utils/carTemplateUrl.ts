import type { TemplateView } from '../../types';

// Left/Right Plane: 4.2 x 0.55 (Aspect: 7.636)
// Left View SVG: We want the viewBox to be 1145 x 150
// The car drawing fits in ~550 x 145.
// Centered X: (1145 - 550) / 2 = 297.5

const leftDrawing = `
  <g transform="translate(297, -10)">
    <!-- Main Body Profile -->
    <path d="M 20,110 C 20,90 35,70 60,60 L 150,45 C 190,40 230,15 280,15 L 360,15 C 410,15 470,30 500,45 L 530,65 C 540,75 545,90 545,100 L 540,120 L 525,135 L 430,135 A 45 45 0 0 0 340,135 L 210,135 A 45 45 0 0 0 120,135 L 20,130 Z" fill="none" stroke="#1A1A1A" stroke-width="3"/>
    
    <!-- Windows -->
    <path d="M 230,22 C 260,18 320,18 360,18 C 400,18 450,28 470,42 L 470,48 L 225,48 Z" fill="#E8ECEF" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 350,18 L 350,48" stroke="#1A1A1A" stroke-width="3"/> <!-- B-Pillar -->

    <!-- Door Lines -->
    <path d="M 210,48 L 205,135" stroke="#1A1A1A" stroke-width="1.5"/>
    <path d="M 350,48 L 360,135" stroke="#1A1A1A" stroke-width="1.5"/>
    <path d="M 120,60 L 120,100" stroke="#1A1A1A" stroke-width="1.5"/>
    
    <!-- Door Handle -->
    <rect x="300" y="55" width="25" height="6" rx="3" fill="#ffffff" stroke="#1A1A1A" stroke-width="1.5"/>

    <!-- Headlight & Taillight -->
    <path d="M 25,75 L 55,70 L 55,85 L 25,85 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 525,80 L 543,85 L 540,95 L 525,90 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Spoiler -->
    <path d="M 500,45 L 530,35 L 535,40 L 520,48" fill="none" stroke="#1A1A1A" stroke-width="2"/>

    <!-- Side Skirt -->
    <path d="M 210,130 L 340,130" stroke="#1A1A1A" stroke-width="2"/>

    <!-- Wheels -->
    <circle cx="165" cy="135" r="40" fill="#ffffff" stroke="#1A1A1A" stroke-width="4"/>
    <circle cx="165" cy="135" r="28" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
    <circle cx="165" cy="135" r="10" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
    
    <circle cx="385" cy="135" r="40" fill="#ffffff" stroke="#1A1A1A" stroke-width="4"/>
    <circle cx="385" cy="135" r="28" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
    <circle cx="385" cy="135" r="10" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
    
    <!-- Spoke lines -->
    <line x1="165" y1="107" x2="165" y2="125" stroke="#1A1A1A" stroke-width="1.5"/>
    <line x1="165" y1="163" x2="165" y2="145" stroke="#1A1A1A" stroke-width="1.5"/>
    <line x1="137" y1="135" x2="155" y2="135" stroke="#1A1A1A" stroke-width="1.5"/>
    <line x1="193" y1="135" x2="175" y2="135" stroke="#1A1A1A" stroke-width="1.5"/>
    
    <line x1="385" y1="107" x2="385" y2="125" stroke="#1A1A1A" stroke-width="1.5"/>
    <line x1="385" y1="163" x2="385" y2="145" stroke="#1A1A1A" stroke-width="1.5"/>
    <line x1="357" y1="135" x2="375" y2="135" stroke="#1A1A1A" stroke-width="1.5"/>
    <line x1="413" y1="135" x2="395" y2="135" stroke="#1A1A1A" stroke-width="1.5"/>
  </g>
`;

const rightDrawing = `
  <g transform="translate(297, -10)">
    <g transform="translate(550, 0) scale(-1, 1)">
      <!-- Duplicate of left side, flipped -->
      <path d="M 20,110 C 20,90 35,70 60,60 L 150,45 C 190,40 230,15 280,15 L 360,15 C 410,15 470,30 500,45 L 530,65 C 540,75 545,90 545,100 L 540,120 L 525,135 L 430,135 A 45 45 0 0 0 340,135 L 210,135 A 45 45 0 0 0 120,135 L 20,130 Z" fill="none" stroke="#1A1A1A" stroke-width="3"/>
      <path d="M 230,22 C 260,18 320,18 360,18 C 400,18 450,28 470,42 L 470,48 L 225,48 Z" fill="#E8ECEF" stroke="#1A1A1A" stroke-width="2"/>
      <path d="M 350,18 L 350,48" stroke="#1A1A1A" stroke-width="3"/>
      <path d="M 210,48 L 205,135" stroke="#1A1A1A" stroke-width="1.5"/>
      <path d="M 350,48 L 360,135" stroke="#1A1A1A" stroke-width="1.5"/>
      <path d="M 120,60 L 120,100" stroke="#1A1A1A" stroke-width="1.5"/>
      <rect x="300" y="55" width="25" height="6" rx="3" fill="#ffffff" stroke="#1A1A1A" stroke-width="1.5"/>
      <path d="M 25,75 L 55,70 L 55,85 L 25,85 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
      <path d="M 525,80 L 543,85 L 540,95 L 525,90 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
      <path d="M 500,45 L 530,35 L 535,40 L 520,48" fill="none" stroke="#1A1A1A" stroke-width="2"/>
      <path d="M 210,130 L 340,130" stroke="#1A1A1A" stroke-width="2"/>
      <circle cx="165" cy="135" r="40" fill="#ffffff" stroke="#1A1A1A" stroke-width="4"/>
      <circle cx="165" cy="135" r="28" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
      <circle cx="165" cy="135" r="10" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
      <circle cx="385" cy="135" r="40" fill="#ffffff" stroke="#1A1A1A" stroke-width="4"/>
      <circle cx="385" cy="135" r="28" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
      <circle cx="385" cy="135" r="10" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
      <line x1="165" y1="107" x2="165" y2="125" stroke="#1A1A1A" stroke-width="1.5"/>
      <line x1="165" y1="163" x2="165" y2="145" stroke="#1A1A1A" stroke-width="1.5"/>
      <line x1="137" y1="135" x2="155" y2="135" stroke="#1A1A1A" stroke-width="1.5"/>
      <line x1="193" y1="135" x2="175" y2="135" stroke="#1A1A1A" stroke-width="1.5"/>
      <line x1="385" y1="107" x2="385" y2="125" stroke="#1A1A1A" stroke-width="1.5"/>
      <line x1="385" y1="163" x2="385" y2="145" stroke="#1A1A1A" stroke-width="1.5"/>
      <line x1="357" y1="135" x2="375" y2="135" stroke="#1A1A1A" stroke-width="1.5"/>
      <line x1="413" y1="135" x2="395" y2="135" stroke="#1A1A1A" stroke-width="1.5"/>
    </g>
  </g>
`;

const frontDrawing = `
  <g transform="translate(338.5, 5)">
    <!-- Mirrors -->
    <path d="M 5,45 L -5,35 L -5,25 L 15,35 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 175,45 L 185,35 L 185,25 L 165,35 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>

    <!-- Body Outline -->
    <path d="M 15,110 C 10,90 10,60 20,50 L 50,20 L 130,20 L 160,50 C 170,60 170,90 165,110 Z" fill="none" stroke="#1A1A1A" stroke-width="3"/>
    
    <!-- Windshield -->
    <path d="M 30,22 L 150,22 L 140,48 L 40,48 Z" fill="#E8ECEF" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Headlights -->
    <path d="M 20,55 L 60,65 L 55,75 L 15,65 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 160,55 L 120,65 L 125,75 L 165,65 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Lower Grille & Vents -->
    <path d="M 50,85 L 130,85 L 140,110 L 40,110 Z" fill="none" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 20,90 L 35,90 L 30,105 L 15,105 Z" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
    <path d="M 160,90 L 145,90 L 150,105 L 165,105 Z" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>

    <!-- Hood Lines -->
    <path d="M 40,48 C 50,55 50,65 50,85" stroke="#1A1A1A" stroke-width="1.5" fill="none"/>
    <path d="M 140,48 C 130,55 130,65 130,85" stroke="#1A1A1A" stroke-width="1.5" fill="none"/>
    
    <!-- Tires visible from front -->
    <path d="M 5,110 A 15 15 0 0 1 35,110" stroke="#1A1A1A" stroke-width="2" fill="none"/>
    <path d="M 145,110 A 15 15 0 0 1 175,110" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  </g>
`;

const rearDrawing = `
  <g transform="translate(338.5, 5)">
    <!-- Mirrors -->
    <path d="M 5,45 L -5,35 L -5,25 L 15,35 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 175,45 L 185,35 L 185,25 L 165,35 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>

    <!-- Body Outline -->
    <path d="M 15,110 C 10,90 10,60 20,50 L 50,20 L 130,20 L 160,50 C 170,60 170,90 165,110 Z" fill="none" stroke="#1A1A1A" stroke-width="3"/>
    
    <!-- Rear Window -->
    <path d="M 35,22 L 145,22 L 135,46 L 45,46 Z" fill="#E8ECEF" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Taillights -->
    <path d="M 15,55 L 70,55 L 70,65 L 15,65 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 165,55 L 110,55 L 110,65 L 165,65 Z" fill="#ffffff" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Spoiler -->
    <path d="M 25,10 L 155,10 L 155,15 L 25,15 Z" fill="none" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 40,15 L 40,20" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M 140,15 L 140,20" stroke="#1A1A1A" stroke-width="2"/>

    <!-- License Plate & Bumper -->
    <rect x="65" y="75" width="50" height="20" rx="2" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
    <path d="M 15,95 L 165,95" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Exhausts -->
    <circle cx="40" cy="105" r="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>
    <circle cx="140" cy="105" r="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>

    <!-- Tires visible from rear -->
    <path d="M 5,110 A 15 15 0 0 1 35,110" stroke="#1A1A1A" stroke-width="2" fill="none"/>
    <path d="M 145,110 A 15 15 0 0 1 175,110" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  </g>
`;

const topDrawing = `
  <g transform="translate(25, 25) scale(1, 2.3)">
    <!-- Main Body Shape -->
    <path d="M 40,5 C 60,0 90,0 110,5 C 130,10 140,20 145,40 L 150,110 C 150,130 130,145 110,148 C 90,150 60,150 40,148 C 20,145 0,130 0,110 L 5,40 C 10,20 20,10 40,5 Z" fill="none" stroke="#1A1A1A" stroke-width="3"/>
    
    <!-- Windshield -->
    <path d="M 25,45 C 50,40 100,40 125,45 C 120,60 110,65 75,65 C 40,65 30,60 25,45 Z" fill="#E8ECEF" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Rear Window -->
    <path d="M 35,115 C 50,110 100,110 115,115 C 110,105 100,100 75,100 C 50,100 40,105 35,115 Z" fill="#E8ECEF" stroke="#1A1A1A" stroke-width="2"/>

    <!-- Roof -->
    <path d="M 30,65 C 50,60 100,60 120,65 L 110,100 C 100,95 50,95 40,100 Z" fill="none" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Hood Vents & Lines -->
    <path d="M 40,5 C 50,20 50,40 50,40" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
    <path d="M 110,5 C 100,20 100,40 100,40" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
    <rect x="65" y="15" width="20" height="5" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>

    <!-- Spoiler -->
    <rect x="25" y="140" width="100" height="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>
    
    <!-- Mirrors -->
    <rect x="-5" y="55" width="10" height="15" rx="3" fill="none" stroke="#1A1A1A" stroke-width="2"/>
    <rect x="145" y="55" width="10" height="15" rx="3" fill="none" stroke="#1A1A1A" stroke-width="2"/>
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

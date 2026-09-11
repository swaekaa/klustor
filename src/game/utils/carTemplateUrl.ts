// ============================================================
// carTemplateUrl.ts — Returns the URL of the car template image
// ============================================================

import type { TemplateView } from '../../types';

// We now use pure blank rectangular SVGs mapped to the dimensions of the 3D car's surfaces.
// This allows the user to paint the entire face.

const SVGS: Record<TemplateView, string> = {
  left: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="135"><rect width="100%" height="100%" fill="#ffffff"/></svg>'), // 3.6 x 0.55 ratio approx
  right: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="135"><rect width="100%" height="100%" fill="#ffffff"/></svg>'),
  front: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="140"><rect width="100%" height="100%" fill="#ffffff"/></svg>'), // 2.0 x 0.55
  rear: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="140"><rect width="100%" height="100%" fill="#ffffff"/></svg>'),
  top: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="525" height="1050"><rect width="100%" height="100%" fill="#ffffff"/></svg>'), // 2.1 x 4.2
};

export const CAR_TEMPLATE_URL = SVGS.left; // default

export async function getCarTemplateUrl(view: TemplateView = 'left'): Promise<string> {
  return SVGS[view];
}


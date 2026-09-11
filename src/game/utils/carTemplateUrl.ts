// ============================================================
// carTemplateUrl.ts — Returns the URL of the car template image
// ============================================================

export const CAR_TEMPLATE_URL = '/car-template.svg';

export async function getCarTemplateUrl(): Promise<string> {
  return CAR_TEMPLATE_URL;
}


# Goal Description

The objective is to completely overhaul the existing "Cyberpunk / Neon-Noir" UI to match the 2008-era **GTA IV / Xbox 360 Dashboard** aesthetic. This means transitioning from dark, scanline-heavy, neon-glowing layouts to a bright, sleek, translucent "blade" menu system with warm colors, glossy gradients, and character-driven background art.

## User Review Required

> [!IMPORTANT]
> **Major Design Pivot**: This change will strip away the current neon colors (cyan, pink, green) and the CRT scanline effects. The new aesthetic will heavily utilize white, grey, amber, and deep orange tones. 

> [!WARNING]
> **Background Artwork**: The reference image features Grand Theft Auto character artwork as the background. Since I cannot pull copyrighted images, I will generate an original GTA-style character artwork to use as the global game background using my image generation tool. Do you approve of this?

## Proposed Changes

### CSS Architecture (`src/index.css`)
I will rewrite the global design tokens:
- **Colors**: Remove all `--neon-*` variables. Introduce `--xbox-white`, `--xbox-grey`, `--gta-amber`, `--gta-dark`.
- **Background**: Remove the CRT scanlines and film grain. Replace with a full-screen, fixed, high-quality GTA-style background image with a soft gradient overlay.
- **Panels**: Update `.panel` to use bright, translucent glassmorphism (e.g., `rgba(255, 255, 255, 0.4)` with heavy blur and rounded corners).
- **Typography**: 
  - Switch UI text from `JetBrains Mono` to a clean, rounded sans-serif (e.g., `Segoe UI`, `Arial`, or `Trebuchet MS` to mimic the Xbox 360 dash).
  - Keep a bold display font for headers.
- **Buttons / Menus**: Style buttons as pill-shaped, glossy elements. For list menus, I will replicate the segmented horizontal line separators seen in the reference image.

### [MODIFY] NavBar (`src/components/ui/NavBar.tsx`)
- Change the top navigation from a dark bar into the Xbox 360 "Blades" style (large, rounded tabs overlapping the top edge).
- Update the bottom HUD to look like the contextual button prompts at the bottom of the Xbox screen (e.g., `[A] Select`, `[B] Back`, though mapped to our game actions).

### [MODIFY] Landing, Board, Editor Pages
- Update the layout containers to use the new translucent, rounded panel styling.
- Convert hard-edged grids into smooth, padded lists.

## Verification Plan

### Manual Verification
1. Visually inspect the Landing Page, Job Board, and Editor Page to ensure the new CSS tokens are applied consistently.
2. Confirm the transparency effects look authentic over the new background artwork.
3. Ensure no text is unreadable due to contrast issues with the lighter aesthetic.

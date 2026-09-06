# KLUSTOR: Miami Vice City Overhaul & Mechanics Upgrade

This plan details the massive visual redesign to the "Miami/GTA VI-inspired" aesthetic, the rebranding to "KLUSTOR", and the major gameplay fix for accurate clue detection using a custom Investigation Scanner over the Unlayer Image Editor.

## Proposed Changes

### 1. Rebranding & Global Styling
- **Rebranding:** Update all titles, metadata, and navbar headers to use "KLUSTOR" and "VICE CITY INVESTIGATIONS".
- **Color Palette & Visuals:** Update `src/index.css` to feature a Miami sunset/neon-noir palette (electric cyan, hot pink, sunset orange, deep navy). We will add palm silhouettes, neon glow effects, and a more polished, cinematic gradient background instead of a flat dark theme.
- **Typography:** Ensure `Bebas Neue` and other display fonts are used prominently for case files and headers.

### 2. Gameplay Fix: Accurate Clue Detection
- **Data Model:** Update `ClueZone` in `src/types/index.ts` to include precise `x, y, width, height` percentage values for coordinates (0-100%).
- **Case Data (`case017.ts`):** Map out precise percentage bounding boxes for all clues across the 5 evidence images. 
- **Investigation Scanner (`EditorPage.tsx`):** Since Unlayer's API doesn't expose semantic crop coordinates on save, we will build a "Game-Side Investigation Scanner". 
  - The player will use the Unlayer editor to enhance the image (e.g., brightness, contrast, crop to zoom).
  - When they are ready to identify a clue, they will click an "Analyze Region" button which places a transparent overlay over the image container. 
  - They drag a bounding box over the anomaly.
  - The application calculates the **Intersection over Union (IoU)** of their selection against the predefined `ClueZone` coordinates.
  - If IoU > threshold (e.g., 0.30), the clue is discovered. Otherwise, they get a "Nothing conclusive" message.

### 3. Miami Evidence Images
- **AI Generated Assets:** I will use my AI image generation tool to create 5 stunning, original, non-copyrighted Miami-inspired evidence images:
  1. Ocean Drive at night (with black sedan)
  2. Neon parking garage (with black SUV, duffel bag, blurry figure)
  3. Nightclub Entrance (The Velvet Pier, with red jacket suspect)
  4. Santeria Lane Alley (Cracked phone, muddy footprints, graffiti)
  5. Security Camera still (Grainy CCTV with suspect face and plate)

### 4. New Components & Pages
- **Map Page (`src/pages/MapPage.tsx`):** A stylized fictional coastal city map showing Ocean Drive, Little Havana, Nightclub Row, etc.
- **Contacts Panel (`src/components/ui/ContactsSidebar.tsx`):** A slide-out or simple page showing contacts like Maya Rivera and Dante Cross.
- **Evidence Board (`src/pages/BoardPage.tsx`):** Redesigned to look like a physical/neon detective wall with strings connecting polaroids and notes.

### 5. AI Assistant integration
- **AI Panel:** Add a contextual hints panel in the editor sidebar that gives pre-defined hints without explicitly giving away the coordinates.

---

## User Review Required

> [!IMPORTANT]
> 1. **Scanner UI Approach:** Because Unlayer doesn't expose the actual crop bounds in its callback, I am implementing the "Scanner Overlay" approach you suggested. The player edits in Unlayer, then activates the Scanner to draw a box and submit it. Does this flow work for you?
> 2. **Generated Assets:** I will automatically generate 5 new Miami-style evidence images using my built-in image generator to replace the current placeholders. Are you okay with me generating and replacing these images?

Please approve this plan to begin execution!

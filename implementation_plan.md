# KLUSTOR Visual Redesign: 2000s Retro Console x Miami

The goal is to completely redesign the frontend to look like a lost 2000s console game menu set in Miami, moving away from the modern SaaS/dashboard aesthetic. 

## Proposed Changes

### Global Design System (`src/index.css`)
- **[MODIFY] `src/index.css`**
  - Implement the new pastel palette (Cream, Warm White, Pastel Blue, Cyan, Green, Peach, Pink, Yellow, Dark Navy).
  - Add retro CRT effects (subtle scanlines, noise, chromatic aberration) via CSS filters or pseudo-elements.
  - Define new console shape language variables (beveled edges, physical button shadows, inner glows).
  - Update typography rules (clean, bold, industrial sans-serif).

### Layout and Navigation (`src/components/ui/NavBar.tsx`)
- **[MODIFY] `src/components/ui/NavBar.tsx`**
  - Redesign as a horizontal console dashboard (e.g., Xbox 360 blades or PS2 menu).
  - Add physical selection states (scale, pastel highlight, inner shadow).
  - Implement a new "KLUSTOR" stylized logo housing (cream plastic with bevel).
  - Create a cohesive bottom HUD for Cash, Rep, and Heat.

### Landing Page (`src/pages/LandingPage.tsx`)
- **[MODIFY] `src/pages/LandingPage.tsx`**
  - Convert to a full-screen game menu (Start Story, Free Play, Options).
  - Add boot-up sequence animations.
  - Ensure the Miami background works harmoniously with the menu text.

### Job Board (`src/pages/CasePage.tsx` & `BoardPage.tsx`)
- **[MODIFY] `src/pages/CasePage.tsx`**
  - Redesign the mission selector to resemble an early 2000s list or grid (e.g., GTA mission select).
  - Style locked and unlocked states clearly with pastel gray/blue and lock icons.
- **[MODIFY] `src/pages/BoardPage.tsx`** (The Wall)
  - Style as a retro game gallery (polaroids, memory album) on a pastel background.

### City Map & Contacts (`src/pages/MapPage.tsx`, `ContactsPage.tsx`)
- **[MODIFY] `src/pages/MapPage.tsx`**
  - Style the map with stylized markers (circular, pulsing).
- **[MODIFY] `src/pages/ContactsPage.tsx`**
  - Redesign as an in-game phonebook with retro framed portraits.

### Editor Page (`src/pages/EditorPage.tsx`)
- **[MODIFY] `src/pages/EditorPage.tsx`**
  - Keep the Unlayer editor untouched but frame it in a "2000s Game Workstation" UI.
  - Left Panel: Redesign as a physical game instruction screen with numbered lists.
  - Right Panel: Redesign as a retro status screen (System Checks, Payment, Delivery).
  - Buttons: Use physical, circular control language.

### Components & Microinteractions
- **[MODIFY] Various Components**
  - Update all buttons to have physical interactions (hover/active movements, borders).
  - Add subtle screen transitions (300-700ms) with text like "CONNECTING...".
  - Ensure robust focus states for accessibility.

## Verification Plan

### Automated Tests
- Build verification: `npm run build`
- Dev server tests: `npm run dev`

### Manual Verification
- Test all user flows from Landing -> Job Board -> Client Call -> Editor -> Delivery -> Portfolio.
- Ensure Unlayer loads, edits, saves, and delivers successfully.
- Verify state updates (payment, rep) and local storage persistence.
- Test responsiveness at 1440x900 and 1280x720 to ensure the Fixer Lab and Editor remain highly usable without overlapping.
- Check all error and loading states for visual consistency.

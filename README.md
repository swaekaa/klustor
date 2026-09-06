# THE PHOTO NEVER LIES

> One photo. Multiple stories. Your choices change what happens next.

**THE PHOTO NEVER LIES** is an interactive narrative investigation game set in the fictional neon-coastal city of Vice City. Built for the **Build with React Image Editor Challenge**.

---

## 🎮 Concept

You play an independent investigator who receives mysterious photographs connected to crimes, scandals, and disappearances. The twist: **the image editor IS the gameplay.**

Instead of simply uploading and downloading an image, you **inspect evidence** using the Unlayer React Image Editor:
- Crop suspicious regions to isolate details
- Draw circles around objects of interest
- Add arrows and text as investigator notes
- Apply filters to reveal hidden information
- The results of your investigation unlock clues, suspects, locations, and story progression

---

## ✨ Features

- 🔍 **5 original evidence photographs** — neon-noir coastal city scenes
- 🎨 **Unlayer React Image Editor** integrated as the core investigation mechanic
- 🗺️ **Evidence Board** — visual node graph of discovered connections
- 📖 **Branching narrative** — 4 decisions, 4 different endings
- 🏆 **Player progression** — Reputation and Heat stats
- 💾 **Persistent edits** — your annotated images appear on the final results screen
- 🎬 **Cinematic UI** — neon-noir design, film grain, CRT scanlines, Framer Motion animations

---

## 🖼️ Why React Image Editor?

The [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor) is central to the experience, not a secondary feature:

```
RAW EVIDENCE PHOTO
        ↓
USER OPENS UNLAYER REACT IMAGE EDITOR
        ↓
USER CROPS / DRAWS / ANNOTATES THE PHOTO
        ↓
USER CLICKS SAVE
        ↓
THE GAME RESPONDS — CLUE DISCOVERY ANIMATION
        ↓
EVIDENCE BOARD UPDATES WITH NEW CONNECTIONS
        ↓
EDITED IMAGE PERSISTS TO THE FINAL RESULTS SCREEN
```

This creates the sensation of a real detective investigation tool, not a generic photo editor.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Routing | React Router v6 |
| Animations | Framer Motion |
| State | Zustand (with localStorage persistence) |
| **Image Editor** | **@unlayer/react-image-editor (official)** |
| Styling | Vanilla CSS with custom design tokens |

---

## 🎭 Gameplay Flow

1. **Landing** — cinematic intro with animated city silhouette
2. **Case Dashboard** — evidence grid, investigation stats, player progression
3. **Evidence Viewer** — cinematic photo display with metadata and clue hints
4. **Investigation** — **Unlayer Image Editor** opens; crop, annotate, save
5. **Clue Discovery** — save triggers clue selection + cinematic reveal animation
6. **Evidence Board** — growing node graph of discovered connections
7. **Decision** — choose: Report / Publish / Sell / Dig Deeper
8. **Results** — outcome narrative, score, and your annotated photos

---

## 🚀 Running Locally

```bash
# Clone
git clone https://github.com/your-username/the-photo-never-lies
cd the-photo-never-lies

# Install dependencies
npm install

# Add evidence images (see below)
# Copy the 5 evidence photos to /public/evidence/

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🖼️ Evidence Images

Place the following images in `/public/evidence/`:

| Filename | Scene |
|---|---|
| `ocean-drive.jpg` | Ocean Drive night street (Evidence 01) |
| `parking-garage.jpg` | Harbor Street parking garage (Evidence 02) |
| `nightclub.jpg` | The Velvet Pier nightclub entrance (Evidence 03) |
| `alley.jpg` | Santeria Lane alley (Evidence 04) |
| `security-cam.jpg` | Security camera still (Evidence 05) |

> If images are missing, the app falls back to `picsum.photos` placeholder images automatically.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `VITE_AI_API_KEY` | No | Optional AI assistant API key |
| `VITE_AI_PROVIDER` | No | AI provider (`gemini` or `openai`) |

The app works **fully without any AI credentials**. The AI assistant feature uses deterministic fallback responses if no key is provided.

---

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Drag /dist folder to app.netlify.com
```

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── ui/           # NavBar, buttons, badges
│   ├── evidence/     # EvidenceCard
│   ├── editor/       # InvestigationEditor (Unlayer wrapper)
│   ├── board/        # Evidence board nodes
│   └── clues/        # ClueReveal animation
├── pages/
│   ├── LandingPage
│   ├── CasePage
│   ├── EvidencePage
│   ├── EditorPage    ← Core: Unlayer editor here
│   ├── BoardPage
│   ├── DecisionPage
│   └── ResultsPage
├── data/
│   └── cases/case017.ts   ← Full case configuration
├── store/
│   └── gameStore.ts       ← Zustand global state
└── types/index.ts
```

---

## 🖊️ Adding New Cases

The data model is designed for extensibility. Add a new file at `src/data/cases/case018.ts` following the same structure as `case017.ts`. No application code needs to change — just register it in the store.

---

## 🔗 Credits

- **Image Editor:** [Unlayer React Image Editor](https://github.com/unlayer/react-image-editor) — [Documentation](https://docs.unlayer.com/builder/latest/images/image-editor)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State:** [Zustand](https://github.com/pmndrs/zustand)
- **Fonts:** [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) · [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) · [Inter](https://fonts.google.com/specimen/Inter)
- **Built for:** [Build with React Image Editor Challenge](https://github.com/unlayer/react-image-editor)

---

## ⚠️ Legal Notice

This project is an original creative work inspired by the **neon-noir coastal thriller** genre. It does not use, reproduce, or reference any assets, characters, logos, maps, or copyrighted material from Rockstar Games or the Grand Theft Auto franchise. All fictional branding (Vice City Investigations, The Velvet Pier, Ocean Drive, etc.) is original.

---

*THE PHOTO NEVER LIES — Vice City Investigations — Case 017*

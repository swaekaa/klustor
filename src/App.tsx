import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import CasePage from './pages/CasePage';
import EvidencePage from './pages/EvidencePage';
import EditorPage from './pages/EditorPage';
import BoardPage from './pages/BoardPage';
import MapPage from './pages/MapPage';
import ContactsPage from './pages/ContactsPage';
import NavBar from './components/ui/NavBar';
import { useGameStore } from './store/gameStore';

// Inner component that can access router context
function AppRoutes() {
  const location = useLocation();
  const activeJobId = useGameStore((s) => s.activeJobId);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Landing — no nav */}
        <Route path="/" element={<LandingPage />} />

        {/* Case hub / Job Board */}
        <Route
          path="/case"
          element={
            <>
              <NavBar />
              <CasePage />
            </>
          }
        />

        {/* Evidence viewer / Briefing */}
        <Route
          path="/evidence/:id"
          element={
            <>
              <NavBar />
              <EvidencePage />
            </>
          }
        />

        {/* Editor / Fixer Lab */}
        <Route
          path="/editor/:id"
          element={
            <>
              <NavBar />
              <EditorPage />
            </>
          }
        />

        {/* Evidence board / The Wall */}
        <Route
          path="/board"
          element={
            <>
              <NavBar />
              <BoardPage />
            </>
          }
        />

        {/* Map */}
        <Route
          path="/map"
          element={
            <>
              <NavBar />
              <MapPage />
            </>
          }
        />

        {/* Contacts */}
        <Route
          path="/contacts"
          element={
            <>
              <NavBar />
              <ContactsPage />
            </>
          }
        />



        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

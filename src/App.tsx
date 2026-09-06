import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import CasePage from './pages/CasePage';
import EvidencePage from './pages/EvidencePage';
import EditorPage from './pages/EditorPage';
import BoardPage from './pages/BoardPage';
import DecisionPage from './pages/DecisionPage';
import ResultsPage from './pages/ResultsPage';
import MapPage from './pages/MapPage';
import ContactsPage from './pages/ContactsPage';
import NavBar from './components/ui/NavBar';
import { useGameStore } from './store/gameStore';

// Inner component that can access router context
function AppRoutes() {
  const location = useLocation();
  const currentCaseId = useGameStore((s) => s.currentCaseId);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Landing — no nav */}
        <Route path="/" element={<LandingPage />} />

        {/* Case hub */}
        <Route
          path="/case"
          element={
            currentCaseId ? (
              <>
                <NavBar />
                <CasePage />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Evidence viewer */}
        <Route
          path="/evidence/:id"
          element={
            currentCaseId ? (
              <>
                <NavBar />
                <EvidencePage />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Editor — the core Unlayer screen */}
        <Route
          path="/editor/:id"
          element={
            currentCaseId ? (
              <>
                <NavBar />
                <EditorPage />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Evidence board */}
        <Route
          path="/board"
          element={
            currentCaseId ? (
              <>
                <NavBar />
                <BoardPage />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Map */}
        <Route
          path="/map"
          element={
            currentCaseId ? (
              <>
                <NavBar />
                <MapPage />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Contacts */}
        <Route
          path="/contacts"
          element={
            currentCaseId ? (
              <>
                <NavBar />
                <ContactsPage />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Decision */}
        <Route
          path="/decision"
          element={
            currentCaseId ? (
              <>
                <NavBar />
                <DecisionPage />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Results */}
        <Route
          path="/results"
          element={
            currentCaseId ? (
              <>
                <NavBar />
                <ResultsPage />
              </>
            ) : (
              <Navigate to="/" replace />
            )
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

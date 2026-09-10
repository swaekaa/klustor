import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CasePage from './pages/CasePage';
import EvidencePage from './pages/EvidencePage';
import EditorPage from './pages/EditorPage';
import BoardPage from './pages/BoardPage';
import MapPage from './pages/MapPage';
import ContactsPage from './pages/ContactsPage';
import Layout from './components/ui/Layout';
import { useGameStore } from './store/gameStore';

// Inner component that can access router context
function AppRoutes() {
  const location = useLocation();
  const activeJobId = useGameStore((s) => s.activeJobId);

  return (
    <Layout>
      <Routes location={location} key={location.pathname}>
        {/* Landing — no nav */}
        <Route path="/" element={<LandingPage />} />

        {/* Case hub / Job Board */}
        <Route path="/case" element={<CasePage />} />

        {/* Evidence viewer / Briefing */}
        <Route path="/evidence/:id" element={<EvidencePage />} />

        {/* Editor / Fixer Lab */}
        <Route path="/editor/:id" element={<EditorPage />} />

        {/* Evidence board / The Wall */}
        <Route path="/board" element={<BoardPage />} />

        {/* Map */}
        <Route path="/map" element={<MapPage />} />

        {/* Contacts */}
        <Route path="/contacts" element={<ContactsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

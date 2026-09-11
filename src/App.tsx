import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GaragePage from './pages/GaragePage';
import CustomizePage from './pages/CustomizePage';
import RacePage from './pages/RacePage';
import LeaderboardPage from './pages/LeaderboardPage';
import Layout from './components/ui/Layout';

function AppRoutes() {
  const location = useLocation();

  return (
    <Layout>
      <Routes location={location} key={location.pathname}>
        {/* Landing — no nav shell */}
        <Route path="/" element={<LandingPage />} />

        {/* Main hub */}
        <Route path="/garage" element={<GaragePage />} />

        {/* Livery editor — full screen */}
        <Route path="/customize" element={<CustomizePage />} />

        {/* 3D Race — full screen */}
        <Route path="/race" element={<RacePage />} />

        {/* Leaderboard */}
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Fallback → garage */}
        <Route path="*" element={<Navigate to="/garage" replace />} />
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

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import LandingPage from './pages/LandingPage';
import DesignPage from './pages/DesignPage';
import RacePage from './pages/RacePage';
import LeaderboardPage from './pages/LeaderboardPage';
import MultiplayerMenu from './pages/multiplayer/MultiplayerMenu';
import CreateRoom from './pages/multiplayer/CreateRoom';
import JoinRoom from './pages/multiplayer/JoinRoom';
import Lobby from './pages/multiplayer/Lobby';
import ChallengePage from './pages/multiplayer/ChallengePage';
import MultiplayerRace from './pages/multiplayer/MultiplayerRace';
import Results from './pages/multiplayer/Results';

function AppRoutes() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<DesignPage />} />
      <Route path="/design" element={<Navigate to="/" replace />} />
      <Route path="/race" element={<RacePage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/garage" element={<Navigate to="/" replace />} />
      
      {/* Multiplayer Routes */}
      <Route path="/multiplayer" element={<MultiplayerMenu />} />
      <Route path="/multiplayer/create" element={<CreateRoom />} />
      <Route path="/multiplayer/join" element={<JoinRoom />} />
      <Route path="/multiplayer/room/:roomCode" element={<Lobby />} />
      <Route path="/multiplayer/challenge/:roomCode" element={<ChallengePage />} />
      <Route path="/multiplayer/race/:roomCode" element={<MultiplayerRace />} />
      <Route path="/multiplayer/results/:roomCode" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[KLUSTOR] Global crash caught:', error, info);
  }

  handleReset = () => {
    localStorage.removeItem('klustor-racing-v2');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', textAlign: 'center' }}>
          <h1 className="font-display" style={{ fontSize: '2rem', color: '#FF4D4D', marginBottom: '1rem' }}>SYSTEM CRASH DETECTED</h1>
          <p className="font-mono" style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '600px' }}>
            A fatal error occurred. This is usually caused by corrupted save data from an older version of the game.
          </p>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left', width: '100%', maxWidth: '600px', overflowX: 'auto' }}>
            <code className="font-mono" style={{ fontSize: '0.8rem', color: '#FF4D4D' }}>
              {this.state.error?.toString()}
            </code>
          </div>
          <button 
            onClick={this.handleReset}
            style={{ padding: '1rem 2rem', background: '#FF4D4D', color: '#FFF', border: 'none', borderRadius: '999px', fontSize: '1.2rem', cursor: 'pointer', fontFamily: 'var(--font-display)' }}
          >
            HARD RESET SAVE DATA
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalErrorBoundary>
        <AppRoutes />
        <Analytics />
      </GlobalErrorBoundary>
    </BrowserRouter>
  );
}

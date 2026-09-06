import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { case017 } from '../data/cases/case017';
import { useState } from 'react';

export default function CasePage() {
  const navigate = useNavigate();
  const { currentCaseId, discoveredClues, player } = useGameStore();
  const [hoveredEvidence, setHoveredEvidence] = useState<string | null>(null);

  if (!currentCaseId || currentCaseId !== 'case-017') {
    return <div>No active case.</div>;
  }

  const caseData = case017;
  const totalClues = caseData.clues.length;
  const progress = (discoveredClues.length / totalClues) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        paddingTop: '40px',
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-primary)',
        backgroundImage: "url('/bg-landing.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', width: '100%', padding: '3rem' }}>
        
        {/* Left Column: Mission Select Details */}
        <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '1rem', letterSpacing: '0.1em', margin: '0 0 0.5rem 0' }}>CASE FILES</h3>
            <h1 className="font-display" style={{ fontSize: '4rem', lineHeight: 0.9, margin: 0, color: '#fff' }}>
              CASE {caseData.id.split('-')[1]}<br/>
              <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.7)' }}>{caseData.title}</span>
            </h1>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>STATUS</span>
              <span className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem' }}>ACTIVE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>EVIDENCE</span>
              <span className="font-mono" style={{ color: '#fff', fontSize: '0.8rem' }}>{caseData.evidence.length} / {caseData.evidence.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>CLUES</span>
              <span className="font-mono" style={{ color: '#fff', fontSize: '0.8rem' }}>{discoveredClues.length} / {totalClues}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>REPUTATION</span>
              <span className="font-mono" style={{ color: '#fff', fontSize: '0.8rem' }}>{player.reputation}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>HEAT</span>
              <span className="font-mono" style={{ color: 'var(--neon-red)', fontSize: '0.8rem' }}>{player.heat}%</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {caseData.briefing}
            </p>
          </div>

          <button 
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '1.5rem', padding: '1rem' }}
            onClick={() => navigate('/board')}
          >
            VIEW EVIDENCE BOARD
          </button>
        </div>

        {/* Right Column: Cinematic Evidence Thumbnails */}
        <div style={{ flex: 1, paddingLeft: '4rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '1rem' }}>
          {caseData.evidence.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setHoveredEvidence(ev.id)}
              onMouseLeave={() => setHoveredEvidence(null)}
              onClick={() => navigate(`/evidence/${ev.id}`)}
              style={{
                position: 'relative',
                height: '160px',
                background: `url(${ev.imageSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: hoveredEvidence === ev.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s',
                transform: hoveredEvidence === ev.id ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {/* Vignette */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 100%)' }} />
              
              <div style={{ position: 'absolute', inset: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  EVIDENCE #{String(i + 1).padStart(2, '0')} // {ev.timestamp}
                </div>
                <h3 className="font-display" style={{ fontSize: '2.5rem', color: '#fff', margin: 0, lineHeight: 1 }}>
                  {ev.title}
                </h3>
                <div className="font-mono" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                  {ev.location.toUpperCase()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { jobs } from '../data/jobs';
import { useState } from 'react';

export default function CasePage() {
  const navigate = useNavigate();
  const { player, unlockedJobs, completedJobs } = useGameStore();
  const [hoveredJob, setHoveredJob] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        paddingTop: '60px',
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
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,11,15,0.85)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', width: '100%', padding: '3rem' }}>
        
        {/* Left Column: Player Stats & Hub Info */}
        <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '1rem', letterSpacing: '0.1em', margin: '0 0 0.5rem 0' }}>THE FIXER HUB</h3>
            <h1 className="font-display" style={{ fontSize: '4rem', lineHeight: 0.9, margin: 0, color: '#fff' }}>
              JOB BOARD
            </h1>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>RANK</span>
              <span className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem' }}>{player.rank}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>JOBS COMPLETED</span>
              <span className="font-mono" style={{ color: '#fff', fontSize: '0.8rem' }}>{completedJobs.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>REPUTATION</span>
              <span className="font-mono" style={{ color: '#fff', fontSize: '0.8rem' }}>{player.reputation}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>CASH</span>
              <span className="font-mono" style={{ color: 'var(--neon-green)', fontSize: '0.8rem' }}>${player.cash.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <p className="font-mono" style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.85rem' }}>
              "You don't ask questions. You deliver." <br/><br/>
              Select a job from the board. High reputation unlocks better clients. Delivering exactly what they ask for pays the bills.
            </p>
          </div>

          <button 
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '1.5rem', padding: '1rem' }}
            onClick={() => navigate('/board')}
          >
            VIEW THE WALL
          </button>
        </div>

        {/* Right Column: Job List */}
        <div style={{ flex: 1, paddingLeft: '4rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '1rem' }}>
          {jobs.map((job, i) => {
            const isUnlocked = unlockedJobs.includes(job.id);
            const isCompleted = completedJobs.includes(job.id);
            
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onMouseEnter={() => setHoveredJob(job.id)}
                onMouseLeave={() => setHoveredJob(null)}
                onClick={() => {
                  if (isUnlocked) navigate(`/evidence/${job.id}`);
                }}
                style={{
                  position: 'relative',
                  height: '160px',
                  background: isUnlocked ? `url(${job.image})` : '#111',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: hoveredJob === job.id && isUnlocked ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  transform: hoveredJob === job.id && isUnlocked ? 'scale(1.02)' : 'scale(1)',
                  filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.5)'
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 100%)' }} />
                
                <div style={{ position: 'absolute', inset: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="font-mono" style={{ color: isCompleted ? 'var(--neon-green)' : isUnlocked ? 'var(--neon-cyan)' : 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    {isCompleted ? '✓ COMPLETED' : isUnlocked ? `AVAILABLE // PAYOUT $${job.payment.toLocaleString()}` : 'LOCKED'}
                  </div>
                  <h3 className="font-display" style={{ fontSize: '2.5rem', color: isUnlocked ? '#fff' : 'var(--text-muted)', margin: 0, lineHeight: 1 }}>
                    {isUnlocked ? job.title : 'UNKNOWN JOB'}
                  </h3>
                  <div className="font-mono" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                    {isUnlocked ? job.location.toUpperCase() : 'REQ: HIGHER REP'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

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
        paddingTop: '80px',
        minHeight: '100vh',
        display: 'flex',
      }}
    >
      {/* Blades overlay shadow */}
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 40px 100px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', width: '100%', padding: '3rem' }}>
        
        {/* Left Column: Player Stats & Hub Info */}
        <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 className="font-display" style={{ color: 'var(--gta-blue)', fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>THE FIXER HUB</h3>
            <h1 className="font-display" style={{ fontSize: '4.5rem', lineHeight: 0.9, margin: 0, color: 'var(--gta-black)', textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}>
              JOB BOARD
            </h1>
          </div>

          <div className="panel" style={{ padding: '2rem', border: 'none', background: 'rgba(255,255,255,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700 }}>RANK</span>
              <span className="font-display" style={{ color: 'var(--gta-blue)', fontSize: '1.1rem' }}>{player.rank}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700 }}>JOBS COMPLETED</span>
              <span className="font-display" style={{ color: 'var(--gta-black)', fontSize: '1.1rem' }}>{completedJobs.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="font-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700 }}>REPUTATION</span>
              <span className="font-display" style={{ color: 'var(--gta-black)', fontSize: '1.1rem' }}>{player.reputation}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="font-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700 }}>CASH</span>
              <span className="font-display" style={{ color: 'var(--xbox-green)', fontSize: '1.1rem' }}>${player.cash.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <p className="font-body" style={{ color: 'var(--gta-black)', lineHeight: 1.6, fontSize: '1rem', fontWeight: 500, background: 'rgba(255,255,255,0.3)', padding: '1rem', borderRadius: '8px' }}>
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
                  height: '180px',
                  background: isUnlocked ? `url(${job.image})` : '#e0e0e0',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '16px',
                  border: hoveredJob === job.id && isUnlocked ? '4px solid var(--xbox-green)' : '4px solid rgba(255,255,255,0.8)',
                  boxShadow: hoveredJob === job.id && isUnlocked ? '0 10px 30px rgba(126, 185, 0, 0.4)' : '0 4px 10px rgba(0,0,0,0.2)',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  transform: hoveredJob === job.id && isUnlocked ? 'scale(1.02)' : 'scale(1)',
                  filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.7)'
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 100%)' }} />
                
                <div style={{ position: 'absolute', inset: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="font-body" style={{ color: isCompleted ? 'var(--xbox-green)' : isUnlocked ? 'var(--gta-blue)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {isCompleted ? '✓ COMPLETED' : isUnlocked ? `AVAILABLE // PAYOUT $${job.payment.toLocaleString()}` : 'LOCKED'}
                  </div>
                  <h3 className="font-display" style={{ fontSize: '2.8rem', color: isUnlocked ? 'var(--gta-black)' : 'var(--text-secondary)', margin: 0, lineHeight: 1 }}>
                    {isUnlocked ? job.title : 'UNKNOWN JOB'}
                  </h3>
                  <div className="font-body" style={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 700 }}>
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

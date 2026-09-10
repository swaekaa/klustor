import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { jobs, clients } from '../data/jobs';

export default function EvidencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { acceptJob, unlockedJobs } = useGameStore();

  const job = jobs.find((j) => j.id === id);

  if (!job || !unlockedJobs.includes(job.id)) {
    return (
      <div className="page" style={{ paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: '3rem', color: 'var(--neon-red)' }}>LOCKED</div>
          <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => navigate('/case')}>← BACK TO HUB</button>
        </div>
      </div>
    );
  }

  const client = clients[job.clientId];

  const handleAcceptJob = () => {
    acceptJob(job.id);
    navigate(`/editor/${job.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 2rem'
      }}
    >
      <div style={{ paddingBottom: '4rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div>
            <div className="font-mono" style={{ color: 'var(--klustor-pink)', letterSpacing: '0.2em', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              [ INCOMING TRANSMISSION ]
            </div>
            <h1 className="font-display" style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>
              CLIENT CALL
            </h1>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/case')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem' }}>▲</span> BACK
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="panel"
          style={{
            background: 'var(--klustor-blue)',
            borderColor: 'var(--klustor-blue)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem 2rem',
            gap: '2rem'
          }}
        >
          {/* Portrait */}
          <div style={{
            width: '120px',
            height: '120px',
            background: 'var(--bg-panel-solid)',
            borderRadius: 'var(--radius-large)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--border-light)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 12px rgba(30,40,50,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)', zIndex: 2, pointerEvents: 'none' }} />
            <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 3, letterSpacing: '0.1em' }}>AUDIO</span>
          </div>

          {/* Client Info */}
          <div style={{ textAlign: 'center' }}>
            <h1 className="font-display" style={{ color: 'var(--text-primary)', fontSize: '2.5rem', margin: '0 0 0.5rem 0', lineHeight: 1 }}>
              {client.name}
            </h1>
            <div className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              {client.role.toUpperCase()}
            </div>
          </div>

          {/* Quote Bubble */}
          <div style={{
            background: 'var(--color-neutral)',
            padding: '1.5rem 2rem',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-light)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 8px rgba(30,40,50,0.05)',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <p className="font-body" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: 0, fontWeight: 500 }}>
              "{job.brief}"
            </p>
          </div>

          {/* Stats Bubbles */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{
              background: 'var(--color-success)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-light)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 4px 8px rgba(30,40,50,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>PAYMENT</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>${job.payment.toLocaleString()}</span>
            </div>
            <div style={{
              background: 'var(--color-nav)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-light)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 4px 8px rgba(30,40,50,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>REP</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>+{job.reputation_reward}</span>
            </div>
          </div>

          {/* Action */}
          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn-retro btn-retro-primary" 
              onClick={handleAcceptJob}
              style={{ fontSize: '1.4rem', padding: '1rem 3rem' }}
            >
              <span style={{ fontSize: '1rem' }}>●</span>
              ACCEPT
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

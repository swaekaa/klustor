import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { jobs, clients } from '../data/jobs';

export default function BoardPage() {
  const navigate = useNavigate();
  const { portfolio, completedJobs } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        paddingTop: '60px',
        minHeight: '100vh',
        background: '#0a0b0f',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h3 className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '1rem', letterSpacing: '0.1em', margin: '0 0 0.5rem 0' }}>PORTFOLIO</h3>
            <h1 className="font-display" style={{ fontSize: '4rem', lineHeight: 0.9, margin: 0, color: '#fff' }}>
              THE WALL
            </h1>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/case')}>← BACK TO HUB</button>
        </div>

        {completedJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1rem', letterSpacing: '0.1em' }}>
              NO JOBS COMPLETED. THE WALL IS EMPTY.
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '2rem' 
          }}>
            {completedJobs.map(jobId => {
              const job = jobs.find(j => j.id === jobId);
              const portItem = portfolio[jobId];
              if (!job || !portItem) return null;
              
              const client = clients[job.clientId];

              return (
                <motion.div
                  key={jobId}
                  initial={{ opacity: 0, scale: 0.9, rotate: Math.random() * 4 - 2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -10, scale: 1.05, zIndex: 10, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}
                  style={{
                    background: '#e8dcc8', // Polaroid/Print paper color
                    padding: '0.75rem 0.75rem 2rem 0.75rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                >
                  {/* Pin or tape effect */}
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '10px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />

                  <div style={{ aspectRatio: '4/5', background: '#000', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={portItem.finalImage} 
                      alt={job.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.25rem 0.5rem', border: '1px solid var(--neon-cyan)' }}>
                      <span className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '0.6rem' }}>SCORE: {portItem.creativeScore}</span>
                    </div>
                  </div>
                  
                  <div style={{ paddingTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="font-mono" style={{ fontSize: '0.6rem', color: '#8a7d6b', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
                      CLIENT: {client.name}
                    </div>
                    <h3 className="font-display" style={{ fontSize: '1.5rem', color: '#111', margin: '0 0 0.5rem 0', lineHeight: 1 }}>
                      {job.title}
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                      <div className="font-mono" style={{ color: '#0b5f38', fontSize: '1rem', fontWeight: 'bold' }}>
                        +${portItem.paymentReceived.toLocaleString()}
                      </div>
                      <div className="font-mono" style={{ color: '#8a7d6b', fontSize: '0.6rem' }}>
                        {new Date(portItem.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

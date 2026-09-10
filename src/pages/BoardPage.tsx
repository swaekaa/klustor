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
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 2rem'
      }}
    >
      <div style={{ paddingBottom: '4rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>
              THE WALL
            </h1>
            <h3 className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0.5rem 0 0 0', letterSpacing: '0.1em' }}>FINISHED CONTRACTS</h3>
          </div>
        </div>

        {completedJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)', border: '2px dashed var(--border-light)', borderRadius: '8px' }}>
            <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              NO CONTRACTS COMPLETED
            </div>
            <div className="font-body" style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
              Accept a job from the board to start building your portfolio.
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="panel"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderBottom: '2px solid var(--border-light)' }}>
                    <img 
                      src={portItem.finalImage} 
                      alt={job.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)' }}>
                    <div className="font-display" style={{ fontSize: '1.4rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {job.title.toUpperCase()}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="font-mono" style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ${portItem.paymentReceived.toLocaleString()}
                      </div>
                      <div className="font-mono" style={{ color: 'var(--color-nav)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        SCORE {portItem.creativeScore}
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

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
        paddingTop: '60px', 
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.9) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="container" style={{ maxWidth: '800px', width: '100%' }}>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(10, 11, 15, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.8)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top Scanline effect */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--neon-cyan)', opacity: 0.5, boxShadow: '0 0 10px var(--neon-cyan)' }} />
          
          <div style={{ display: 'flex', padding: '3rem' }}>
            
            {/* Left: Client Identity */}
            <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '2rem' }}>
              <div style={{ width: '100%', aspectRatio: '1', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>NO FEED</span>
              </div>
              <div>
                <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>INCOMING CONNECTION</div>
                <h2 className="font-display" style={{ color: '#fff', fontSize: '1.5rem', margin: '0.2rem 0' }}>{client.name}</h2>
                <div className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '0.7rem' }}>{client.role}</div>
              </div>
            </div>

            {/* Right: The Call */}
            <div style={{ flex: 1, paddingLeft: '3rem', display: 'flex', flexDirection: 'column' }}>
              <div className="font-mono" style={{ color: 'var(--neon-yellow)', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
                JOB ID: {job.id.toUpperCase()} // SECURE CHANNEL
              </div>
              
              <h1 className="font-display" style={{ color: '#fff', fontSize: '2.5rem', margin: '0 0 1rem 0', lineHeight: 1 }}>
                {job.title}
              </h1>

              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                borderLeft: '3px solid var(--neon-cyan)', 
                padding: '1.5rem', 
                marginBottom: '2rem' 
              }}>
                <p style={{ color: '#fff', fontSize: '1.1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                  "{job.brief}"
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>PAYMENT</div>
                  <div className="font-mono" style={{ color: 'var(--neon-green)', fontSize: '1.2rem' }}>${job.payment.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>REPUTATION</div>
                  <div className="font-mono" style={{ color: job.repReward > 0 ? 'var(--neon-cyan)' : 'var(--neon-red)', fontSize: '1.2rem' }}>
                    {job.repReward > 0 ? `+${job.repReward}` : job.repReward}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAcceptJob}
                  style={{ flex: 1, padding: '1rem', fontSize: '1.2rem' }}
                >
                  ACCEPT JOB
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => navigate('/case')}
                  style={{ padding: '0 1.5rem' }}
                >
                  DECLINE
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

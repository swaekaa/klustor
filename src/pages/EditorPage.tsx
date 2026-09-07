import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { jobs, clients } from '../data/jobs';
import InvestigationEditor from '../components/editor/InvestigationEditor';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitJob, unlockedJobs } = useGameStore();

  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<'editing' | 'delivered'>('editing');
  const [finalScore, setFinalScore] = useState(0);
  const [editorError, setEditorError] = useState(false);
  
  const job = jobs.find((j) => j.id === id);

  if (!job || !unlockedJobs.includes(job.id)) {
    return (
      <div className="page" style={{ paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>ACCESS DENIED</div>
          <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => navigate('/case')}>← BACK</button>
        </div>
      </div>
    );
  }

  const client = clients[job.clientId];

  const handleEditorSave = useCallback(
    (dataUrl: string) => {
      setFinalImage(dataUrl);
    },
    []
  );

  const toggleTask = (reqId: string) => {
    setCompletedTasks(prev => 
      prev.includes(reqId) ? prev.filter(id => id !== reqId) : [...prev, reqId]
    );
  };

  const handleSubmit = () => {
    if (!finalImage) return;

    // Simple deterministic scoring for MVP
    let score = 50;
    if (finalImage !== job.image) score += 20; 
    const taskCompletionRatio = completedTasks.length / job.requirements.length;
    score += Math.floor(taskCompletionRatio * 30); 

    setFinalScore(score);
    submitJob(job.id, finalImage, score);
    setDeliveryStatus('delivered');
  };

  if (deliveryStatus === 'delivered' && finalImage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="page"
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050508',
          paddingTop: '50px'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          style={{ textAlign: 'center', maxWidth: '1000px', width: '100%' }}
        >
          <h1 className="font-display" style={{ color: 'var(--neon-green)', fontSize: '4rem', margin: '0 0 2rem 0', letterSpacing: '0.1em' }}>
            DELIVERY ACCEPTED
          </h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {/* Before */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>BEFORE</div>
              <div style={{ aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                <img src={job.image} alt="Original Asset" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
            
            {/* After */}
            <div style={{ background: 'rgba(57, 217, 138, 0.05)', padding: '1rem', border: '1px solid var(--neon-green)' }}>
              <div className="font-mono" style={{ color: 'var(--neon-green)', fontSize: '0.8rem', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>AFTER</div>
              <div style={{ aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                <img src={finalImage} alt="Edited Asset" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '3rem' }}>
            <div>
              <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>CREATIVE SCORE</div>
              <div className="font-display" style={{ color: '#fff', fontSize: '3rem' }}>{finalScore}</div>
            </div>
            <div>
              <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>PAYMENT</div>
              <div className="font-display" style={{ color: 'var(--neon-green)', fontSize: '3rem' }}>+${job.payment.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>REP</div>
              <div className="font-display" style={{ color: job.repReward > 0 ? 'var(--neon-cyan)' : 'var(--neon-red)', fontSize: '3rem' }}>
                {job.repReward > 0 ? '+' + job.repReward : job.repReward}
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/board')}
            style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
          >
            VIEW PORTFOLIO
          </button>
        </motion.div>
      </motion.div>
    );
  }

  if (editorError) {
    return (
      <div className="page" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050508' }}>
        <div style={{ textAlign: 'center', border: '1px solid var(--neon-red)', padding: '3rem', background: 'rgba(230, 57, 70, 0.1)' }}>
          <h1 className="font-display" style={{ fontSize: '3rem', color: 'var(--neon-red)', margin: 0 }}>FIXER LAB OFFLINE</h1>
          <div className="font-mono" style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem 0', letterSpacing: '0.1em' }}>
            CRITICAL WORKSTATION FAILURE. UNLAYER EDITOR COULD NOT INITIALIZE.
          </div>
          <button className="btn btn-ghost" onClick={() => window.location.reload()}>REBOOT SYSTEM</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        paddingTop: '50px', // Below the new 50px navbar
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#050508'
      }}
    >
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 2rem', background: 'rgba(10,11,15,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.5rem', margin: 0, color: '#fff', lineHeight: 1 }}>
            KLUSTOR <span style={{ color: 'var(--text-muted)' }}>//</span> FIXER LAB
          </h2>
          <div className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
            JOB: {job.title}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/case')} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
          ← ABORT
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '280px 1fr 280px', // Left Sidebar, Center Editor, Right Sidebar
          minHeight: 0,
        }}
      >
        {/* LEFT SIDEBAR: Brief & Tasks */}
        <div style={{ background: 'rgba(10, 11, 15, 0.9)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
          
          <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CLIENT BRIEF</div>
          <div style={{ borderLeft: '2px solid var(--neon-cyan)', paddingLeft: '1rem', marginBottom: '2rem' }}>
            <div className="font-display" style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{client.name}</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
              "{job.brief}"
            </p>
          </div>

          <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '1rem' }}>JOB REQUIREMENTS</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {job.requirements.map(req => {
              const isChecked = completedTasks.includes(req.id);
              return (
                <div 
                  key={req.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    background: isChecked ? 'rgba(57, 217, 138, 0.05)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid ' + (isChecked ? 'rgba(57, 217, 138, 0.3)' : 'rgba(255,255,255,0.05)'),
                  }}
                >
                  <div>
                    <div className="font-mono" style={{ fontSize: '0.75rem', color: isChecked ? 'var(--neon-green)' : '#fff' }}>
                      {req.label}
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      TOOL: {req.type.toUpperCase()}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleTask(req.id)}
                    className="font-mono"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isChecked ? 'var(--neon-green)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                      textDecoration: isChecked ? 'none' : 'underline'
                    }}
                  >
                    {isChecked ? '✓ MET' : 'MARK MET'}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
             <p className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
               * Use Unlayer to fulfill the client's request. Mark the requirements as met when you finish them. You must SAVE the image in the editor before delivery.
             </p>
          </div>
        </div>

        {/* CENTER: UNLAYER EDITOR (Visually Dominant) */}
        <div style={{ position: 'relative', overflow: 'hidden', background: '#111' }}>
          <InvestigationEditor
            imageSrc={job.image}
            evidenceId={job.id}
            onSave={handleEditorSave}
            onError={() => setEditorError(true)}
          />
        </div>

        {/* RIGHT SIDEBAR: Status & Submission */}
        <div style={{ background: 'rgba(10, 11, 15, 0.9)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          
          <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>JOB STATUS</div>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: '#fff' }}>TASKS</span>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }}>{completedTasks.length} / {job.requirements.length}</span>
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ width: ((completedTasks.length / job.requirements.length) * 100) + '%', height: '100%', background: 'var(--neon-cyan)', transition: 'width 0.3s' }} />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>PAYMENT</div>
            <div className="font-mono" style={{ fontSize: '1.5rem', color: 'var(--neon-green)' }}>${job.payment.toLocaleString()}</div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>REP REWARD</div>
            <div className="font-mono" style={{ fontSize: '1.2rem', color: job.repReward > 0 ? '#fff' : 'var(--neon-red)' }}>
              {job.repReward > 0 ? '+' + job.repReward : job.repReward}
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!finalImage ? (
              <div style={{ padding: '1rem', background: 'rgba(230, 57, 70, 0.1)', border: '1px solid rgba(230, 57, 70, 0.3)', textAlign: 'center' }}>
                <span className="font-mono" style={{ color: 'var(--neon-red)', fontSize: '0.7rem' }}>
                  AWAITING EDITOR SAVE
                </span>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(57, 217, 138, 0.1)', border: '1px solid rgba(57, 217, 138, 0.3)', textAlign: 'center' }}>
                <span className="font-mono" style={{ color: 'var(--neon-green)', fontSize: '0.7rem' }}>
                  IMAGE DATA CAPTURED
                </span>
              </div>
            )}

            <button 
              className="btn btn-primary" 
              disabled={!finalImage}
              onClick={handleSubmit}
              style={{ 
                width: '100%', 
                padding: '1.25rem', 
                fontSize: '1.2rem',
                opacity: finalImage ? 1 : 0.5,
                cursor: finalImage ? 'pointer' : 'not-allowed'
              }}
            >
              DELIVER JOB
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

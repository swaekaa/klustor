import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { jobs, clients } from '../data/jobs';
import InvestigationEditor from '../components/editor/InvestigationEditor';

// Helper function to analyze image differences
function analyzeImageDiff(originalSrc: string, editedSrc: string): Promise<{ isResized: boolean, isVisuallyModified: boolean }> {
  return new Promise((resolve) => {
    const img1 = new Image();
    const img2 = new Image();
    let loaded = 0;

    const onLoad = () => {
      loaded++;
      if (loaded === 2) {
        if (img1.width !== img2.width || img1.height !== img2.height) {
          resolve({ isResized: true, isVisuallyModified: true });
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img1.width;
        canvas.height = img1.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve({ isResized: false, isVisuallyModified: true });
          return;
        }

        ctx.drawImage(img1, 0, 0);
        const data1 = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img2, 0, 0);
        const data2 = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let diffPixels = 0;
        const totalPixels = canvas.width * canvas.height;
        const step = 4 * 10; // Check every 10th pixel for performance

        for (let i = 0; i < data1.length; i += step) {
          if (Math.abs(data1[i] - data2[i]) > 5 || 
              Math.abs(data1[i+1] - data2[i+1]) > 5 || 
              Math.abs(data1[i+2] - data2[i+2]) > 5) {
            diffPixels++;
          }
        }

        const diffRatio = diffPixels / (totalPixels / 10);
        resolve({
          isResized: false,
          isVisuallyModified: diffRatio > 0.01 // At least 1% of sampled pixels changed
        });
      }
    };

    img1.crossOrigin = "Anonymous";
    img2.crossOrigin = "Anonymous";
    img1.onload = onLoad;
    img2.onload = onLoad;
    
    // Fallback if images fail to load
    img1.onerror = () => resolve({ isResized: false, isVisuallyModified: true });
    img2.onerror = () => resolve({ isResized: false, isVisuallyModified: true });

    img1.src = originalSrc;
    img2.src = editedSrc;
  });
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitJob, unlockedJobs, completedJobs } = useGameStore();

  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [verifiedReqs, setVerifiedReqs] = useState<string[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<'editing' | 'delivered'>('editing');
  const [finalScore, setFinalScore] = useState(0);
  const [editorError, setEditorError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Preemptively check if already completed
  if (completedJobs.includes(job.id) && deliveryStatus !== 'delivered') {
    return (
      <div className="page" style={{ paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: '3rem', color: 'var(--neon-cyan)' }}>JOB ALREADY COMPLETED</div>
          <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => navigate('/board')}>VIEW PORTFOLIO</button>
        </div>
      </div>
    );
  }

  const client = clients[job.clientId];

  const handleEditorSave = useCallback(
    async (dataUrl: string) => {
      setFinalImage(dataUrl);

      // Perform validation
      const analysis = await analyzeImageDiff(job.image, dataUrl);
      const newVerified: string[] = [];

      job.requirements.forEach(req => {
        if (req.type === 'save') {
          newVerified.push(req.id);
        } else if (req.type === 'dimension' && analysis.isResized) {
          newVerified.push(req.id);
        } else if (req.type === 'visual' && analysis.isVisuallyModified) {
          newVerified.push(req.id);
        }
      });

      setVerifiedReqs(newVerified);
    },
    [job.image, job.requirements]
  );

  const handleSubmit = () => {
    if (!finalImage || isSubmitting) return;

    // Guard requirement completion
    if (verifiedReqs.length < job.requirements.length) return;

    setIsSubmitting(true);

    // Simple deterministic scoring for MVP
    let score = 50;
    if (verifiedReqs.includes(job.requirements.find(r => r.type === 'visual')?.id || '')) score += 20; 
    score += 30; 

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
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0, lineHeight: 1.5, marginBottom: '1rem' }}>
              "{job.brief}"
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.6 }}>
              {job.clientBriefTasks.map((task, i) => (
                <li key={i}>{task}</li>
              ))}
            </ul>
          </div>

          <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '1rem' }}>SYSTEM VALIDATION</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {job.requirements.map(req => {
              const isVerified = verifiedReqs.includes(req.id);
              return (
                <div 
                  key={req.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    background: isVerified ? 'rgba(57, 217, 138, 0.05)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid ' + (isVerified ? 'rgba(57, 217, 138, 0.3)' : 'rgba(255,255,255,0.05)'),
                  }}
                >
                  <div className="font-mono" style={{ fontSize: '0.75rem', color: isVerified ? 'var(--neon-green)' : '#fff' }}>
                    {req.label}
                  </div>
                  
                  <div 
                    className="font-mono"
                    style={{
                      color: isVerified ? 'var(--neon-green)' : 'var(--text-muted)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {isVerified ? '✓ VERIFIED' : '○ PENDING'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
             <p className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
               * Use Unlayer to fulfill the client's request. System will automatically verify requirements upon SAVE.
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
        <div style={{ background: 'rgba(10, 11, 15, 0.9)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '1.5rem 1.5rem 6rem 1.5rem', overflowY: 'auto' }}>
          
          <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>JOB STATUS</div>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: '#fff' }}>TASKS</span>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }}>{verifiedReqs.length} / {job.requirements.length}</span>
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ width: ((verifiedReqs.length / job.requirements.length) * 100) + '%', height: '100%', background: 'var(--neon-cyan)', transition: 'width 0.3s' }} />
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
              disabled={!finalImage || isSubmitting || verifiedReqs.length < job.requirements.length}
              onClick={handleSubmit}
              style={{ 
                width: '100%', 
                padding: '1.25rem', 
                fontSize: '1.2rem',
                opacity: (!finalImage || verifiedReqs.length < job.requirements.length) ? 0.5 : 1,
                cursor: (!finalImage || verifiedReqs.length < job.requirements.length) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'PROCESSING...' : (verifiedReqs.length < job.requirements.length ? 'REQUIREMENTS PENDING' : 'DELIVER JOB')}
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

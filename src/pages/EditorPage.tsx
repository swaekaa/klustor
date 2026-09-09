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
        <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
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
        <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="font-display" style={{ fontSize: '3rem', color: 'var(--gta-blue)' }}>JOB ALREADY COMPLETED</div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/board')}>VIEW PORTFOLIO</button>
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
          paddingTop: '50px'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="panel"
          style={{ textAlign: 'center', maxWidth: '1000px', width: '100%', padding: '3rem' }}
        >
          <h1 className="font-display" style={{ color: 'var(--xbox-green)', fontSize: '4rem', margin: '0 0 2rem 0', letterSpacing: '0.05em', textShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
            DELIVERY ACCEPTED
          </h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {/* Before */}
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: '1rem', border: '2px solid rgba(0,0,0,0.1)', borderRadius: '16px' }}>
              <div className="font-display" style={{ color: 'var(--gta-black)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>BEFORE</div>
              <div style={{ aspectRatio: '16/9', background: '#000', overflow: 'hidden', borderRadius: '8px' }}>
                <img src={job.image} alt="Original Asset" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
            
            {/* After */}
            <div style={{ background: 'rgba(126, 185, 0, 0.1)', padding: '1rem', border: '4px solid var(--xbox-green)', borderRadius: '16px', boxShadow: '0 10px 20px rgba(126, 185, 0, 0.2)' }}>
              <div className="font-display" style={{ color: 'var(--xbox-green)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>AFTER</div>
              <div style={{ aspectRatio: '16/9', background: '#000', overflow: 'hidden', borderRadius: '8px' }}>
                <img src={finalImage} alt="Edited Asset" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '3rem', background: 'rgba(255,255,255,0.5)', padding: '2rem', borderRadius: '16px' }}>
            <div>
              <div className="font-display" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>CREATIVE SCORE</div>
              <div className="font-display" style={{ color: 'var(--gta-black)', fontSize: '3.5rem' }}>{finalScore}</div>
            </div>
            <div>
              <div className="font-display" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>PAYMENT</div>
              <div className="font-display" style={{ color: 'var(--xbox-green)', fontSize: '3.5rem' }}>+${job.payment.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-display" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>REP</div>
              <div className="font-display" style={{ color: job.repReward > 0 ? 'var(--gta-blue)' : 'var(--gta-red)', fontSize: '3.5rem' }}>
                {job.repReward > 0 ? '+' + job.repReward : job.repReward}
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/board')}
            style={{ fontSize: '1.2rem', padding: '1rem 4rem' }}
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
        paddingTop: '80px', // Below the new 80px navbar
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(255,255,255,0.6)', borderBottom: '2px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.8rem', margin: 0, color: 'var(--gta-black)', lineHeight: 1 }}>
            FIXER LAB
          </h2>
          <div className="font-display" style={{ color: 'var(--gta-blue)', fontSize: '1.2rem' }}>
            JOB: {job.title}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/case')} style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem', borderRadius: '50px' }}>
          ← ABORT
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '300px 1fr 300px', // Left Sidebar, Center Editor, Right Sidebar
          minHeight: 0,
        }}
      >
        {/* LEFT SIDEBAR: Brief & Tasks */}
        <div className="panel" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
          
          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--gta-black)', marginBottom: '0.5rem' }}>CLIENT BRIEF</div>
          <div style={{ borderLeft: '4px solid var(--gta-blue)', paddingLeft: '1rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.3)', padding: '1rem', borderRadius: '0 8px 8px 0' }}>
            <div className="font-display" style={{ color: 'var(--gta-black)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>{client.name}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontStyle: 'italic', margin: 0, lineHeight: 1.5, marginBottom: '1rem', fontWeight: 500 }}>
              "{job.brief}"
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--gta-black)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500 }}>
              {job.clientBriefTasks.map((task, i) => (
                <li key={i}>{task}</li>
              ))}
            </ul>
          </div>

          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--gta-black)', marginBottom: '1rem' }}>SYSTEM VALIDATION</div>
          
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
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: isVerified ? 'rgba(126, 185, 0, 0.1)' : 'rgba(255,255,255,0.5)',
                    border: '2px solid ' + (isVerified ? 'var(--xbox-green)' : 'rgba(0,0,0,0.1)'),
                  }}
                >
                  <div className="font-body" style={{ fontSize: '0.85rem', fontWeight: 700, color: isVerified ? 'var(--xbox-green)' : 'var(--gta-black)' }}>
                    {req.label}
                  </div>
                  
                  <div 
                    className="font-display"
                    style={{
                      color: isVerified ? 'var(--xbox-green)' : 'var(--text-muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {isVerified ? '✓ VERIFIED' : '○ PENDING'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
             <p className="font-body" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
               * Use Unlayer to fulfill the client's request. System will automatically verify requirements upon SAVE.
             </p>
          </div>
        </div>

        {/* CENTER: UNLAYER EDITOR (Visually Dominant) */}
        <div style={{ position: 'relative', overflow: 'hidden', padding: '1rem', display: 'flex' }}>
          <InvestigationEditor
            imageSrc={job.image}
            evidenceId={job.id}
            onSave={handleEditorSave}
            onError={() => setEditorError(true)}
          />
        </div>

        {/* RIGHT SIDEBAR: Status & Submission */}
        <div className="panel" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none', display: 'flex', flexDirection: 'column', padding: '2rem 2rem 8rem 2rem', overflowY: 'auto' }}>
          
          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--gta-black)', marginBottom: '1.5rem' }}>JOB STATUS</div>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="font-body" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gta-black)' }}>TASKS</span>
              <span className="font-display" style={{ fontSize: '1.1rem', color: 'var(--gta-blue)' }}>{verifiedReqs.length} / {job.requirements.length}</span>
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
              <div style={{ width: ((verifiedReqs.length / job.requirements.length) * 100) + '%', height: '100%', background: 'var(--gta-blue)', transition: 'width 0.3s', borderRadius: '4px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px' }}>
            <div className="font-display" style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>PAYMENT</div>
            <div className="font-display" style={{ fontSize: '2rem', color: 'var(--xbox-green)' }}>${job.payment.toLocaleString()}</div>
          </div>

          <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px' }}>
            <div className="font-display" style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>REP REWARD</div>
            <div className="font-display" style={{ fontSize: '1.5rem', color: job.repReward > 0 ? 'var(--gta-blue)' : 'var(--gta-red)' }}>
              {job.repReward > 0 ? '+' + job.repReward : job.repReward}
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!finalImage ? (
              <div style={{ padding: '1rem', background: 'rgba(204, 41, 43, 0.1)', border: '2px solid rgba(204, 41, 43, 0.3)', textAlign: 'center', borderRadius: '8px' }}>
                <span className="font-body" style={{ color: 'var(--gta-red)', fontSize: '0.8rem', fontWeight: 700 }}>
                  AWAITING EDITOR SAVE
                </span>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(126, 185, 0, 0.1)', border: '2px solid rgba(126, 185, 0, 0.3)', textAlign: 'center', borderRadius: '8px' }}>
                <span className="font-body" style={{ color: 'var(--xbox-green)', fontSize: '0.8rem', fontWeight: 700 }}>
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

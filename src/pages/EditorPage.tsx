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
          style={{ textAlign: 'center', maxWidth: '1000px', width: '100%', padding: '4rem', background: 'var(--bg-panel)', border: '2px solid var(--border-light)', borderRadius: '16px' }}
        >
          <div className="font-mono" style={{ color: 'var(--klustor-pink)', letterSpacing: '0.3em', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            TRANSMISSION COMPLETE
          </div>
          <h1 className="font-display" style={{ color: 'var(--klustor-green)', fontSize: '5rem', margin: '0 0 3rem 0', letterSpacing: '0.05em', textShadow: '0 4px 20px rgba(120,168,91,0.4)' }}>
            MISSION ACCOMPLISHED
          </h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
            {/* Before */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
              <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>ORIGINAL FILE</div>
              <div style={{ aspectRatio: '16/9', background: '#000', overflow: 'hidden', borderRadius: '4px' }}>
                <img src={job.image} alt="Original Asset" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
            
            {/* After */}
            <div style={{ background: 'rgba(120, 168, 91, 0.1)', padding: '1rem', border: '2px solid var(--klustor-green)', borderRadius: '8px', boxShadow: '0 10px 30px rgba(120, 168, 91, 0.2)' }}>
              <div className="font-mono" style={{ color: 'var(--klustor-green)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>EDITED ASSET</div>
              <div style={{ aspectRatio: '16/9', background: '#000', overflow: 'hidden', borderRadius: '4px' }}>
                <img src={finalImage} alt="Edited Asset" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '4rem', background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div>
              <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>CREATIVE SCORE</div>
              <div className="font-display" style={{ color: 'var(--text-primary)', fontSize: '4rem', lineHeight: 1 }}>{finalScore}</div>
            </div>
            <div style={{ width: '2px', background: 'var(--border-light)' }} />
            <div>
              <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>PAYOUT</div>
              <div className="font-display" style={{ color: 'var(--klustor-green)', fontSize: '4rem', lineHeight: 1 }}>+${job.payment.toLocaleString()}</div>
            </div>
            <div style={{ width: '2px', background: 'var(--border-light)' }} />
            <div>
              <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>REP EARNED</div>
              <div className="font-display" style={{ color: 'var(--text-primary)', fontSize: '4rem', lineHeight: 1 }}>
                +{job.repReward}
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/board')}
            style={{ fontSize: '1.5rem', padding: '1rem 4rem', display: 'inline-flex', alignItems: 'center', gap: '1rem' }}
          >
            <span style={{ fontSize: '1rem' }}>●</span>
            CONTINUE
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
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0
      }}
    >
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '2px solid var(--border-light)', marginBottom: '1.5rem', margin: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>
            FIXER LAB
          </h2>
          <div style={{ width: '2px', height: '20px', background: 'var(--border-light)' }} />
          <div className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
            JOB {job.id.replace('job-', '').toUpperCase()} // {job.title.toUpperCase()}
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '420px 1fr 420px', // Left Sidebar, Center Editor, Right Sidebar
          minHeight: 0,
          gap: '1.5rem',
          padding: '0 2rem 2rem 2rem'
        }}
      >
        {/* LEFT SIDEBAR: Retro Instruction Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
          
          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>CLIENT BRIEF</div>
          
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid var(--border-light)' }}>
            <div className="font-display" style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0 }}>{client.name}</div>
            <div className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 'bold' }}>{client.role.toUpperCase()}</div>
            
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-medium)', border: '1px solid var(--border-light)' }}>
              <p className="font-body" style={{ color: 'var(--text-primary)', fontSize: '1rem', margin: 0, lineHeight: 1.5 }}>
                "{job.brief}"
              </p>
            </div>
          </div>

          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '0.05em' }}>CLIENT REQUESTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {job.clientBriefTasks.map((task, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                background: 'var(--bg-secondary)', 
                padding: '1rem', 
                borderRadius: 'var(--radius-medium)',
                border: '1px solid var(--border-light)'
              }}>
                <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>●</span>
                <span className="font-body" style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>{task.toUpperCase()}</span>
              </div>
            ))}
          </div>

          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '0.05em' }}>SYSTEM CHECKS</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {job.requirements.map(req => {
              const isVerified = verifiedReqs.includes(req.id);
              return (
                <div 
                  key={req.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: 'var(--radius-medium)',
                    background: isVerified ? 'var(--color-success)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {req.label.toUpperCase()}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {isVerified ? 'OK' : 'WAIT'}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      {isVerified ? '●' : '○'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: UNLAYER EDITOR (Visually Dominant) */}
        <div className="panel" style={{ position: 'relative', overflow: 'hidden', padding: '1rem', display: 'flex', minHeight: 0 }}>
          <InvestigationEditor
            imageSrc={job.image}
            evidenceId={job.id}
            onSave={handleEditorSave}
            onError={() => setEditorError(true)}
          />
        </div>

        {/* RIGHT SIDEBAR: Retro Status Screen */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
          
          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>JOB STATUS</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ 
              background: 'var(--color-success)', 
              padding: '1.5rem', 
              borderRadius: 'var(--radius-medium)', 
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>PAYMENT</div>
              <div className="font-mono" style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', lineHeight: 1 }}>${job.payment.toLocaleString()}</div>
            </div>

            <div style={{ 
              background: 'var(--color-nav)', 
              padding: '1.5rem', 
              borderRadius: 'var(--radius-medium)', 
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>REP REWARD</div>
              <div className="font-mono" style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', lineHeight: 1 }}>
                +{job.reputation_reward}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>DELIVERY</div>
            
            <button 
              className={`btn-retro ${verifiedReqs.length >= job.requirements.length && finalImage ? 'btn-retro-success' : ''}`}
              disabled={!finalImage || isSubmitting || verifiedReqs.length < job.requirements.length}
              onClick={handleSubmit}
              style={{ width: '100%' }}
            >
              <span style={{ fontSize: '1rem' }}>●</span>
              {isSubmitting ? 'PROCESSING...' : 'DELIVER JOB'}
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

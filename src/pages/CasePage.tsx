import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { jobs } from '../data/jobs';
import { useState } from 'react';

export default function CasePage() {
  const navigate = useNavigate();
  const { player, unlockedJobs, completedJobs } = useGameStore();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0].id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', width: '100%', padding: '1rem', maxWidth: '100%', margin: '0 auto', gap: '3rem', flex: 1, minHeight: 0 }}>
        
        {/* Left Column: Mission Menu */}
        <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ paddingBottom: '1rem', borderBottom: '2px solid var(--border-light)', marginBottom: '1.5rem' }}>
            <h1 className="font-display" style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>JOB BOARD</h1>
            <h3 className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0.5rem 0 0 0', letterSpacing: '0.1em' }}>AVAILABLE JOBS</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', paddingRight: '1rem' }}>
            {jobs.map((job) => {
              const isUnlocked = unlockedJobs.includes(job.id);
              const isCompleted = completedJobs.includes(job.id);
              const isSelected = selectedJobId === job.id;

              let bgColor = 'var(--bg-panel-solid)';
              if (isSelected) bgColor = 'var(--color-nav)';
              else if (isCompleted) bgColor = 'var(--color-success)';
              else if (!isUnlocked) bgColor = 'rgba(230, 235, 235, 0.5)';

              return (
                <motion.button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.5rem',
                    background: bgColor,
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-medium)',
                    cursor: 'pointer',
                    boxShadow: isSelected 
                      ? 'inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 12px rgba(168, 199, 216, 0.4)' 
                      : 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 12px rgba(30,40,50,0.05)',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    textAlign: 'left',
                    opacity: (!isUnlocked && !isSelected) ? 0.7 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
                    {isSelected ? (
                      <span style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>●</span>
                    ) : (
                      <span style={{ color: 'var(--border-dark)', fontSize: '1rem' }}>○</span>
                    )}
                    <span className="font-mono" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {job.id.replace('job-', 'JOB ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="font-display" style={{ color: isSelected ? 'var(--text-primary)' : (isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'), fontSize: '1.4rem', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                    {isUnlocked ? job.title : 'LOCKED'}
                  </div>
                  
                  <div className="font-body" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 500 }}>
                    {isUnlocked ? job.client : 'UNKNOWN CLIENT'}
                  </div>
                  
                  {isUnlocked && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: 'auto' }}>
                      <div className="font-mono" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--color-success)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ${job.payment.toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div className="font-mono" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          REP +{job.reputation_reward}
                        </div>
                        <div className="font-mono" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--color-warning)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          {job.difficulty || 'EASY'}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Mission Details */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {selectedJobId && (() => {
            const job = jobs.find(j => j.id === selectedJobId)!;
            const isUnlocked = unlockedJobs.includes(job.id);
            const isCompleted = completedJobs.includes(job.id);

            return (
              <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', paddingRight: '1.5rem' }}>
                <div style={{ 
                  height: '200px', 
                  background: isUnlocked ? `url(${job.image}) center/cover` : 'var(--bg-secondary)', 
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: '2px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.5)'
                }}>
                  {!isUnlocked && (
                    <div className="font-display" style={{ color: 'var(--text-muted)', fontSize: '2rem', letterSpacing: '0.1em' }}>
                      LOCKED
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    {job.id.replace('job-', 'JOB ')} // {job.location.toUpperCase()}
                  </div>
                  <h2 className="font-display" style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: '0 0 1rem 0', lineHeight: 1.1 }}>
                    {isUnlocked ? job.title : 'RESTRICTED ACCESS'}
                  </h2>
                  
                  {isUnlocked ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div>
                          <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>CLIENT</div>
                          <div className="font-body" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{job.client}</div>
                        </div>
                        <div>
                          <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>PAYMENT</div>
                          <div className="font-mono" style={{ fontWeight: 'bold', color: 'var(--klustor-green)' }}>${job.payment.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>REP REWARD</div>
                          <div className="font-mono" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>+{job.reputation_reward}</div>
                        </div>
                        <div>
                          <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>DIFFICULTY</div>
                          <div className="font-mono" style={{ fontWeight: 'bold', color: 'var(--klustor-peach)' }}>
                            {job.reputation_reward > 15 ? 'HARD' : job.reputation_reward > 10 ? 'MEDIUM' : 'EASY'}
                          </div>
                        </div>
                      </div>

                      <div className="font-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '2rem' }}>
                        {job.description}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className={`btn-retro ${isCompleted ? 'btn-retro-success' : 'btn-retro-primary'}`}
                          disabled={isCompleted}
                          onClick={() => navigate(`/evidence/${job.id}`)}
                        >
                          <span style={{ fontSize: '0.8rem' }}>●</span>
                          {isCompleted ? 'COMPLETED' : 'ACCEPT JOB'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: 'var(--radius-medium)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                      <div className="font-mono" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        INSUFFICIENT REPUTATION
                      </div>
                      <div className="font-display" style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>
                        REP REQUIRED: {job.reputation_reward * 2}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useGameStore } from '../../store/gameStore';
import { analyzeAllFaces, defaultStats } from '../../game/utils/designAnalysis';
import { getCarTemplateUrl } from '../../game/utils/carTemplateUrl';
import LiveryEditor from '../../components/editor/LiveryEditor';
import type { CarStats, TemplateView } from '../../types';

export default function ChallengePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { room, socket, submitLivery, submitDraftLivery } = useMultiplayerStore();
  const { saveLiveryFace } = useGameStore();
  
  const [selectedView, setSelectedView] = useState<TemplateView>('left');
  const [templateUrl, setTemplateUrl] = useState<string>('');
  
  // Always start a multiplayer challenge with a fresh blank canvas
  const [textures, setTextures] = useState<Partial<Record<TemplateView, string>>>({});
  const [stats, setStats] = useState<CarStats>(defaultStats());
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const myId = socket?.id;
  const me = room?.players.find(p => p.id === myId);

  // Transition out if room changes state
  useEffect(() => {
    if (room?.status === 'racing') navigate(`/multiplayer/race/${room.code}`);
    else if (room?.status === 'results') navigate(`/multiplayer/results/${room.code}`);
  }, [room?.status, navigate, room?.code]);

  useEffect(() => {
    getCarTemplateUrl(selectedView).then(setTemplateUrl);
  }, [selectedView]);

  // Handle Server Timer
  useEffect(() => {
    if (!room?.endsAt) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((room.endsAt! - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      // Auto-submit if time runs out and haven't submitted yet
      if (remaining === 0 && !me?.hasSubmitted) {
        // Find best existing texture or just empty
        submitLivery(textures['left'] || '', stats.designScore).catch(console.error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [room?.endsAt, me?.hasSubmitted, textures, stats.designScore, submitLivery]);

  const handleEditorSave = useCallback(async (dataUrl: string) => {
    setIsSaving(true);
    try {
      const newTextures = { ...textures, [selectedView]: dataUrl };
      setTextures(newTextures);
      
      const computed = await analyzeAllFaces(newTextures, getCarTemplateUrl);
      setStats(computed);
      saveLiveryFace(dataUrl, selectedView, computed, 'MULTIPLAYER RIDE');
      
      // Broadcast live preview of this view (draft)
      submitDraftLivery(dataUrl).catch(console.error);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedView, textures, saveLiveryFace, submitDraftLivery]);

  const handleFinalSubmit = async () => {
    if (me?.hasSubmitted) return;
    try {
      // Need at least one face saved to submit properly. If none, grab default template.
      const payload = textures['left'] || templateUrl; 
      await submitLivery(payload, stats.designScore);
    } catch (err) {
      console.error(err);
    }
  };

  if (!room) {
    return <div className="page" style={{ padding: '2rem' }}>LOADING...</div>;
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  const VIEWS: { id: TemplateView; label: string }[] = [
    { id: 'left', label: 'LEFT SIDE' },
    { id: 'right', label: 'RIGHT SIDE' },
    { id: 'top', label: 'TOP' },
    { id: 'front', label: 'FRONT' },
    { id: 'rear', label: 'REAR' },
  ];

  if (me?.hasSubmitted) {
    return (
      <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h2 className="font-display" style={{ fontSize: '3rem', color: 'var(--klustor-green)' }}>SUBMITTED!</h2>
        <p className="font-mono" style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Waiting for other players or time to expire...</p>
        
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', gap: '2rem' }}>
          <div>
            <div className="font-mono" style={{ color: 'var(--text-muted)' }}>TIME LEFT</div>
            <div className="font-display" style={{ fontSize: '2rem' }}>{mins}:{secs}</div>
          </div>
          <div>
            <div className="font-mono" style={{ color: 'var(--text-muted)' }}>DESIGN SCORE</div>
            <div className="font-display" style={{ fontSize: '2rem' }}>{stats.designScore.toFixed(1)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: '1.5rem', margin: 0 }}>{room.title}</h2>
          <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{room.code}</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: '0.8rem', color: timeLeft <= 60 ? '#FF4D4D' : 'var(--text-muted)' }}>TIME REMAINING</div>
          <div className="font-display" style={{ fontSize: '2.5rem', color: timeLeft <= 60 ? '#FF4D4D' : 'var(--text-primary)', lineHeight: 1 }}>
            {mins}:{secs}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
             <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SCORE</div>
             <div className="font-display" style={{ fontSize: '1.5rem' }}>{stats.designScore.toFixed(1)}</div>
          </div>
          <button 
            className="btn" 
            onClick={handleFinalSubmit}
            style={{ padding: '1rem 2rem', background: 'var(--klustor-green)', color: '#FFF', border: 'none' }}
          >
            SUBMIT LIVERY
          </button>
        </div>
      </div>

      {/* EDITOR */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        
        {/* VIEW SELECTOR */}
        <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {VIEWS.map(v => (
            <button 
              key={v.id} 
              onClick={() => setSelectedView(v.id)} 
              className="btn" 
              style={{ 
                padding: '1rem 0.5rem', borderRadius: '12px', fontSize: '0.9rem',
                background: selectedView === v.id ? 'var(--klustor-cyan)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-light)'
              }}
            >
              {v.label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
             <p className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
               Click SAVE in the editor to update your stats before final submission.
             </p>
          </div>
        </div>
        
        {/* UNLAYER CANVAS */}
        <div style={{ flex: 1, background: 'white', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-light)' }}>
          {templateUrl && (
            <LiveryEditor
              key={selectedView}
              templateSrc={textures[selectedView] || templateUrl}
              onSave={handleEditorSave}
              editorId={`multiplayer-${selectedView}`}
            />
          )}
          {isSaving && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20
            }}>
              <div className="font-display" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
                SAVING DRAFT...
              </div>
            </div>
          )}
        </div>
        
        {/* LIVE PREVIEWS SIDEBAR */}
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-light)', overflowY: 'auto' }}>
          <h3 className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', textAlign: 'center' }}>LIVE PREVIEWS</h3>
          {room.players.filter(p => p.id !== socket?.id).map(p => (
            <div key={p.id} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{p.avatar || '🚗'}</span>
                <span className="font-display" style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{p.displayName}</span>
              </div>
              <div style={{ width: '100%', height: '100px', background: p.draftLivery ? 'transparent' : '#EEEEEE', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.draftLivery ? (
                  <img src={p.draftLivery} alt={`${p.displayName} preview`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span className="font-mono" style={{ fontSize: '0.7rem', color: '#AAA' }}>EDITING...</span>
                )}
              </div>
            </div>
          ))}
          {room.players.length <= 1 && (
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Waiting for others...</div>
          )}
        </div>

      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div style={{ marginBottom: '6rem', marginTop: '4rem' }}>
        <div className="font-display" style={{ fontSize: '1.5rem', marginBottom: '3rem', letterSpacing: '0.2em' }}>KLUSTOR</div>
        <h1 style={{ fontSize: 'min(8vw, 6rem)', lineHeight: '1', marginBottom: '1.5rem' }}>DESIGN YOUR RIDE.</h1>
        <div className="font-mono" style={{ fontSize: '1.25rem' }}>Make it yours. Then race it.</div>
      </div>
      
      <button 
        className="btn-retro btn-retro-primary"
        onClick={() => navigate('/design')}
        style={{ fontSize: '1.5rem', padding: '1.5rem 4rem' }}
      >
        START DESIGNING →
      </button>

      <div style={{ position: 'absolute', bottom: '2rem', width: '100%', textAlign: 'center', opacity: 0.5 }}>
        <div className="font-mono" style={{ fontSize: '0.85rem' }}>Art skills optional.</div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';

export default function MapPage() {
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
      <div style={{ paddingBottom: '4rem', maxWidth: '1200px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>
              CITY MAP
            </h1>
            <h3 className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0.5rem 0 0 0', letterSpacing: '0.1em' }}>GEOSPATIAL INTELLIGENCE</h3>
          </div>
        </div>

        <div
          className="panel"
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-light)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
          }}
        >
          {/* Abstract Map Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(rgba(30, 41, 51, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 51, 0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.8
          }} />

          {/* Fictional Map Nodes */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            
            <MapNode x="30%" y="20%" label="OCEAN DRIVE" status="available" />
            <MapNode x="60%" y="35%" label="THE VELVET PIER" status="selected" />
            <MapNode x="20%" y="60%" label="HARBOR STREET" status="locked" />
            <MapNode x="75%" y="70%" label="SANTERIA LANE" status="available" />
            <MapNode x="50%" y="85%" label="DOWNTOWN" status="locked" />

            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.2 }}>
              <line x1="30%" y1="20%" x2="60%" y2="35%" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="60%" y1="35%" x2="75%" y2="70%" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="30%" y1="20%" x2="20%" y2="60%" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="5,5" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MapNode({ x, y, label, status }: { x: string, y: string, label: string, status: 'selected' | 'available' | 'locked' }) {
  let color = 'var(--bg-panel-solid)';
  let borderColor = 'var(--border-light)';
  let textColor = 'var(--text-primary)';
  let dotColor = 'var(--text-muted)';
  let scale = 1;

  if (status === 'selected') {
    color = 'var(--klustor-cyan)';
    borderColor = 'var(--klustor-cyan)';
    dotColor = 'var(--text-primary)';
    scale = 1.1;
  } else if (status === 'locked') {
    color = 'rgba(230, 235, 235, 0.5)';
    textColor = 'var(--text-muted)';
    dotColor = 'var(--border-light)';
  } else if (status === 'available') {
    color = 'var(--bg-secondary)';
    borderColor = 'var(--border-dark)';
    dotColor = 'var(--text-primary)';
  }

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      transition: 'all 0.2s ease',
      cursor: status === 'locked' ? 'not-allowed' : 'pointer'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: color,
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-pill)',
        border: `1px solid ${borderColor}`,
        boxShadow: status === 'selected' ? '0 4px 12px rgba(143, 213, 209, 0.4), inset 0 2px 4px rgba(255,255,255,0.6)' : '0 2px 8px rgba(30,40,50,0.05)',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }} />
          <div className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: textColor, whiteSpace: 'nowrap' }}>
            {label}
          </div>
        </div>
      </div>
      
      {status === 'selected' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '2px solid var(--klustor-cyan)',
            borderRadius: 'var(--radius-pill)',
            zIndex: -1
          }}
        />
      )}
    </div>
  );
}

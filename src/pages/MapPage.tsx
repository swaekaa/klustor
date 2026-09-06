import { motion } from 'framer-motion';

export default function MapPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        paddingTop: '56px', // navbar height
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="container" style={{ padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          CITY MAP // <span style={{ color: 'var(--neon-cyan)' }}>VICE CITY</span>
        </h1>
        <div className="font-mono" style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          GEOSPATIAL INTELLIGENCE NETWORK
        </div>

        <div
          style={{
            flex: 1,
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-elevated)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Abstract Map Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(45deg, #091221 0%, #170d1e 100%)',
            opacity: 0.8
          }} />
          
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(rgba(0, 212, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 212, 0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.5
          }} />

          {/* Fictional Map Nodes */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            
            <MapNode x="30%" y="20%" label="OCEAN DRIVE" type="location" color="var(--neon-pink)" />
            <MapNode x="60%" y="35%" label="THE VELVET PIER" type="suspect" color="var(--neon-cyan)" />
            <MapNode x="20%" y="60%" label="HARBOR STREET GARAGE" type="evidence" color="var(--neon-yellow)" />
            <MapNode x="75%" y="70%" label="SANTERIA LANE" type="location" color="var(--neon-red)" />
            <MapNode x="50%" y="85%" label="DOWNTOWN PRECINCT" type="safe" color="var(--neon-green)" />

            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.3 }}>
              <line x1="30%" y1="20%" x2="60%" y2="35%" stroke="var(--neon-cyan)" strokeWidth="1" strokeDasharray="5,5" />
              <line x1="60%" y1="35%" x2="75%" y2="70%" stroke="var(--neon-red)" strokeWidth="1" strokeDasharray="5,5" />
              <line x1="30%" y1="20%" x2="20%" y2="60%" stroke="var(--neon-yellow)" strokeWidth="1" strokeDasharray="5,5" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MapNode({ x, y, label, type, color }: { x: string, y: string, label: string, type: string, color: string }) {
  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 15px ${color}`
      }} />
      <div className="font-mono" style={{
        fontSize: '0.65rem',
        color: 'var(--text-bright)',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '0.2rem 0.5rem',
        border: `1px solid ${color}`,
        borderRadius: '2px',
        whiteSpace: 'nowrap'
      }}>
        {label}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';

export default function MapPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        paddingTop: '80px', // navbar height
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <div className="container" style={{ padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="panel" style={{ background: 'rgba(255,255,255,0.6)', padding: '2rem', marginBottom: '2rem', border: 'none' }}>
          <h1 className="font-display" style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--gta-black)' }}>
            CITY MAP // <span style={{ color: 'var(--gta-blue)' }}>VICE CITY</span>
          </h1>
          <div className="font-body" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
            GEOSPATIAL INTELLIGENCE NETWORK
          </div>
        </div>

        <div
          className="panel"
          style={{
            flex: 1,
            border: '4px solid rgba(255,255,255,0.8)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            background: 'rgba(255,255,255,0.2)'
          }}
        >
          {/* Abstract Map Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(10px)'
          }} />
          
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.5
          }} />

          {/* Fictional Map Nodes */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            
            <MapNode x="30%" y="20%" label="OCEAN DRIVE" type="location" color="var(--gta-red)" />
            <MapNode x="60%" y="35%" label="THE VELVET PIER" type="suspect" color="var(--gta-blue)" />
            <MapNode x="20%" y="60%" label="HARBOR STREET GARAGE" type="evidence" color="var(--gta-amber)" />
            <MapNode x="75%" y="70%" label="SANTERIA LANE" type="location" color="var(--gta-orange)" />
            <MapNode x="50%" y="85%" label="DOWNTOWN PRECINCT" type="safe" color="var(--xbox-green)" />

            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5 }}>
              <line x1="30%" y1="20%" x2="60%" y2="35%" stroke="var(--gta-blue)" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="60%" y1="35%" x2="75%" y2="70%" stroke="var(--gta-orange)" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="30%" y1="20%" x2="20%" y2="60%" stroke="var(--gta-amber)" strokeWidth="2" strokeDasharray="5,5" />
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
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}`,
        border: '2px solid #fff'
      }} />
      <div className="font-body" style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: 'var(--gta-black)',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '0.2rem 0.6rem',
        border: `2px solid ${color}`,
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>
        {label}
      </div>
    </div>
  );
}

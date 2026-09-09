import { motion } from 'framer-motion';

export default function ContactsPage() {
  const contacts = [
    {
      id: 1,
      name: 'MAYA RIVERA',
      role: 'INFORMANT',
      status: 'ONLINE',
      color: 'var(--gta-blue)',
      notes: 'Seen at the Velvet Pier. Knows about the black SUV.',
      avatar: 'MR'
    },
    {
      id: 2,
      name: 'DANTE CROSS',
      role: 'SUSPECT',
      status: 'OFFLINE',
      color: 'var(--gta-red)',
      notes: 'Wears a distinctive red jacket. Linked to Harbor garage.',
      avatar: 'DC'
    },
    {
      id: 3,
      name: 'LT. VALENCIA',
      role: 'SUPERVISOR',
      status: 'ONLINE',
      color: 'var(--xbox-green)',
      notes: 'Waiting for case updates. Wants evidence solid before a raid.',
      avatar: 'LV'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        paddingTop: '80px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
        <div className="panel" style={{ background: 'rgba(255,255,255,0.6)', padding: '2rem', marginBottom: '2rem', border: 'none' }}>
          <h1 className="font-display" style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--gta-black)' }}>
            CONTACTS // <span style={{ color: 'var(--gta-blue)' }}>ACTIVE ROSTER</span>
          </h1>
          <div className="font-body" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
            SECURE COMMUNICATIONS NETWORK
          </div>
        </div>

        <div className="evidence-grid">
          {contacts.map(contact => (
            <motion.div
              key={contact.id}
              whileHover={{ y: -4 }}
              className="panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderLeft: `8px solid ${contact.color}`,
                background: 'rgba(255,255,255,0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    border: `2px solid ${contact.color}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: contact.color,
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}>
                    {contact.avatar}
                  </div>
                  <div>
                    <h3 className="font-display" style={{ fontSize: '1.5rem', margin: 0, color: 'var(--gta-black)' }}>{contact.name}</h3>
                    <div className="font-body" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{contact.role}</div>
                  </div>
                </div>
                <div className="font-body" style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 700,
                  color: contact.status === 'ONLINE' ? 'var(--xbox-green)' : 'var(--text-muted)' 
                }}>
                  {contact.status}
                </div>
              </div>
              
              <div className="divider" style={{ background: 'rgba(0,0,0,0.1)' }} />
              
              <div className="font-body" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                {contact.notes}
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  OPEN COMMS
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

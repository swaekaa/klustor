import { motion } from 'framer-motion';

export default function ContactsPage() {
  const contacts = [
    {
      id: 1,
      name: 'MAYA RIVERA',
      role: 'INFORMANT',
      status: 'ONLINE',
      color: 'var(--neon-cyan)',
      notes: 'Seen at the Velvet Pier. Knows about the black SUV.',
      avatar: 'MR'
    },
    {
      id: 2,
      name: 'DANTE CROSS',
      role: 'SUSPECT',
      status: 'OFFLINE',
      color: 'var(--neon-red)',
      notes: 'Wears a distinctive red jacket. Linked to Harbor garage.',
      avatar: 'DC'
    },
    {
      id: 3,
      name: 'LT. VALENCIA',
      role: 'SUPERVISOR',
      status: 'ONLINE',
      color: 'var(--neon-green)',
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
        paddingTop: '56px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
        <h1 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          CONTACTS // <span style={{ color: 'var(--neon-cyan)' }}>ACTIVE ROSTER</span>
        </h1>
        <div className="font-mono" style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          SECURE COMMUNICATIONS NETWORK
        </div>

        <div className="evidence-grid">
          {contacts.map(contact => (
            <motion.div
              key={contact.id}
              whileHover={{ y: -4 }}
              className="panel panel--glass"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderTop: `2px solid ${contact.color}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${contact.color}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: contact.color,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'bold'
                  }}>
                    {contact.avatar}
                  </div>
                  <div>
                    <h3 className="font-display" style={{ fontSize: '1.2rem', margin: 0 }}>{contact.name}</h3>
                    <div className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{contact.role}</div>
                  </div>
                </div>
                <div className="font-mono" style={{ 
                  fontSize: '0.6rem', 
                  color: contact.status === 'ONLINE' ? 'var(--neon-green)' : 'var(--text-muted)' 
                }}>
                  {contact.status}
                </div>
              </div>
              
              <div className="divider" />
              
              <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {contact.notes}
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
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

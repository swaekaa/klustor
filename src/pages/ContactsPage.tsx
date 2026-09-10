import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ContactsPage() {
  const contacts = [
    {
      id: 1,
      name: 'MAYA RIVERA',
      role: 'INFORMANT',
      status: 'ONLINE',
      color: 'var(--color-nav)',
      notes: 'Seen at the Velvet Pier. Knows about the black SUV. Will only trade intel for cash or high reputation.',
      avatar: 'MR'
    },
    {
      id: 2,
      name: 'DANTE CROSS',
      role: 'SUSPECT',
      status: 'OFFLINE',
      color: 'var(--color-warning)',
      notes: 'Wears a distinctive red jacket. Linked to Harbor garage. Avoid direct contact.',
      avatar: 'DC'
    },
    {
      id: 3,
      name: 'LT. VALENCIA',
      role: 'SUPERVISOR',
      status: 'ONLINE',
      color: 'var(--color-success)',
      notes: 'Waiting for case updates. Wants evidence solid before a raid. Do not disappoint.',
      avatar: 'LV'
    }
  ];

  const [selectedId, setSelectedId] = useState(contacts[0].id);

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
      }}
    >
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', width: '100%', padding: '3rem', maxWidth: '1200px', margin: '0 auto', gap: '3rem', flex: 1 }}>
        
        {/* Left Column: Contact List */}
        <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingBottom: '1rem', borderBottom: '2px solid var(--border-light)', marginBottom: '1.5rem' }}>
            <h1 className="font-display" style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>CONTACTS</h1>
            <h3 className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0.5rem 0 0 0', letterSpacing: '0.1em' }}>SECURE NETWORK</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', paddingRight: '1rem' }}>
            {contacts.map(contact => {
              const isSelected = selectedId === contact.id;
              
              return (
                <motion.button
                  key={contact.id}
                  onClick={() => setSelectedId(contact.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1.25rem',
                    background: isSelected ? 'var(--color-nav)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-medium)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 12px rgba(143, 213, 209, 0.4)' : 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 12px rgba(30,40,50,0.05)',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isSelected ? (
                      <span style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>●</span>
                    ) : (
                      <span style={{ color: 'var(--border-dark)', fontSize: '1rem' }}>○</span>
                    )}
                    <span className="font-display" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)', fontSize: '1.2rem', letterSpacing: '0.05em' }}>
                      {contact.name.toUpperCase()}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Contact Details */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          {(() => {
            const contact = contacts.find(c => c.id === selectedId)!;

            return (
              <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '3rem' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-light)' }}>
                  
                  <div style={{
                    width: '120px',
                    height: '120px',
                    backgroundColor: 'var(--bg-panel-solid)',
                    border: `2px solid var(--border-light)`,
                    borderRadius: 'var(--radius-large)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: contact.color,
                    fontFamily: 'var(--font-display)',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 12px rgba(30,40,50,0.1)'
                  }}>
                    {contact.avatar}
                  </div>
                  
                  <div>
                    <h2 className="font-display" style={{ fontSize: '3rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0', lineHeight: 1 }}>
                      {contact.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                        {contact.role.toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.8rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-light)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: contact.status === 'ONLINE' ? 'var(--color-success)' : 'var(--text-muted)' }} />
                        <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{contact.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>DOSSIER NOTES</div>
                  <div style={{ 
                    background: 'var(--bg-secondary)', 
                    padding: '2rem', 
                    borderRadius: 'var(--radius-medium)', 
                    border: '1px solid var(--border-light)',
                    borderLeft: `4px solid ${contact.color}`
                  }}>
                    <p className="font-body" style={{ color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
                      {contact.notes}
                    </p>
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-retro btn-retro-ghost" disabled={contact.status !== 'ONLINE'}>
                    <span style={{ fontSize: '0.8rem' }}>●</span>
                    CALL CONTACT
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}

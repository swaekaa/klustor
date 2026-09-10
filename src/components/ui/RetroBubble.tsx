import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface RetroBubbleProps {
  label: string;
  icon?: ReactNode;
  isActive?: boolean;
  color?: string;
  onClick?: () => void;
}

export default function RetroBubble({ label, icon, isActive = false, color = 'var(--color-nav)', onClick }: RetroBubbleProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ y: 1 }}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        height: '48px',
        padding: '0.25rem 1.5rem 0.25rem 0.5rem',
        borderRadius: 'var(--radius-pill)',
        background: isActive ? color : 'var(--bg-panel-solid)',
        border: `1px solid ${isActive ? color : 'var(--border-light)'}`,
        boxShadow: isActive 
          ? `0 4px 12px ${color}40, inset 0 2px 4px rgba(255,255,255,0.4)` 
          : '0 2px 8px rgba(30,40,50,0.05), inset 0 1px 1px rgba(255,255,255,0.8)',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
        whiteSpace: 'nowrap'
      }}
    >
      <div 
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isActive ? 'rgba(255,255,255,0.3)' : color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive ? 'var(--text-primary)' : 'var(--text-light)',
          fontWeight: 'bold',
          fontSize: '1rem',
          boxShadow: isActive ? 'none' : 'inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
        }}
      >
        {icon}
      </div>
      <div className="font-display" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center', lineHeight: 1 }}>
        {label}
      </div>
    </motion.button>
  );
}

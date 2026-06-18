"use client";

export default function EcosystemActionBar() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(14, 14, 14, 0.95)',
      borderTop: '1px solid #262626',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
      backdropFilter: 'blur(10px)'
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: '#ffb800',
        letterSpacing: '0.15em',
        textTransform: 'uppercase'
      }}>
        Ecosystem Actions: Connect with Scout
      </span>
    </div>
  );
}

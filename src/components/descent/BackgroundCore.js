'use client'
export default function BackgroundCore() {
  return (
    <div className="absolute inset-0 w-full h-full" style={{zIndex: 0}}>
      <style>{`
        @keyframes corePulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.85; }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000000'
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(255,140,0,0.6) 0%, rgba(255,80,0,0.2) 40%, transparent 70%)',
        animation: 'corePulse 3s ease-in-out infinite',
        transform: 'scale(calc(1 + var(--sp) * 0.3))',
        transformOrigin: 'center center'
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(255,184,0,0.3) 0%, transparent 50%)',
        mixBlendMode: 'screen',
        opacity: 0.7
      }} />
    </div>
  )
}

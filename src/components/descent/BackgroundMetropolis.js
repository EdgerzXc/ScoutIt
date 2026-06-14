'use client'
export default function BackgroundMetropolis() {
  return (
    <div className="absolute inset-0 w-full h-full" style={{zIndex: 0}}>
      <div className="absolute inset-0" style={{background: '#0a0a0a'}} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(255,184,0,0.15), transparent 50%)'
      }} />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vanishing point at 50, 30 */}
        {/* 9 lines from vanishing point to bottom edge */}
        <line x1="50" y1="30" x2="0" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        <line x1="50" y1="30" x2="12.5" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        <line x1="50" y1="30" x2="25" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        <line x1="50" y1="30" x2="37.5" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        <line x1="50" y1="30" x2="50" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        <line x1="50" y1="30" x2="62.5" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        <line x1="50" y1="30" x2="75" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        <line x1="50" y1="30" x2="87.5" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        <line x1="50" y1="30" x2="100" y2="100" stroke="#FFB800" strokeWidth="0.5" opacity="0.4"/>
        {/* 5 horizontal cross lines */}
        <line x1="0" y1="45" x2="100" y2="45" stroke="#FFB800" strokeWidth="0.3" opacity="0.25"/>
        <line x1="0" y1="58" x2="100" y2="58" stroke="#FFB800" strokeWidth="0.3" opacity="0.25"/>
        <line x1="0" y1="70" x2="100" y2="70" stroke="#FFB800" strokeWidth="0.3" opacity="0.25"/>
        <line x1="0" y1="82" x2="100" y2="82" stroke="#FFB800" strokeWidth="0.3" opacity="0.25"/>
        <line x1="0" y1="92" x2="100" y2="92" stroke="#FFB800" strokeWidth="0.3" opacity="0.25"/>
      </svg>
      {/* scroll parallax div on top */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: 'translateY(calc(var(--sp) * -20px))'
      }} />
    </div>
  )
}

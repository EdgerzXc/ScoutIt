
"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { useState, useEffect } from "react";
import BackgroundCore from "@/components/descent/BackgroundCore";


export default function CoreLayer() {

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scoutit_user");
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white selection:bg-[#FFB800] selection:text-black overflow-hidden font-sans" style={{ paddingTop: "52px" }}>
      <LayerNav prev={{ href: "/layer/mantle", label: "Mantle" }} next={null} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundCore />
      </div>
{/* SECTION 6: THE WORKSPACE LAYER */}
      <section className="snap-section section-workspace" style={{ padding: 0 }}>
        <div className="property-split">
          
          {/* Left Menu Panel */}
          <div className="property-menu">
            <div className="menu-header">
              <span className="vector-label">Layer 05 // The Core</span>
              <h2 style={{ color: 'var(--accent)' }}>{currentUser ? "Welcome Back." : "Take Command."}</h2>
              <p>{currentUser ? "Your private headquarters. Access your tools and track your activity below." : "Your private headquarters. Securely list assets, manage leads, and connect with high-intent clients."}</p>
            </div>
            
            <div className="ledger-tags-guide" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {!currentUser ? (
                <>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                    ScoutIt is a two-sided platform. While buyers browse, professionals command their market presence here:
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255, 184, 0, 0.05)', borderLeft: '2px solid var(--accent)', borderRadius: '0 4px 4px 0' }}>
                      <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px' }}>For Property Owners</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Use the Guided Wizard to easily list your space, highlight its architectural DNA, and receive direct pitches from vetted brokers.</p>
                    </div>
                    
                    <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderLeft: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '0 4px 4px 0' }}>
                      <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#fff', textTransform: 'uppercase', marginBottom: '8px' }}>For Licensed Brokers</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Verify your PRC license to unlock Broker Mode. Manage your listings, track inbound leads, and build your digital portfolio.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentUser.tags?.includes('owner') && (
                    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
                      <div className="hover:border-gold-accent transition-colors" style={{ padding: '16px', background: 'rgba(255, 184, 0, 0.05)', borderLeft: '2px solid var(--accent)', borderRadius: '0 4px 4px 0', border: '1px solid transparent' }}>
                        <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px' }}>Owner Mode</h4>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Properties: <strong style={{ color: '#fff' }}>1</strong></span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>New Pitches: <strong style={{ color: '#fff' }}>3</strong></span>
                        </div>
                      </div>
                    </Link>
                  )}
                  {currentUser.tags?.includes('broker') && (
                    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
                      <div className="hover:border-gold-accent transition-colors" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderLeft: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '0 4px 4px 0', border: '1px solid transparent' }}>
                        <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#fff', textTransform: 'uppercase', marginBottom: '8px' }}>Broker Mode</h4>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Listings: <strong style={{ color: '#fff' }}>4</strong></span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inbound Leads: <strong style={{ color: '#fff' }}>12</strong></span>
                        </div>
                      </div>
                    </Link>
                  )}
                  {currentUser.tags?.includes('provider') && (
                    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
                      <div className="hover:border-gold-accent transition-colors" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderLeft: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '0 4px 4px 0', border: '1px solid transparent' }}>
                        <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#fff', textTransform: 'uppercase', marginBottom: '8px' }}>Provider Mode ({currentUser.providerType || 'Service'})</h4>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Profile Views: <strong style={{ color: '#fff' }}>142</strong></span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inquiries: <strong style={{ color: '#fff' }}>2</strong></span>
                        </div>
                      </div>
                    </Link>
                  )}
                  {(!currentUser.tags?.includes('owner') && !currentUser.tags?.includes('broker') && !currentUser.tags?.includes('provider')) && (
                    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
                      <div className="hover:border-gold-accent transition-colors" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderLeft: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '0 4px 4px 0', border: '1px solid transparent' }}>
                        <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#fff', textTransform: 'uppercase', marginBottom: '8px' }}>Buyer Mode</h4>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Saved Spaces: <strong style={{ color: '#fff' }}>7</strong></span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Curated Intel: <strong style={{ color: '#fff' }}>2</strong></span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="menu-footer" style={{ marginTop: '32px' }}>
              <Link href={currentUser ? "/dashboard" : "/onboarding"} className="prominent-action-link" style={{ background: 'var(--accent)', color: 'var(--bg)', border: 'none', fontWeight: 'bold' }}>
                {currentUser ? "Enter Dashboard &rarr;" : "Open Your Workspace &rarr;"}
              </Link>
            </div>
          </div>

          {/* Right Visual Canvas */}
          <div className="matrix-preview-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '40px' }}>
              {/* Abstract Dashboard UI Representation */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-variant)', borderRadius: '8px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--surface-variant)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                      {currentUser?.primaryMode === 'broker' ? 'BR' : currentUser?.primaryMode === 'provider' ? 'PR' : currentUser?.primaryMode === 'buyer' ? 'BY' : 'OW'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                        {currentUser?.primaryMode === 'broker' ? 'Broker Dashboard' : currentUser?.primaryMode === 'provider' ? 'Provider Dashboard' : currentUser?.primaryMode === 'buyer' ? 'Buyer Dashboard' : 'Owner Dashboard'}
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>VERIFIED ACCOUNT</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {currentUser?.primaryMode === 'provider' ? 'PROFILE VIEWS' : currentUser?.primaryMode === 'buyer' ? 'SAVED SPACES' : 'ACTIVE LISTINGS'}
                    </div>
                    <div style={{ fontSize: '24px', color: '#fff', fontFamily: 'var(--font-display)', marginTop: '8px' }}>
                      {currentUser?.primaryMode === 'provider' ? '142' : currentUser?.primaryMode === 'buyer' ? '07' : '03'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,184,0,0.05)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,184,0,0.2)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {currentUser?.primaryMode === 'buyer' ? 'CURATED INTEL' : 'NEW LEADS'}
                    </div>
                    <div style={{ fontSize: '24px', color: 'var(--accent)', fontFamily: 'var(--font-display)', marginTop: '8px' }}>
                      {currentUser?.primaryMode === 'buyer' ? '02' : '12'}
                    </div>
                  </div>
                </div>
                
                <div style={{ height: '40px', background: 'var(--surface-variant)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  {currentUser?.primaryMode === 'provider' ? '+ Update Portfolio' : currentUser?.primaryMode === 'buyer' ? 'Explore Directory' : '+ List New Property'}
                </div>
              </div>
              
              {/* Decorative Glow */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(255,184,0,0.08) 0%, rgba(0,0,0,0) 60%)', zIndex: 1 }}></div>
            </div>
          </div>

        </div>
      </section>
</main>
        
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const ALL_BADGES = [
  { id: 'pioneer', name: 'Pioneer', icon: '🏛️', desc: 'Joined during the Alpha phase.', locked: false, rarity: 'Legendary', date: 'Oct 2026', slot: '#14 of 500' },
  { id: 'verified', name: 'Verified', icon: '✅', desc: 'Identity successfully verified.', locked: false, rarity: 'Common', date: 'Oct 2026' },
  { id: 'top_broker', name: 'Top 10%', icon: '👑', desc: 'Top 10% response rate this month.', locked: true, rarity: 'Rare' },
  { id: 'shark', name: 'Shark', icon: '🦈', desc: 'Closed 5 deals via ScoutIt.', locked: true, rarity: 'Epic' },
  { id: 'curator', name: 'Curator', icon: '🖼️', desc: 'Saved 100+ listings.', locked: true, rarity: 'Uncommon' }
];

const TAG_LABELS = {
  buyer: "Buyer / Scout",
  owner: "Owner",
  broker: "Broker",
  provider: "Service Provider",
  exploring: "Exploring"
};

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username ? decodeURIComponent(params.username) : "User";
  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyBadge, setCeremonyBadge] = useState(null);
  const [userTags, setUserTags] = useState(["owner", "broker"]); // Default fallback
  const [publicProfile, setPublicProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    // If the profile matches the logged in user, pull their tags + public card.
    const saved = localStorage.getItem("scoutit_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.name === username || username === "User") {
        setUserTags(parsed.tags || ["exploring"]);
        setPublicProfile(parsed.publicProfile || null);
        setIsOwnProfile(true);
      }
    }

    const hasSeenCeremony = localStorage.getItem('seen_ceremony');
    if (!hasSeenCeremony) {
      setTimeout(() => {
        setCeremonyBadge(ALL_BADGES[0]); // Pioneer
        setShowCeremony(true);
      }, 1000);
    }
  }, [username]);

  const closeCeremony = () => {
    setShowCeremony(false);
    localStorage.setItem('seen_ceremony', 'true');
  };

  const handleBadgeClick = (badge) => {
    if (!badge.locked) {
      setCeremonyBadge(badge);
      setShowCeremony(true);
    }
  };

  const lockedCount = ALL_BADGES.filter(b => b.locked).length;

  return (
    <div className="min-h-screen bg-background text-[#d4d4d4] font-body-md selection:bg-gold-accent/30 selection:text-white">
      {/* Cinematic Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay bg-[url('/grain.png')]"></div>

      {/* Ceremony Overlay */}
      {showCeremony && ceremonyBadge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl animate-[fadeIn_0.5s_ease-out]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-accent opacity-10 blur-[120px] pointer-events-none"></div>
          
          <div className="text-center p-8 max-w-lg w-full flex flex-col items-center animate-[slideUp_0.8s_ease-out]">
            <span className="text-gold-accent font-label-caps text-xs tracking-widest uppercase mb-4 block">Badge Unlocked</span>
            
            <div className="text-8xl mb-6 drop-shadow-[0_0_40px_rgba(255,184,0,0.4)] animate-[bounce_2s_infinite]">
              {ceremonyBadge.icon}
            </div>
            
            <h2 className="font-headline-editorial text-5xl md:text-6xl text-white mb-4">{ceremonyBadge.name}</h2>
            
            {ceremonyBadge.slot && (
               <div className="font-working-title text-sm text-gold-accent mb-4 border border-gold-accent/30 px-4 py-1 rounded-full inline-block">
                 Slot {ceremonyBadge.slot}
               </div>
            )}
            
            <p className="text-lg text-text-secondary font-body-md italic mb-12">"{ceremonyBadge.desc}"</p>
            
            <button 
              className="bg-gold-accent text-background font-working-title text-base font-bold py-4 px-12 rounded hover:opacity-90 transition-all hover:scale-105" 
              onClick={closeCeremony}
            >
              Claim Badge
            </button>
          </div>
        </div>
      )}

      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-surface-variant px-6 py-4">
        <Link href="/dashboard" className="font-working-title text-sm text-text-secondary hover:text-white transition-colors uppercase tracking-widest">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 md:py-24">
        
        {/* Identity Section */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-24 animate-[fadeIn_0.8s_ease-out]">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-surface border-2 border-surface-variant flex items-center justify-center font-headline-editorial text-6xl text-white shadow-2xl">
            {username.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
            <h1 className="font-headline-editorial text-5xl md:text-7xl text-white mb-4">{username}</h1>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
              {userTags.map(tag => (
                <span key={tag} className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase border border-gold-accent/30 px-3 py-1 rounded-full">
                  {TAG_LABELS[tag] || tag}
                </span>
              ))}
              <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase border border-surface-variant px-3 py-1 rounded-full">📍 {publicProfile?.location || "Metro Manila"}</span>
              <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase border border-surface-variant px-3 py-1 rounded-full">Since Oct 2026</span>
            </div>

            {publicProfile?.headline && (
              <p className="font-working-title text-lg text-gold-accent mb-3">{publicProfile.headline}</p>
            )}

            <p className="font-body-md text-text-secondary max-w-xl italic leading-relaxed">
              {publicProfile?.bio || "An active participant in the ScoutIT ecosystem, leveraging market intelligence to make informed decisions."}
            </p>

            {publicProfile?.firm && userTags.includes("broker") && (
              <p className="font-label-caps text-[11px] tracking-widest text-text-secondary uppercase mt-3">{publicProfile.firm}</p>
            )}
            {publicProfile?.service && userTags.includes("provider") && (
              <p className="text-sm text-text-secondary mt-3">{publicProfile.service}</p>
            )}

            {isOwnProfile && (
              <Link href="/settings" className="mt-6 inline-block font-working-title text-sm text-gold-accent border border-gold-accent/40 px-5 py-2 rounded-full hover:bg-gold-accent/10 transition-colors">
                ✏️ Edit Public Card
              </Link>
            )}
          </div>
        </section>

        {/* Dynamic Mode-specific Public Section */}
        <section className="mb-24">
          <div className="border-t border-b border-surface-variant py-8 flex flex-col md:flex-row items-center justify-between gap-8">
            
            {userTags.includes('broker') && (
              <div className="flex flex-col gap-2 flex-1 w-full text-center md:text-left">
                <span className="font-label-caps text-[11px] tracking-widest text-text-secondary uppercase">Broker Performance</span>
                <div className="font-headline-editorial text-4xl text-white">Top 20%</div>
                <span className="text-sm text-text-secondary">Response Rate (under 2hrs)</span>
              </div>
            )}

            {userTags.includes('broker') && userTags.includes('owner') && (
              <div className="hidden md:block w-px h-16 bg-surface-variant"></div>
            )}

            {userTags.includes('owner') && (
              <div className="flex flex-col gap-2 flex-1 w-full text-center md:text-left">
                <span className="font-label-caps text-[11px] tracking-widest text-text-secondary uppercase">Asset Ownership</span>
                <div className="font-headline-editorial text-4xl text-white">2</div>
                <span className="text-sm text-text-secondary">Verified Assets (Private)</span>
              </div>
            )}

            {(userTags.includes('provider') || userTags.includes('photographer')) && (
               <>
                 <div className="hidden md:block w-px h-16 bg-surface-variant"></div>
                 <div className="flex flex-col gap-2 flex-1 w-full text-center md:text-left">
                   <span className="font-label-caps text-[11px] tracking-widest text-text-secondary uppercase">Portfolio</span>
                   <div className="font-headline-editorial text-4xl text-white">15</div>
                   <span className="text-sm text-text-secondary">Completed Projects</span>
                 </div>
               </>
            )}
            
            {/* Fallback if just exploring/buyer */}
            {!userTags.includes('broker') && !userTags.includes('owner') && !userTags.includes('provider') && (
               <div className="flex flex-col gap-2 flex-1 w-full text-center md:text-left">
                 <span className="font-label-caps text-[11px] tracking-widest text-text-secondary uppercase">Market Activity</span>
                 <div className="font-headline-editorial text-4xl text-white">12</div>
                 <span className="text-sm text-text-secondary">Listings Scouted</span>
               </div>
            )}

          </div>
        </section>

        {/* Badge Wall */}
        <section>
          <div className="flex flex-col items-center md:items-start mb-12 text-center md:text-left">
            <h2 className="font-headline-editorial text-4xl text-white mb-2">Trophy Wall</h2>
            <p className="text-text-secondary italic">A cryptographic record of achievements and milestones.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ALL_BADGES.map(badge => (
              <div 
                key={badge.id} 
                className={`relative aspect-[3/4] p-6 flex flex-col items-center justify-center text-center transition-all duration-500
                  ${badge.locked 
                    ? 'bg-transparent border border-dashed border-surface-variant opacity-40' 
                    : 'bg-surface border border-surface-variant hover:border-gold-accent cursor-pointer group shadow-2xl'
                  }`}
                onClick={() => handleBadgeClick(badge)}
              >
                {!badge.locked && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none"></div>
                )}
                
                {/* Rarity Label */}
                {!badge.locked && (
                  <span className="absolute top-4 font-label-caps text-[9px] tracking-widest text-gold-accent uppercase">
                    {badge.rarity}
                  </span>
                )}

                <div className={`text-5xl mb-4 transition-transform duration-500 ${!badge.locked && 'group-hover:scale-110 drop-shadow-md'}`}>
                  {badge.locked ? '?' : badge.icon}
                </div>
                
                <div className={`font-headline-editorial text-xl mb-1 ${badge.locked ? 'text-text-muted' : 'text-white'}`}>
                  {badge.locked ? 'Locked' : badge.name}
                </div>

                {!badge.locked && badge.date && (
                  <div className="font-label-caps text-[9px] tracking-widest text-text-secondary uppercase">
                    {badge.date}
                  </div>
                )}

                {/* Pioneer Slot number if applicable */}
                {!badge.locked && badge.slot && (
                  <div className="absolute bottom-4 font-working-title text-[10px] text-gold-accent border border-gold-accent/30 px-2 py-0.5 rounded-full bg-background">
                    {badge.slot}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center text-sm font-working-title text-text-secondary">
            {lockedCount} more badges exist. Keep scouting.
          </div>
        </section>

      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import ReactionButtons from "@/components/ReactionButtons";

// Sci-Fi character-by-character text writer effect
function TypewriterText({ text }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayText("");
    const timer = setInterval(() => {
      setDisplayText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, 12); // Speed of character typing in ms

    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayText}</span>;
}

const SPACE_STARS = [
  { top: '15%', left: '12%', size: '1.5px', opacity: 0.15 },
  { top: '8%', left: '34%', size: '2px', opacity: 0.25 },
  { top: '22%', left: '55%', size: '1px', opacity: 0.1 },
  { top: '5%', left: '78%', size: '2px', opacity: 0.2 },
  { top: '28%', left: '92%', size: '1.5px', opacity: 0.18 },
  { top: '45%', left: '8%', size: '2px', opacity: 0.15 },
  { top: '38%', left: '26%', size: '1px', opacity: 0.12 },
  { top: '52%', left: '44%', size: '2.5px', opacity: 0.2 },
  { top: '48%', left: '72%', size: '1.5px', opacity: 0.15 },
  { top: '65%', left: '88%', size: '2px', opacity: 0.22 },
  { top: '78%', left: '15%', size: '1px', opacity: 0.1 },
  { top: '88%', left: '38%', size: '2px', opacity: 0.18 },
  { top: '82%', left: '64%', size: '1.5px', opacity: 0.15 },
  { top: '72%', left: '82%', size: '2px', opacity: 0.2 },
  { top: '92%', left: '95%', size: '1px', opacity: 0.12 }
];

const discoveryFeedData = {
  Residential: {
    spotlights: [
      {
        title: "Aurelia Residences",
        location: "BGC Core",
        style: "Modern Tropical",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
        desc: "Low density luxury high-rise featuring double-glazed glass wrap and custom bronze details."
      },
      {
        title: "The Estate Makati",
        location: "Makati Central",
        style: "Brutalist Luxury",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
        desc: "Designed by Foster + Partners. Cruciform structure maximizing floor plate efficiency and natural daylight."
      }
    ],
    news: [
      { title: "BGC Spatial Movement", date: "June 2026", excerpt: "A rise in demand for low-density residences drives modernist villa acquisitions." },
      { title: "The Return of Quiet Luxury", date: "May 2026", excerpt: "Local buyers favor hidden properties in Quezon City over flashy estates." }
    ],
    collections: [
      "Modernist Penthouses",
      "QC Quiet Luxury Estates",
      "Tropical Modern Estates"
    ]
  },
  Commercial: {
    spotlights: [
      {
        title: "Zuellig Building",
        location: "Makati CBD",
        style: "Sustainable Glass",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
        desc: "LEED Platinum certified skyscraper utilizing low-emissivity glass and rain harvesting systems."
      },
      {
        title: "Arthaland Century Pacific",
        location: "BGC North",
        style: "Eco-Corporate",
        image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=400&q=80",
        desc: "A boutique commercial landmark combining zero-waste technology and premium workspace layouts."
      }
    ],
    news: [
      { title: "Green Office Demand", date: "June 2026", excerpt: "Global firms in Manila mandate LEED-certified workspaces for all future operations." },
      { title: "BGC Commercial Corridors", date: "April 2026", excerpt: "Retail podiums are evolving to include open-air gardens and wellness zones." }
    ],
    collections: [
      "LEED Platinum Towers",
      "BGC Premium Workspaces",
      "Creative Studio Hubs"
    ]
  },
  STR: {
    spotlights: [
      {
        title: "Siargao Tropical Villa",
        location: "Cloud 9",
        style: "Island Minimalist",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
        desc: "Open-plan coco-wood pavilion with high-pitched thatch roofs and private sea pools."
      },
      {
        title: "Palawan Eco-Retreat",
        location: "El Nido Lio",
        style: "Native Modern",
        image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=80",
        desc: "Solar-powered beachfront cabins utilizing locally-sourced bamboo and reclaimed teak structures."
      }
    ],
    news: [
      { title: "Surf-Front Land Rush", date: "June 2026", excerpt: "Boutique developers scramble to acquire land along General Luna's extended coast." },
      { title: "Off-Grid Island Living", date: "May 2026", excerpt: "Palawan resort developers transition fully to solar microgrids and composting systems." }
    ],
    collections: [
      "Coastal Surf Retreats",
      "Off-Grid Bamboo Pavilions",
      "Luxury Glamping Tents"
    ]
  },
  Restaurants: {
    spotlights: [
      {
        title: "Gallery by Chele",
        location: "BGC Central",
        style: "Wood & Steel",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
        desc: "Industrial minimalist space with warm natural wood overlays and dramatic mood lighting."
      },
      {
        title: "Antonio's Tagaytay",
        location: "Tagaytay Ridge",
        style: "Heritage Colonial",
        image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&q=80",
        desc: "Grand estate dining hall displaying black-and-white tiles, colonial pillars, and lush greenhouse corridors."
      }
    ],
    news: [
      { title: "Poblacion Food Architecture", date: "June 2026", excerpt: "Abandoned residential warehouses are reborn as high-design multi-concept culinary spots." },
      { title: "Design-First Ridge Dining", date: "May 2026", excerpt: "Tagaytay restaurants design glass pavilions to capture panoramic Taal lake vistas." }
    ],
    collections: [
      "Industrial Culinary Hubs",
      "Heritage Estate Dining",
      "Minimalist Coffee Spots"
    ]
  }
};

export default function Home() {
  const [activePropertyType, setActivePropertyType] = useState("Residential");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeDiscoverType, setActiveDiscoverType] = useState("Residential");
  const [driftingRocks, setDriftingRocks] = useState([]);
  const containerRef = useRef(null);

  // Scanner UI States
  const [ufoDragging, setUfoDragging] = useState(false);
  const [ufoPos, setUfoPos] = useState({ x: 0, y: 0 });
  const [points, setPoints] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [hudOpen, setHudOpen] = useState(false);
  const [ufoReturning, setUfoReturning] = useState(false);
  const [hasScannedOnce, setHasScannedOnce] = useState(false);
  const [isUfoSticky, setIsUfoSticky] = useState(false);
  const canvasRef = useRef(null);

  const handleDragStart = (e) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    setUfoPos({ x, y });
    setPoints([{ x, y }]);
    setUfoDragging(true);
    setUfoReturning(false);
    setIsScanning(false);
    setScanResult(null);
    setHudOpen(false);
    setHasScannedOnce(true);

    // Freeze page scrolling during drag/draw
    document.body.style.overflow = 'hidden';
  };

  const handlePointerMove = (e) => {
    if (!ufoDragging || ufoReturning) return;
    const x = e.clientX;
    const y = e.clientY;
    setUfoPos({ x, y });
    setPoints((prev) => [...prev, { x, y }]);
  };

  const handlePointerUp = () => {
    if (!ufoDragging || ufoReturning) return;

    if (points.length < 5) {
      flyBackHome();
      return;
    }

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const width = maxX - minX;
    const height = maxY - minY;

    if (width < 25 || height < 25) {
      flyBackHome();
      return;
    }

    // Enter scanning phase
    setIsScanning(true);

    // Calculate center of drawn circle
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    const result = runScannerCollisionCheck(minX, maxX, minY, maxY, centerX, centerY);
    setScanResult(result);

    // Hold scanning overlay for 1.5s, then return UFO and display HUD console
    setTimeout(() => {
      setIsScanning(false);
      flyBackHome(() => {
        setHudOpen(true);
      });
    }, 1500);
  };

  const flyBackHome = (callback) => {
    setUfoReturning(true);

    // If sticky, fly back to the floating scanner dock; otherwise fly to the logo anchor
    const stickyDockEl = document.querySelector('.floating-ufo-scanner-dock .interactive-ufo-node');
    const logoAnchorEl = document.querySelector('.ufo-anchor');
    
    const targetEl = isUfoSticky ? stickyDockEl : logoAnchorEl;
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const targetViewportX = rect.left + rect.width / 2;
      const targetViewportY = rect.top;
      
      setUfoPos({ x: targetViewportX, y: targetViewportY });
    } else {
      setUfoPos({ x: window.innerWidth - 80, y: 150 });
    }

    setTimeout(() => {
      setUfoDragging(false);
      setUfoReturning(false);
      setPoints([]);
      document.body.style.overflow = '';
      if (callback) callback();
    }, 700);
  };

  const runScannerCollisionCheck = (minX, maxX, minY, maxY, centerX, centerY) => {
    // 1. Check Broker Cards
    const brokerCards = document.querySelectorAll('.broker-preview-card');
    for (let el of brokerCards) {
      const rect = el.getBoundingClientRect();
      const elCX = rect.left + rect.width / 2;
      const elCY = rect.top + rect.height / 2;
      if (elCX >= minX && elCX <= maxX && elCY >= minY && elCY <= maxY) {
        const nameEl = el.querySelector('h3');
        const name = nameEl ? nameEl.textContent.trim() : 'Broker';
        return {
          title: `SCAN: ADVISOR [${name.toUpperCase()}]`,
          intel: `Encrypted dossier retrieved for ${name}. Verified placements: High volume transactions. Specialty sectors active. Select full profile to view telemetry.`
        };
      }
    }

    // 2. Check Property Cards
    const propertyCards = document.querySelectorAll('.preview-card');
    for (let el of propertyCards) {
      const rect = el.getBoundingClientRect();
      const elCX = rect.left + rect.width / 2;
      const elCY = rect.top + rect.height / 2;
      if (elCX >= minX && elCX <= maxX && elCY >= minY && elCY <= maxY) {
        const titleEl = el.querySelector('h3');
        const title = titleEl ? titleEl.textContent.trim() : 'Asset';
        return {
          title: `SCAN: PROPERTY BLOCK [${title.toUpperCase()}]`,
          intel: `Metadata scan for ${title} complete. Design aesthetic: Verified. Spatial density rating: Standard. Location coordinate verified. Select element to open portal link.`
        };
      }
    }

    // 3. Check Layer 4 Ledger (Your Board)
    const ledgerEl = document.querySelector('.property-split');
    if (ledgerEl) {
      const rect = ledgerEl.getBoundingClientRect();
      const elCX = rect.left + rect.width / 2;
      const elCY = rect.top + rect.height / 2;
      if (elCX >= minX && elCX <= maxX && elCY >= minY && elCY <= maxY) {
        return {
          title: "SCAN: LEDGER PIPELINE",
          intel: "Scanned Layer 04 (Personal Board). Local tracking matrix active. Sync integrity: 100%. Allows visual staging of wishlist parameters without server metadata leaks."
        };
      }
    }

    // 4. Check Layer 2 Discovery Grid
    const discoverEl = document.querySelector('.discover-preview-grid');
    if (discoverEl) {
      const rect = discoverEl.getBoundingClientRect();
      const elCX = rect.left + rect.width / 2;
      const elCY = rect.top + rect.height / 2;
      if (elCX >= minX && elCX <= maxX && elCY >= minY && elCY <= maxY) {
        return {
          title: "SCAN: DISCOVERY ENGINE",
          intel: "Scanned Layer 02 (Zoning Grid). Sub-systems active: Residential, Commercial, and STR sectors. Spatial filters initialized. Relational indices are fully operational."
        };
      }
    }

    // 5. Fallback based on Center Point coordinates (over which section)
    const elements = document.elementsFromPoint(centerX, centerY);
    for (let el of elements) {
      const sec = el.closest('section');
      if (sec) {
        if (sec.classList.contains('section-hook')) {
          return {
            title: "SCAN: PORTAL CORE",
            intel: "Main header vector scanned. Engine state: Standing by. User directive: Drag scanner node downwards to analyze dynamic layers below."
          };
        }
        if (sec.classList.contains('section-discover')) {
          return {
            title: "SCAN: EXPLORATION ZONE",
            intel: "Layer 02 environment scanned. Area consists of property zones. Drag and release directly over specific zone cards for detail telemetry."
          };
        }
        if (sec.classList.contains('section-advisory')) {
          return {
            title: "SCAN: ADVISORY GRID",
            intel: "Layer 03 environment scanned. Active broker registry discovered. Drag scanner node directly over broker avatars to access dossier metrics."
          };
        }
        if (sec.classList.contains('section-wishlist')) {
          return {
            title: "SCAN: YOUR BOARD",
            intel: "Layer 04 environment scanned. Core systems: Personal Wishlist Ledger. Drag and release directly over infographics for workflow specs."
          };
        }
      }
    }

    return {
      title: "SCAN: SECTOR INTEL",
      intel: "General ambient coordinates parsed. Interface mesh stable. Drag scanner node onto active cards or sections to extract metadata."
    };
  };

  // Canvas draw effect
  useEffect(() => {
    if (!ufoDragging || !canvasRef.current || points.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }, [points, ufoDragging]);

  // Restore scroll position from sessionStorage
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("homepage_scroll");
    if (savedScroll && containerRef.current) {
      const scrollVal = parseInt(savedScroll, 10);
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = scrollVal;
          if (scrollVal > 300) {
            setIsUfoSticky(true);
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleScroll = (e) => {
    if (e.currentTarget) {
      const top = e.currentTarget.scrollTop;
      sessionStorage.setItem("homepage_scroll", top.toString());
      if (top > 300) {
        setIsUfoSticky(true);
      } else {
        setIsUfoSticky(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    const spawnRock = () => {
      if (!active) return;
      
      const id = Math.random().toString(36).substr(2, 9);
      
      // Select type: 80% rock, 10% comet, 10% neutron star
      const rand = Math.random();
      let type = 'rock';
      let size = '6px';
      let scale = 1.0;
      let borderRadius = '50%';
      
      const side = Math.floor(Math.random() * 4);
      let startX_pct, startY_pct;
      
      if (side === 0) {
        // Left
        startX_pct = -5;
        startY_pct = Math.floor(10 + Math.random() * 80);
      } else if (side === 1) {
        // Right
        startX_pct = 105;
        startY_pct = Math.floor(10 + Math.random() * 80);
      } else if (side === 2) {
        // Top
        startX_pct = Math.floor(10 + Math.random() * 80);
        startY_pct = -5;
      } else {
        // Bottom
        startX_pct = Math.floor(10 + Math.random() * 80);
        startY_pct = 105;
      }

      const startX = `${startX_pct}vw`;
      const startY = `${startY_pct}vh`;

      // Angle calculation towards center (50%, 50%) taking screen aspect ratio into account
      const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
      const dx = (50 - startX_pct) * (w / 100);
      const dy = (50 - startY_pct) * (h / 100);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      if (rand < 0.8) {
        type = 'rock';
        size = Math.floor(4 + Math.random() * 5) + "px"; // 4px to 8px
        scale = parseFloat((0.8 + Math.random() * 0.4).toFixed(2));
        borderRadius = `${Math.floor(30 + Math.random()*20)}% ${Math.floor(40 + Math.random()*20)}% ${Math.floor(30 + Math.random()*20)}% ${Math.floor(30 + Math.random()*20)}%`;
      } else if (rand < 0.9) {
        type = 'comet';
        size = Math.floor(3 + Math.random() * 3) + "px"; // 3px to 5px (smaller head)
        scale = parseFloat((0.9 + Math.random() * 0.3).toFixed(2));
      } else {
        type = 'neutron';
        size = Math.floor(14 + Math.random() * 8) + "px"; // 14px to 22px (bigger than stones & comets!)
        scale = parseFloat((0.9 + Math.random() * 0.3).toFixed(2));
      }

      let duration = 12;
      if (type === 'comet') {
        duration = Math.floor(6 + Math.random() * 6); // 6s to 12s, fast
      } else if (type === 'neutron') {
        duration = Math.floor(16 + Math.random() * 8); // 16s to 24s, slow
      } else {
        duration = Math.floor(10 + Math.random() * 8); // 10s to 18s, medium
      }

      setDriftingRocks(prev => [...prev, { id, type, startX, startY, size, duration, borderRadius, angle, scale }]);

      const nextDelay = 4000 + Math.random() * 5000; // spawn every 4 to 9 seconds
      timerId = setTimeout(spawnRock, nextDelay);
    };

    let timerId = setTimeout(spawnRock, 2000); // initial spawn after 2 seconds

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, []);
  
  const propertyTypes = ["Residential", "Commercial", "STR", "Restaurants"];

  const locationDictionary = [
    "BGC Core", "Makati Central", "Roxas Triangle", "Quezon City", 
    "Quezon Province", "Alabang", "Siargao"
  ];

  const discoverHubs = {
    Residential: ["BGC Alpha", "Makati Core", "Arca South", "Nuvali Estate", "Forbes Park"],
    Commercial: ["Makati CBD", "Ortigas Center", "BGC North", "Alabang CBD", "Bay Area"],
    STR: ["Siargao Cloud 9", "El Nido Lio", "Boracay Station 1", "Panglao Island", "Coron Town"],
    Restaurants: ["BGC High Street", "Salcedo Village", "Tagaytay Ridge", "Poblacion", "Tomas Morato"]
  };

  const categoryPreviews = {
    Residential: [
      {
        id: "res-1",
        title: "Aurelia Residences",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
        tags: ["Aesthetic: Modern Tropical", "Spatial Density: Low", "Location: BGC Core"],
      },
      {
        id: "res-2",
        title: "The Estate Makati",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
        tags: ["Aesthetic: Brutalist Luxury", "Spatial Density: Medium", "Location: Makati Central"],
      },
      {
        id: "res-3",
        title: "Park Central Towers",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        tags: ["Aesthetic: Glass Minimalist", "Spatial Density: High", "Location: Roxas Triangle"],
      }
    ],
    Commercial: [
      {
        id: "com-1",
        title: "Zuellig Building",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        tags: ["Aesthetic: Sustainable Glass", "Zoning: Premium IT", "Location: Makati CBD"],
      },
      {
        id: "com-2",
        title: "Arthaland Century Pacific",
        image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80",
        tags: ["Aesthetic: Eco-Corporate", "Zoning: Mixed-Use", "Location: BGC North"],
      }
    ],
    STR: [
      {
        id: "str-1",
        title: "Siargao Tropical Villa",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
        tags: ["Aesthetic: Island Minimalist", "Yield: High Velocity", "Location: Cloud 9"],
      },
      {
        id: "str-2",
        title: "Palawan Eco-Retreat",
        image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
        tags: ["Aesthetic: Native Modern", "Yield: Seasonal Peak", "Location: El Nido"],
      }
    ],
    Restaurants: [
      {
        id: "rest-1",
        title: "Gallery by Chele",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
        tags: ["Aesthetic: Wood & Steel", "Capacity: Intimate", "Location: BGC Central"],
      },
      {
        id: "rest-2",
        title: "Antonio's Tagaytay",
        image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
        tags: ["Aesthetic: Heritage Colonial", "Capacity: Estate", "Location: Tagaytay Ridge"],
      }
    ]
  };

  // Stars and glitters particle arrays removed for clean cinematic hero redesign

  return (
    <main ref={containerRef} onScroll={handleScroll} className="cinematic-container">
      {/* SECTION 1: SPACE HERO */}
      <section className="snap-section section-hook">
        <div className="grain"></div>

        {/* Cinematic Cosmic Space Background */}
        <div className="space-bg-container">
          {SPACE_STARS.map((star, idx) => (
            <div
              key={`space-star-${idx}`}
              className="space-star"
              style={{
                position: 'absolute',
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                opacity: star.opacity,
                boxShadow: star.opacity > 0.18 ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                animation: 'twinkleSpace 6s ease-in-out infinite alternate',
                animationDelay: `${idx * 0.4}s`
              }}
            />
          ))}
          {/* Subtle Gravitational accretion core */}
          <div className="black-hole-core"></div>
          <div className="accretion-disk-outer"></div>
          {/* Subtle Event Horizon curved glow at the bottom */}
          <div className="event-horizon"></div>
          <div className="event-horizon-swirl"></div>

          {/* Faint Drifting Cosmic Elements (Occasional Rocks, Comets, Neutron Stars) */}
          {driftingRocks.map((rock) => (
            <div
              key={rock.id}
              className="drifting-container"
              style={{
                position: 'absolute',
                top: rock.startY,
                left: rock.startX,
                width: rock.size,
                height: rock.size,
                animation: `driftToCenter ${rock.duration}s linear forwards`,
                pointerEvents: 'none',
                zIndex: 2
              }}
              onAnimationEnd={() => {
                setDriftingRocks((prev) => prev.filter((r) => r.id !== rock.id));
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `rotate(${rock.angle}deg) scale(${rock.scale})`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none'
                }}
              >
                {rock.type === 'rock' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: rock.borderRadius,
                      background: 'rgba(200, 169, 110, 0.55)', // Gold-tinted to match theme
                      boxShadow: '0 0 6px rgba(200, 169, 110, 0.25)',
                      filter: 'blur(0.5px)'
                    }}
                  />
                )}
                {rock.type === 'comet' && (
                  <div className="comet-head">
                    <div className="comet-tail"></div>
                  </div>
                )}
                {rock.type === 'neutron' && (
                  <div className="neutron-star-drifting" />
                )}
              </div>
            </div>
          ))}

          {/* Static pulsing star removed per user request */}
        </div>

        {/* Main hook content */}
        <div className="hook-content">

          {/* Animated SCOUTIT wordmark */}
          <div className="scoutit-wordmark" aria-label="SCOUTIT">
            {/* S — comet trail draw */}
            <span className="letter letter-s" style={{ animationDelay: '0s' }}>S</span>
            {/* C — eclipse reveal */}
            <span className="letter letter-c" style={{ animationDelay: '0.55s' }}>C</span>
            {/* O — planet orbit */}
            <span className="letter letter-o" style={{ animationDelay: '1.0s' }}>
              O
              <span className="orbit-ring"></span>
            </span>
            {/* U — signal fill */}
            <span className="letter letter-u" style={{ animationDelay: '1.45s' }}>U</span>
            {/* T — satellite arms */}
            <span className="letter letter-t1" style={{ animationDelay: '1.9s' }}>T</span>

            {/* I — normal letter, UFO anchored above via two wrapper layers:
                  ufo-anchor = static centering (never animated)
                  ufo-float  = animation only (translateY, never touches X) */}
            <span className="letter letter-i" style={{ animationDelay: '2.3s' }}>
              I
              <span className="ufo-anchor" style={{ opacity: ufoDragging ? 0 : 1, transition: 'opacity 0.25s ease' }}>
                <span className="ufo-float">
                  {/* Onboarding Tooltip Badge */}
                  {!hasScannedOnce && (
                    <span className="ufo-tooltip-onboarding">
                      [ DRAG TO SCAN ]
                    </span>
                  )}
                  {/* Pulsing Sonar Ring for Interactivity Onboarding */}
                  {!hasScannedOnce && (
                    <span className="sonar-pulse-ring"></span>
                  )}
                  <span 
                    className="ufo interactive-ufo-node"
                    onPointerDown={handleDragStart}
                    style={{ touchAction: 'none' }}
                  >
                    <span className="ufo-dome"></span>
                    <span className="ufo-disc">
                      <span className="ufo-light ufo-light-1"></span>
                      <span className="ufo-light ufo-light-2"></span>
                      <span className="ufo-light ufo-light-3"></span>
                    </span>
                  </span>
                </span>
              </span>
            </span>

            {/* T — targeting reticle */}
            <span className="letter letter-t2" style={{ animationDelay: '3.5s' }}>
              T
              <span className="reticle-ring reticle-1"></span>
              <span className="reticle-ring reticle-2"></span>
            </span>
          </div>

          <h1 className="hero-tagline">Get lost in spaces that actually inspire you.</h1>
          <p className="hero-subheadline">Space Intelligence for the Philippine property dreamer.</p>
          
          <button 
            onClick={() => document.getElementById("property-section")?.scrollIntoView({ behavior: "smooth" })}
            className="hero-cta-btn"
          >
            Begin Exploring
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="hook-scroll-indicator">
          <span className="scroll-text">Scroll to explore</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* SECTION 2: Layer 01 */}
      <section className="snap-section section-property" id="property-section">
        <div className="property-split">
          {/* Left Menu Panel */}
          <div className="property-menu">
            <div className="menu-header">
              <span className="vector-label">Layer 01 // Property Experiences</span>
              <h2>Curated Sectors</h2>
              <p>Select a category to begin your exploration.</p>
            </div>
            <nav className="menu-nav">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  className={`menu-btn ${activePropertyType === type ? "active" : ""}`}
                  onClick={() => {
                    setActivePropertyType(type);
                    setSearchQuery("");
                    setShowDropdown(false);
                  }}
                >
                  {type}
                </button>
              ))}
            </nav>
            <div className="menu-footer">
              <Link href="/property/batasan-hills" className="prominent-action-link">
                View Showcase Space →
              </Link>
            </div>
          </div>
          
          {/* Right Visual Canvas - Interactive Preview Panel */}
          <div className="matrix-preview-pane">
            <header className="pane-header">
              <h3>{activePropertyType} Intelligence</h3>
              <p>Live active preview stream</p>
            </header>
            
            <div className="search-container">
              <div className="search-input-wrapper">
                <input 
                  type="text" 
                  className="vector-search-input"
                  placeholder="Search spaces by name, city, or style..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {showDropdown && searchQuery.trim() !== "" && (
                  (() => {
                    const matchedLocations = locationDictionary.filter(loc => 
                      loc.toLowerCase().includes(searchQuery.toLowerCase().trim())
                    );
                    
                    if (matchedLocations.length === 0) return null;

                    return (
                      <div className="search-suggestions-dropdown">
                        {matchedLocations.map(loc => (
                          <div 
                            key={loc} 
                            className="dropdown-item"
                            onClick={() => {
                              setSearchQuery(loc);
                              setShowDropdown(false);
                            }}
                          >
                            {loc}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="mini-cards-grid" key={activePropertyType}>
              {(() => {
                const q = searchQuery.toLowerCase().trim();
                const filtered = categoryPreviews[activePropertyType].filter(item => {
                  if (!q) return true;
                  const titleMatch = item.title.toLowerCase().includes(q);
                  const locationTag = item.tags[2] ? item.tags[2].toLowerCase() : "";
                  const locMatch = locationTag.includes(q);
                  return titleMatch || locMatch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="empty-state-msg">
                      Zero matching assets found in active directory.
                    </div>
                  );
                }

                return filtered.map((item) => {
                  const locationTag = item.tags[2] || "";
                  const city = locationTag.replace("Location: ", "") || "Quezon City";
                  return (
                    <div key={item.id} className="mini-preview-card">
                      <div className="mini-card-visual">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.title} className="mini-card-image" />
                      </div>
                      
                      <div className="home-card-reaction-overlay">
                        <ReactionButtons
                          propertyId={item.id}
                          propertyTitle={item.title}
                          category={activePropertyType}
                          city={city}
                        />
                      </div>

                      <div className="mini-card-body">
                      <h4>{item.title}</h4>
                      <div className="mini-card-tags">
                        {item.tags.map((tag, idx) => {
                          const labels = ["The Space", "Daily Life Reality", "Location Story"];
                          return (
                            <div key={idx} className="mini-tag-wrapper">
                              <span className="mini-tag-label">{labels[idx]}</span>
                              <span className="mini-tag">{tag}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
            </div>
            
            <div className="matrix-legend-caption">
              Explore different spaces by clicking the categories. Tap any space to view its deep briefing page.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Layer 02 */}
      <section className="snap-section section-discover" style={{ padding: 0 }}>
        <div className="property-split">
          {/* Left Menu Panel */}
          <div className="property-menu">
            <div className="menu-header">
              <span className="vector-label">Layer 02 // Discovery &amp; Intelligence</span>
              <h2>Discovery Feed</h2>
              <p>Explore real-time spatial reports, regional stories, and architectural curations.</p>
            </div>
            <nav className="menu-nav">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  className={`menu-btn ${activeDiscoverType === type ? "active" : ""}`}
                  onClick={() => setActiveDiscoverType(type)}
                >
                  {type}
                </button>
              ))}
            </nav>
            <div className="menu-footer">
              <Link href={`/discover?type=${activeDiscoverType.toLowerCase()}`} className="prominent-action-link">
                Begin Exploring →
              </Link>
            </div>
          </div>

          {/* Right Visual Canvas */}
          <div className="matrix-preview-pane">
            <header className="pane-header">
              <h3>{activeDiscoverType} Feed</h3>
              <p>Live Property Intel &amp; Discoveries</p>
            </header>
            
            <div className="discover-feed-preview" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Part 1: Property Spotlights */}
              <div>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '16px' }}>Property Spotlights</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {discoveryFeedData[activeDiscoverType].spotlights.map((spot, idx) => (
                    <div key={idx} style={{ background: '#161616', border: '1px solid #262626', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={spot.image} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '4px 8px', border: '1px solid var(--accent-border)', borderRadius: '2px' }}>{spot.style}</span>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <h5 style={{ fontSize: '16px', fontWeight: '500', color: '#fff', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>{spot.title}</h5>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Location: {spot.location}</span>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{spot.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 2: Split News & Collections */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', borderTop: '1px solid #262626', paddingTop: '24px' }}>
                {/* News & Stories */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '16px' }}>News &amp; Stories</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {discoveryFeedData[activeDiscoverType].news.map((item, idx) => (
                      <div key={idx} style={{ borderBottom: '1px solid #1e1e1e', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <h5 style={{ fontSize: '13px', fontWeight: '500', color: '#f0ede8' }}>{item.title}</h5>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.date}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curated Collections */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '16px' }}>Curated Collections</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {discoveryFeedData[activeDiscoverType].collections.map((coll, idx) => (
                      <div key={idx} className="curated-collection-btn" style={{ background: '#161616', border: '1px solid #262626', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#fff' }}>{coll}</span>
                        <span style={{ color: 'var(--accent)', fontSize: '12px' }}>Explore →</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="matrix-legend-caption" style={{ borderTop: '1px solid #262626', paddingTop: '24px', marginTop: '24px' }}>
              Our editors trace design movements and regional narratives across the Philippine islands.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Layer 03 */}
      <section className="snap-section section-brokers">
        <div className="brokers-content">
          <header className="section-header-center">
            <span className="vector-label">Layer 03 // Trusted Guides</span>
            <h2>The Advisory</h2>
            <p>Connect with advisors who understand space, design, and architecture.</p>
          </header>
          
          <div className="brokers-blur-grid">
            {[
              { name: "Miguel Torres, REB", status: "Lead Design Advisor", history: "Specializes in BGC architectural modernism", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80", metrics: [
                { label: "Curations", value: "14 Spaces" },
                { label: "Experience", value: "8+ Years" },
                { label: "Curator Style", value: "Modernist" }
              ] },
              { name: "Elena Santos, REB", status: "Quiet Luxury Specialist", history: "Specializes in QC quiet luxury estates", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80", metrics: [
                { label: "Curations", value: "18 Spaces" },
                { label: "Experience", value: "10+ Years" },
                { label: "Curator Style", value: "Quiet Luxury" }
              ] },
              { name: "Marco Reyes, REB", status: "Island Retreats Curator", history: "Specializes in Siargao & island minimalist retreats", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80", metrics: [
                { label: "Curations", value: "22 Spaces" },
                { label: "Experience", value: "7+ Years" },
                { label: "Curator Style", value: "Minimalist" }
              ] }
            ].map((broker, i) => (
              <div key={i} className="broker-preview-card">
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundImage: `url(${broker.image})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%) contrast(1.2)', marginBottom: '16px', border: '2px solid var(--border-solid)' }}></div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '4px' }}>{broker.name} <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'normal', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '4px' }}>{broker.status}</span></h3>
                
                {/* 3-metric trust analytics block */}
                <div className="broker-metrics-block">
                  {broker.metrics.map((m, idx) => (
                    <div key={idx} className="broker-metric-item">
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500', display: 'block', textAlign: 'center', lineHeight: '1.2' }}>{m.label}</span>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#f0ede8', display: 'block', textAlign: 'center', lineHeight: '1.1' }}>{m.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '4px', width: '100%' }}>{broker.history}</div>
              </div>
            ))}
          </div>

          <div className="section-action-footer">
            <Link href="/brokers" className="prominent-action-link">
              CONNECT WITH AN ADVISOR →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: THE WISHLIST LAYER */}
      <section className="snap-section section-wishlist" style={{ padding: 0 }}>
        <div className="property-split">
          
          {/* Left Menu Panel */}
          <div className="property-menu">
            <div className="menu-header">
              <span className="vector-label">Layer 04 // Your Board</span>
              <h2>Your Board</h2>
              <p>Your inspiration archive. Collect design ideas, preferred cities, and target layouts.</p>
            </div>
            
            <div className="ledger-tags-guide" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                Your board acts as a local cryptographic ledger. Mark properties with four distinct reaction tags:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { tag: "Potential Fit", desc: "Properties matching parameters" },
                  { tag: "Interested", desc: "Strong candidates for contact" },
                  { tag: "Inspired Me", desc: "Design & styling inspiration" },
                  { tag: "Save", desc: "Saved to your ledger" }
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', border: '1px solid rgba(200, 169, 110, 0.3)', padding: '2px 8px', borderRadius: '2px', fontSize: '10px', textTransform: 'uppercase' }}>
                      {item.tag}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="menu-footer">
              <Link href="/wishlist" className="prominent-action-link">
                Open Your Ledger →
              </Link>
            </div>
          </div>

          {/* Right Visual Canvas */}
          <div className="matrix-preview-pane">
            <header className="pane-header">
              <h3>Personal Ledger System</h3>
              <p>Cryptographic flow mechanics of your private spatial archive.</p>
            </header>

            <div className="wishlist-infographics" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              {/* Connected Flow Steps */}
              <div className="flow-grid">
                
                {/* Step 1: Scan */}
                <div className="flow-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', border: '1px solid rgba(200,169,110,0.2)', padding: '2px 6px', borderRadius: '2px' }}>PHASE 01</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.05)' }}>01</span>
                  </div>
                  
                  {/* Schematic Graphic: Mini Grid */}
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #262626', background: 'rgba(0,0,0,0.3)', borderRadius: '2px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(200, 169, 110, 0.4)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="9"></rect>
                      <rect x="14" y="3" width="7" height="5"></rect>
                      <rect x="14" y="12" width="7" height="9"></rect>
                      <rect x="3" y="16" width="7" height="5"></rect>
                    </svg>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.05em', margin: '0 0 6px 0', fontFamily: 'var(--font-display)' }}>Scan Architecture</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>Filter and search deep editorial briefings of premium local properties.</p>
                  </div>
                </div>

                {/* Step 2: Tag */}
                <div className="flow-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', border: '1px solid rgba(200,169,110,0.2)', padding: '2px 6px', borderRadius: '2px' }}>PHASE 02</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.05)' }}>02</span>
                  </div>
                  
                  {/* Schematic Graphic: Floating Badges */}
                  <div style={{ height: '70px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', justifyContent: 'center', border: '1px dashed #262626', background: 'rgba(0,0,0,0.3)', borderRadius: '2px', padding: '0 10px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontSize: '8px', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '2px 4px', borderRadius: '2px', opacity: 0.8 }}>FIT</span>
                      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '2px' }}>INT</span>
                      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '2px' }}>INS</span>
                      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '2px' }}>SAV</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.05em', margin: '0 0 6px 0', fontFamily: 'var(--font-display)' }}>Apply Reaction</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>Mark listings with custom tags reflecting your evaluation phase.</p>
                  </div>
                </div>

                {/* Step 3: Archive */}
                <div className="flow-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', border: '1px solid rgba(200,169,110,0.2)', padding: '2px 6px', borderRadius: '2px' }}>PHASE 03</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.05)' }}>03</span>
                  </div>
                  
                  {/* Schematic Graphic: Vault lock */}
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #262626', background: 'rgba(0,0,0,0.3)', borderRadius: '2px' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(200, 169, 110, 0.4)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.05em', margin: '0 0 6px 0', fontFamily: 'var(--font-display)' }}>Secure Vault</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>Data is saved locally to your device's browser memory in complete isolation.</p>
                  </div>
                </div>

                {/* Step 4: Route */}
                <div className="flow-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', border: '1px solid rgba(200,169,110,0.2)', padding: '2px 6px', borderRadius: '2px' }}>PHASE 04</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.05)' }}>04</span>
                  </div>
                  
                  {/* Schematic Graphic: Handshake signal */}
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #262626', background: 'rgba(0,0,0,0.3)', borderRadius: '2px' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(200, 169, 110, 0.4)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.05em', margin: '0 0 6px 0', fontFamily: 'var(--font-display)' }}>Initialize Handshake</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>Connect with vetted space intelligence advisors to deploy your plans.</p>
                  </div>
                </div>

              </div>

              {/* Infographic Stats / Architecture Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', borderTop: '1px solid #262626', paddingTop: '24px' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '16px' }}>
                    Anonymous Ledger Policy
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    ScoutIt operates on a zero-tracking architecture. We do not store your search habits, cookies, or personal metrics on any central cloud server. Your board remains entirely yours—securely encrypted on your device.
                  </p>
                </div>
                
                <div>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '16px' }}>
                    Memory Ledger Parameters
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { metric: "Storage Technology", val: "LocalStorage API" },
                      { metric: "Data Encryption", val: "Decentralized (On-Device)" },
                      { metric: "Cloud Sinks", val: "None (Zero Server Sync)" }
                    ].map((st, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #222', paddingBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{st.metric}</span>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff' }}>{st.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            <div className="matrix-legend-caption" style={{ borderTop: '1px solid #262626', paddingTop: '24px', marginTop: '24px' }}>
              Your private collection of Philippine architectural inspirations. Keep them secure, revisit them anytime.
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 6: THE ABOUT US LAYER */}
      <section className="snap-section section-about">
        <div className="about-content">
          <header className="section-header-center">
            <h2>The ScoutIt Manifesto</h2>
          </header>
          
          <div className="about-manifesto-preview">
            <p className="manifesto-lead">
              We believe a home is more than a list of specifications. It is a space where your life unfolds. ScoutIt is an editorial archive created for the Philippine property dreamer.
            </p>
            <p className="manifesto-secondary">
              Instead of pressure-driven listings and corporate jargon, we curate architectural DNA, design history, and local narratives to help you discover spaces you'll truly love.
            </p>
          </div>

          <div className="section-action-footer">
            <Link href="/about" className="prominent-action-link">
              Read Our Full Story →
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        /* Cinematic Snap Container */
        .cinematic-container {
          height: 100vh;
          width: 100vw;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          background: var(--bg);
          color: var(--text-primary);
        }
        
        .cinematic-container::-webkit-scrollbar {
          display: none;
        }

        .snap-section {
          scroll-snap-align: start;
          width: 100%;
          height: 100vh;
          position: relative;
          overflow: hidden;
        }

        /* Prominent Action Links */
        .prominent-action-link {
          display: inline-block;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--accent);
          background: transparent;
          border: 1px solid var(--accent);
          padding: 16px 32px;
          border-radius: 4px;
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .prominent-action-link:hover {
          background: var(--accent);
          color: #000;
          box-shadow: 0 0 24px rgba(200, 169, 110, 0.2);
          transform: translateY(-2px);
        }

        .section-action-footer {
          text-align: center;
          margin-top: 64px;
        }

        /* ═══ SECTION 1: SPACE HERO ══════════════════════════════════ */
        .section-hook {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000000;
          overflow: hidden;
          position: relative;
        }

        .space-bg-container {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .black-hole-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            #000000 0%,
            #000000 35%,
            rgba(200, 169, 110, 0.04) 45%,
            rgba(200, 169, 110, 0.12) 55%,
            transparent 75%
          );
          border: 1px solid rgba(200, 169, 110, 0.18);
          box-shadow: 0 0 120px rgba(200, 169, 110, 0.14), inset 0 0 40px rgba(200, 169, 110, 0.08);
          pointer-events: none;
          z-index: 1;
          animation: slowOrbit 60s linear infinite;
        }

        /* Swirling accretion disk layer */
        .accretion-disk-outer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 750px;
          height: 750px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(200, 169, 110, 0.12) 0%,
            transparent 25%,
            rgba(200, 169, 110, 0.18) 50%,
            transparent 75%,
            rgba(200, 169, 110, 0.12) 100%
          );
          filter: blur(35px);
          animation: slowSwirl 45s linear infinite;
          z-index: 1;
          pointer-events: none;
        }

        .event-horizon {
          position: absolute;
          bottom: -150px;
          left: 50%;
          transform: translateX(-50%);
          width: 140vw;
          height: 350px;
          border-radius: 50% 50% 0 0;
          background: radial-gradient(
            ellipse at top,
            rgba(200, 169, 110, 0.22) 0%,
            rgba(200, 169, 110, 0.06) 40%,
            transparent 70%
          );
          filter: blur(40px);
          pointer-events: none;
          z-index: 2;
        }

        /* Swirling glow for event horizon */
        .event-horizon-swirl {
          position: absolute;
          bottom: -180px;
          left: 50%;
          transform: translateX(-50%);
          width: 150vw;
          height: 400px;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            rgba(200, 169, 110, 0.09) 0%,
            transparent 30%,
            rgba(200, 169, 110, 0.15) 50%,
            transparent 80%,
            rgba(200, 169, 110, 0.09) 100%
          );
          filter: blur(50px);
          animation: slowSwirl 90s linear infinite reverse;
          z-index: 2;
          pointer-events: none;
        }

        /* Distant stars twinkling animation */
        @keyframes slowOrbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes slowSwirl {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* ── Faint drifting rock fragments / meteors (Occasional) ──── */
        @keyframes driftToCenter {
          0% {
            transform: scale(1);
            opacity: 0;
          }
          15% {
            opacity: 0.85; /* Bright and visible during flight */
          }
          90% {
            opacity: 0.85; /* Stays bright and visible for longer, including the tail */
          }
          100% {
            left: 50%;
            top: 50%;
            transform: scale(0.05); /* Sucked fully into the horizon */
            opacity: 0;
            filter: blur(2.5px);
          }
        }

        /* ── Comet Elements ── */
        .comet-head {
          width: 100%;
          height: 100%;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(200, 169, 110, 0.4);
          position: relative;
        }
        .comet-tail {
          position: absolute;
          right: calc(100% - 2px);
          top: 50%;
          transform: translateY(-50%);
          width: 90px; /* Longer, highly noticeable tail */
          height: 3px; /* Thicker head connection */
          background: linear-gradient(to left, #ffffff 0%, rgba(200, 169, 110, 0.6) 30%, rgba(200, 169, 110, 0.15) 75%, transparent 100%);
          clip-path: polygon(0 50%, 100% 0, 100% 100%); /* Elegant taper wedge shape */
          pointer-events: none;
        }

        /* ── Drifting Neutron Star ── */
        .neutron-star-drifting {
          width: 100%;
          height: 100%;
          background: #e0f2fe;
          border-radius: 50%;
          box-shadow: 
            0 0 12px rgba(224, 242, 254, 0.9), 
            0 0 24px rgba(200, 169, 110, 0.6);
          animation: pulseNeutronDrifting 2.5s ease-in-out infinite alternate;
        }
        @keyframes pulseNeutronDrifting {
          0% {
            transform: scale(0.85);
            box-shadow: 
              0 0 8px rgba(224, 242, 254, 0.7), 
              0 0 16px rgba(200, 169, 110, 0.4);
          }
          100% {
            transform: scale(1.15);
            box-shadow: 
              0 0 16px rgba(224, 242, 254, 0.95), 
              0 0 32px rgba(200, 169, 110, 0.75);
          }
        }

        /* Static pulsing star styling removed per user request */

        /* ── Main wordmark container ─────────────────────────────── */
        .hook-content {
          text-align: center;
          z-index: 10;
          position: relative;
        }

        .scoutit-wordmark {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 0.04em;
          margin-bottom: 48px;
          line-height: 1;
        }

        /* Base letter style */
        .letter {
          font-family: var(--font-display);
          font-size: clamp(36px, 5.5vw, 64px);
          letter-spacing: 0.05em;
          color: var(--accent);
          display: inline-block;
          position: relative;
          opacity: 0;
        }

        /* ── S: Comet Trail ───────────────────────────── */
        .letter-s {
          animation: cometDraw 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
          text-shadow: 0 0 12px rgba(200, 169, 110, 0.5);
        }

        /* ── C: Eclipse Reveal ────────────────────────── */
        .letter-c {
          animation: eclipseReveal 0.65s ease forwards;
          clip-path: inset(0 100% 0 0);
        }

        /* ── O: Planet + Orbit Ring ───────────────────── */
        .letter-o {
          animation: planetPulse 0.6s ease forwards;
        }

        .orbit-ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 120%; height: 35%;
          border: 1px solid rgba(200,169,110,0.5);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotateX(65deg);
          animation: orbitSweep 1.4s ease-out 1.0s forwards;
          opacity: 0;
          pointer-events: none;
        }

        /* -- U: Signal Dish Fill -- */
        .letter-u {
          animation: signalFill 0.55s ease forwards;
        }

        /* ── T1: Satellite Arms ───────────────────────── */
        .letter-t1 {
          animation: satelliteArms 0.55s ease forwards;
          transform-origin: center center;
        }

        /* I — normal letter, just needs position:relative for the UFO anchor */
        .letter-i {
          animation: fadeIn 0.4s ease forwards;
          position: relative;
        }

        /* UFO ANCHOR — static centering, never animated.
           ::after drops the green cognition beam down through the I */
        .ufo-anchor {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          margin-bottom: 0.08em;
        }

        .ufo-anchor::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0.06em;
          min-width: 3px;
          height: 1.1em;
          background: linear-gradient(to bottom, rgba(34,197,94,0.35), transparent);
          animation: beamGlow 2.2s ease-in-out 3.5s infinite;
          opacity: 0;
          animation-fill-mode: forwards;
          border-radius: 0 0 2px 2px;
        }

        /* UFO FLOAT — only translateY animated, horizontal centering untouched */
        .ufo-float {
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          animation:
            ufoDescend 1.0s cubic-bezier(0.22,1,0.36,1) 2.3s forwards,
            float       3.5s ease-in-out 3.4s infinite;
        }

        /* GREEN UFO disc */
        .ufo-disc {
          width: 0.5em;
          height: 0.11em;
          background: linear-gradient(180deg, #6eff8a 0%, #1faa3a 100%);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,220,80,0.7), 0 0 22px rgba(0,220,80,0.3);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-evenly;
          padding: 0 6%;
        }

        .ufo-disc::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: transparent;
          box-shadow: 0 0 14px rgba(0,220,80,0.5);
          animation: discGlow 2.5s ease-in-out 3.5s infinite;
        }

        /* GREEN UFO dome */
        .ufo-dome {
          width: 0.22em;
          height: 0.12em;
          background: linear-gradient(180deg, rgba(80,255,120,0.2) 0%, rgba(0,200,60,0.08) 100%);
          border: 1px solid rgba(80,255,120,0.5);
          border-bottom: none;
          border-radius: 50% 50% 0 0;
        }

        /* GREEN UFO lights */
        .ufo-light {
          width: 0.04em;
          height: 0.04em;
          min-width: 3px;
          min-height: 3px;
          border-radius: 50%;
          background: #a8ffb8;
          box-shadow: 0 0 5px #50ff80;
        }


        .ufo {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }


        .ufo-light-1 { animation: blinkLight 1.2s ease-in-out 3.5s infinite; }
        .ufo-light-2 { animation: blinkLight 1.8s ease-in-out 3.9s infinite; }
        .ufo-light-3 { animation: blinkLight 1.5s ease-in-out 4.3s infinite; }

        /* Tractor beam (vertical stroke of I) */
        .ufo-beam {
          width: 0.08em;
          min-width: 4px;
          flex: 1;
          min-height: 0.55em;
          background: linear-gradient(to bottom, rgba(200,169,110,0.7) 0%, rgba(200,169,110,0.15) 100%);
          clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
          animation: beamPulse 2s ease-in-out 3.4s infinite;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        /* ── T2: Targeting Reticle ────────────────────── */
        .letter-t2 {
          animation: targetLock 0.6s ease forwards;
          position: relative;
        }

        .reticle-ring {
          position: absolute;
          top: 50%; left: 50%;
          border-radius: 50%;
          border: 1px solid rgba(200,169,110,0.5);
          transform: translate(-50%, -50%) scale(2);
          opacity: 0;
          pointer-events: none;
        }

        .reticle-1 {
          width: 1.4em; height: 1.4em;
          animation: reticleContract 0.5s ease 3.5s forwards;
        }
        .reticle-2 {
          width: 2.2em; height: 2.2em;
          animation: reticleContract 0.5s ease 3.65s forwards;
        }

        /* ── Subtitle ─────────────────────────────────── */
        .hook-subtitle {
          font-family: var(--font-mono);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: var(--text-muted);
          animation: fadeUp 1s ease 4.0s forwards;
          opacity: 0;
        }

        .hook-scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: fadeIn 1.5s ease 4.5s forwards;
          opacity: 0;
        }

        .scroll-text {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--accent);
        }

        .scroll-line {
          width: 1px;
          height: 60px;
          background: linear-gradient(to bottom, var(--accent) 0%, transparent 100%);
          animation: pulseLine 2s infinite;
        }

        .hero-tagline {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 68px);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.015em;
          color: var(--text-primary);
          margin-top: 0;
          margin-bottom: 24px;
          max-width: 18em;
          margin-left: auto;
          margin-right: auto;
          text-shadow: 0 2px 30px rgba(0,0,0,0.8);
          animation: fadeUp 1.2s ease 2.8s forwards;
          opacity: 0;
        }

        .hero-subheadline {
          font-family: var(--font-body);
          font-size: clamp(16px, 2.2vw, 22px);
          font-weight: 300;
          color: rgba(240, 237, 232, 0.85);
          margin-top: 0;
          margin-bottom: 48px;
          letter-spacing: 0.04em;
          text-shadow: 0 1px 15px rgba(0,0,0,0.8);
          animation: fadeUp 1.2s ease 3.2s forwards;
          opacity: 0;
        }

        .hero-cta-btn {
          display: inline-block;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: var(--accent);
          background: transparent;
          border: 1px solid var(--accent);
          padding: 20px 48px;
          border-radius: 2px;
          cursor: pointer;
          transition: all var(--transition);
          animation: fadeUp 1.2s ease 3.6s forwards;
          opacity: 0;
        }

        .hero-cta-btn:hover {
          background: var(--accent);
          color: #0e0e0e;
          box-shadow: 0 0 35px rgba(200, 169, 110, 0.45);
          transform: translateY(-2px);
        }

        /* KEYFRAMES ═══════════════════════════════════════════════════ */

        /* S — comet: draws left-to-right with trailing glow */
        @keyframes cometDraw {
          0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
          30%  { opacity: 1; clip-path: inset(0 60% 0 0); }
          100% { opacity: 1; clip-path: inset(0 0% 0 0); }
        }

        /* C — eclipse reveal */
        @keyframes eclipseReveal {
          0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
          100% { opacity: 1; clip-path: inset(0 0% 0 0); }
        }

        /* O — planet pulse */
        @keyframes planetPulse {
          0%   { opacity: 0; transform: scale(0.6); filter: blur(4px); }
          60%  { opacity: 1; transform: scale(1.08); filter: blur(0); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* O orbit ring sweep */
        @keyframes orbitSweep {
          0%   { opacity: 0.8; transform: translate(-50%, -50%) rotateX(65deg) rotateZ(0deg); }
          100% { opacity: 0;   transform: translate(-50%, -50%) rotateX(65deg) rotateZ(360deg); }
        }

        /* U — signal fill from bottom */
        @keyframes signalFill {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* T1 — satellite arms extend */
        @keyframes satelliteArms {
          0%   { opacity: 0; transform: scaleX(0.1); }
          50%  { opacity: 1; transform: scaleX(1.1); }
          100% { opacity: 1; transform: scaleX(1); }
        }

        /* UFO: drops from above into dot position */
        @keyframes ufoDescend {
          0%   { opacity: 0; transform: translateY(-180px); }
          60%  { opacity: 1; transform: translateY(4px); }
          80%  { transform: translateY(-2px); }
          100% { opacity: 1; transform: translateY(0px); }
        }

        /* UFO: idle vertical bob */
        @keyframes ufoHoverBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }

        /* UFO: idle horizontal sway */
        @keyframes ufoHoverSway {
          0%, 100% { margin-left: 0px; }
          33%       { margin-left: -3px; }
          66%       { margin-left: 3px; }
        }

        /* UFO disc glow pulse */
        @keyframes discGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(200,169,110,0.4); }
          50%       { box-shadow: 0 0 22px rgba(200,169,110,0.9), 0 0 40px rgba(200,169,110,0.2); }
        }

        /* UFO lights blink */
        @keyframes blinkLight {
          0%, 85%, 100% { opacity: 1; }
          88%, 97%       { opacity: 0.1; }
        }

        /* Tractor beam pulse */
        @keyframes beamPulse {
          0%   { opacity: 0.5; }
          50%  { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        /* T2 — reticle contract */
        @keyframes reticleContract {
          0%   { opacity: 0.8; transform: translate(-50%, -50%) scale(2); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(0.9); }
        }

        /* T2 — target lock-in */
        @keyframes targetLock {
          0%   { opacity: 0; transform: scale(1.3); filter: blur(3px); }
          70%  { opacity: 1; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }

        /* UFO gentle float bob ─────────────────── */
        @keyframes float {
          0%, 100% { transform: translateY(-3px); }
          50%       { transform: translateY(3px); }
        }

        /* Green cognition beam pulse ───────────── */
        @keyframes beamGlow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }

        /* Star twinkle — fast (bright, quick blink) */
        @keyframes twinkleFast {
          0%, 100% { opacity: 0;    transform: scale(0.8); }
          40%, 60% { opacity: 0.75; transform: scale(1.2); }
        }

        /* Star twinkle — medium */
        @keyframes twinkleMed {
          0%, 100% { opacity: 0;   transform: scale(0.9); }
          45%, 55% { opacity: 0.5; transform: scale(1.1); }
        }

        /* Star twinkle — slow (dim, deep-space) */
        @keyframes twinkleSlow {
          0%, 100% { opacity: 0;    }
          40%, 60% { opacity: 0.35; }
        }

        /* SECTION 2: PROPERTY LAYER */
        .property-split {
          display: flex;
          height: 100vh;
          width: 100%;
        }

        .property-menu {
          width: 22%;
          min-width: 280px;
          background: var(--surface);
          border-right: 1px solid var(--border-solid);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 120px 40px;
          z-index: 10;
        }

        .menu-header h2 {
          font-family: var(--font-display);
          font-size: 36px;
          margin: 12px 0;
          color: var(--text-primary);
        }

        .menu-header p {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .vector-label {
          font-family: var(--font-mono);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--accent);
        }

        .menu-nav {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .menu-btn {
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 28px;
          font-family: var(--font-display);
          padding: 20px 24px;
          cursor: pointer;
          transition: all var(--transition);
          border-radius: var(--radius-sm);
        }

        .menu-btn:hover {
          color: var(--accent);
          transform: scale(1.03);
          box-shadow: 0 0 20px rgba(200, 169, 110, 0.1);
          border-color: rgba(200, 169, 110, 0.25);
          padding-left: 28px;
        }

        .menu-btn.active {
          color: var(--accent);
          background: var(--surface2);
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(200, 169, 110, 0.05);
          padding-left: 28px;
        }

        .menu-footer {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .matrix-preview-pane {
          flex: 1;
          background: #121212;
          padding: 120px 48px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .pane-header {
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-solid);
        }

        .pane-header h3 {
          font-family: var(--font-display);
          font-size: 28px;
          color: #fff;
          margin-bottom: 4px;
        }

        .pane-header p {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .search-container {
          margin-bottom: 24px;
        }

        .search-input-wrapper {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .vector-search-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #333333;
          padding: 12px 16px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 11px;
          letter-spacing: 0.05em;
          outline: none;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .vector-search-input::placeholder {
          color: #666666;
        }

        .vector-search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 8px rgba(200, 169, 110, 0.15);
        }

        .search-suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background: #1a1a1a;
          border: 1px solid var(--border-solid);
          border-top: none;
          z-index: 50;
          display: flex;
          flex-direction: column;
        }

        .dropdown-item {
          padding: 10px 16px;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 11px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .dropdown-item:hover {
          background: #222222;
          color: var(--accent);
        }

        .empty-state-msg {
          color: var(--text-muted);
          font-size: 13px;
          font-style: italic;
          padding: 24px 0;
          grid-column: 1 / -1;
        }

        .flow-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .flow-card {
          background: #111111;
          border: 1px solid #222222;
          padding: 24px 20px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          transition: border-color var(--transition-fast), transform var(--transition-fast);
        }

        .flow-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
        }

        .mini-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .mini-preview-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }

        .mini-preview-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
        }

        .mini-card-visual {
          height: 180px;
          overflow: hidden;
          background: #000;
        }

        .mini-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.85;
          transition: transform 0.6s ease, opacity 0.6s ease;
        }

        .mini-preview-card:hover .mini-card-image {
          transform: scale(1.05);
          opacity: 1;
        }

        .home-card-reaction-overlay {
          opacity: 0;
          transition: opacity 0.3s ease;
          width: 100%;
          margin-top: 12px;
          padding: 0 20px;
        }

        .mini-preview-card:hover .home-card-reaction-overlay {
          opacity: 1;
        }

        .mini-card-body {
          padding: 20px;
        }

        .mini-card-body h4 {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .mini-card-tags {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mini-tag-wrapper {
          display: flex;
          flex-direction: column;
        }

        .mini-tag-label {
          color: var(--accent);
          font-size: 9px;
          letter-spacing: 0.1em;
          opacity: 0.75;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .mini-tag {
          font-size: 11px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 2px;
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
        }

        .matrix-legend-caption {
          margin-top: 24px;
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .curated-collection-btn {
          transition: all var(--transition-fast);
        }
        .curated-collection-btn:hover {
          border-color: var(--accent) !important;
          transform: translateX(4px);
          box-shadow: 0 0 12px rgba(200, 169, 110, 0.08);
        }

        /* SECTION 3: DISCOVER LAYER */
        .section-discover {
          background: var(--bg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
        }

        .discover-content {
          width: 100%;
          max-width: 1400px;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .discover-header {
          text-align: center;
        }

        .discover-header h2 {
          font-family: var(--font-display);
          font-size: 42px;
          margin: 12px 0;
        }

        .discover-header p {
          font-size: 15px;
          color: var(--text-secondary);
        }

        .discover-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          height: 400px;
        }

        .preview-card {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-solid);
          display: flex;
          align-items: flex-end;
          padding: 40px;
          transition: all var(--transition);
        }

        .preview-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .preview-card-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.4;
          transition: transform 0.6s ease, opacity 0.6s ease;
        }

        .preview-card:hover .preview-card-bg {
          transform: scale(1.05);
          opacity: 0.6;
        }

        .matrix-bg {
          background-image: url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80');
        }

        .news-bg {
          background-image: url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80');
        }

        .location-bg {
          background-image: url('https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80');
        }

        .preview-card-content {
          position: relative;
          z-index: 2;
        }

        .preview-card-content h3 {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin-bottom: 8px;
        }

        .preview-card-content p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        /* SECTION 4: BROKERS LAYER */
        .section-brokers {
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 120px 40px;
        }
        
        .brokers-content {
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .section-header-center {
          text-align: center;
        }

        .section-header-center h2 {
          font-family: var(--font-display);
          font-size: 42px;
          margin: 12px 0;
        }

        .section-header-center p {
          font-size: 15px;
          color: var(--text-secondary);
        }

        .brokers-blur-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .broker-preview-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-solid);
          border-radius: 8px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.3s ease;
          cursor: default;
        }

        .broker-preview-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
        }

        .broker-metrics-block {
          display: flex;
          gap: 8px;
          width: 100%;
          margin-bottom: 16px;
          margin-top: 16px;
        }

        .broker-metric-item {
          flex: 1;
          background: #0e0e0e;
          border: 1px solid #262626;
          padding: 16px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 0;
        }

        .broker-ghost-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          filter: blur(1px);
          transition: filter var(--transition-fast), background var(--transition-fast);
        }

        .broker-ghost-card:hover {
          filter: blur(0px);
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-border);
        }

        .broker-ghost-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(200, 169, 110, 0.1);
          border: 1px dashed var(--accent-border);
        }

        .broker-ghost-lines {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .broker-ghost-lines .line-1 {
          height: 12px;
          width: 70%;
          background: rgba(240, 237, 232, 0.1);
          border-radius: 2px;
        }

        .broker-ghost-lines .line-2 {
          height: 8px;
          width: 40%;
          background: rgba(240, 237, 232, 0.05);
          border-radius: 2px;
        }

        /* SECTION 5: WISHLIST LAYER */
        .section-wishlist {
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 40px;
        }

        .wishlist-content {
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .ledger-ghost {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .ledger-ghost-header {
          height: 48px;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid var(--border-solid);
        }

        .ledger-ghost-row {
          height: 72px;
          border-bottom: 1px solid var(--border-solid);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
          transition: background var(--transition-fast);
        }
        .ledger-ghost-row:last-child { border-bottom: none; }
        .ledger-ghost-row:hover { background: var(--surface2); }
        .ledger-ghost-row::before {
          content: "";
          height: 12px;
          width: 30%;
          background: rgba(240, 237, 232, 0.05);
          border-radius: 2px;
        }
        .ledger-ghost-row::after {
          content: "";
          height: 24px;
          width: 80px;
          background: rgba(200, 169, 110, 0.05);
          border: 1px solid rgba(200, 169, 110, 0.2);
          border-radius: 12px;
          margin-left: auto;
        }

        /* SECTION 6: ABOUT US LAYER */
        .section-about {
          background: #080808;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 120px 40px;
        }

        .about-content {
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 60px;
          text-align: center;
        }

        .about-manifesto-preview {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .manifesto-lead {
          font-family: var(--font-display);
          font-size: 32px;
          line-height: 1.5;
          color: var(--accent);
          opacity: 0.9;
        }

        .manifesto-secondary {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        /* Animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulseLine {
          0% { opacity: 0.2; height: 0px; }
          50% { opacity: 1; height: 60px; }
          100% { opacity: 0.2; height: 60px; }
        }

        @keyframes zoomIn {
          from { transform: scale(1.05); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Mobile Adjustments */
        @media (max-width: 1024px) {
          .cinematic-container {
            scroll-snap-type: none;
            height: auto;
            overflow-y: visible;
          }
          .snap-section {
            scroll-snap-align: none;
            height: auto !important;
            min-height: 100vh;
            overflow: visible;
          }
          .flow-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .property-split {
            flex-direction: column;
            height: auto;
          }
          .property-menu {
            width: 100%;
            padding: 32px 24px;
            border-right: none;
            border-bottom: 1px solid var(--border-solid);
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .menu-nav {
            flex-direction: row;
            overflow-x: auto;
            scrollbar-width: none;
            gap: 12px;
            width: 100%;
          }
          .menu-nav::-webkit-scrollbar {
            display: none;
          }
          .menu-btn {
            font-size: 18px;
            padding: 10px 16px;
            white-space: nowrap;
          }
          .menu-btn:hover, .menu-btn.active {
            padding-left: 16px;
          }
          .matrix-preview-pane {
            padding: 32px 24px;
            overflow-y: visible !important;
          }
          .discover-preview-grid, .brokers-blur-grid {
            grid-template-columns: 1fr;
            height: auto;
          }
          .preview-card {
            height: 250px;
          }
          .hook-title {
            font-size: 12vw;
          }
        }

        /* Draggable UFO and Radar scanner styles */
        .interactive-ufo-node {
          cursor: grab;
          transition: transform 0.2s ease;
          pointer-events: auto !important;
        }

        /* Floating UFO scanner when scrolled down */
        .floating-ufo-scanner-dock {
          position: fixed;
          top: 100px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(14, 14, 14, 0.85);
          border: 1px solid rgba(200, 169, 110, 0.3);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          justify-content: center;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(34, 197, 94, 0.15);
          animation: floatStickyDock 3.5s ease-in-out infinite alternate;
          transition: border-color 0.3s;
        }
        .floating-ufo-scanner-dock:hover {
          border-color: #22c55e;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 197, 94, 0.3);
        }
        @keyframes floatStickyDock {
          0% { transform: translateY(0); }
          100% { transform: translateY(-6px); }
        }

        .floating-ufo-scanner-dock .dock-label {
          font-family: var(--font-mono);
          font-size: 7px;
          letter-spacing: 0.1em;
          color: var(--accent);
          margin-top: 4px;
          position: absolute;
          bottom: -15px;
          white-space: nowrap;
          pointer-events: none;
        }
        
        .sticky-tooltip {
          bottom: 120% !important;
        }
        .sticky-sonar {
          width: 3.5em !important;
          height: 3.5em !important;
        }
        .interactive-ufo-node:hover {
          transform: scale(1.15);
        }
        .interactive-ufo-node:active {
          cursor: grabbing;
        }

        /* Onboarding Tooltip */
        .ufo-tooltip-onboarding {
          position: absolute;
          bottom: 160%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(14, 14, 14, 0.95);
          border: 1px solid #22c55e;
          color: #22c55e;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
          pointer-events: none;
          animation: floatTooltip 2.5s ease-in-out infinite alternate;
          z-index: 100;
        }
        @keyframes floatTooltip {
          0% { transform: translate(-50%, 0); }
          100% { transform: translate(-50%, -4px); }
        }

        /* Sonar ring pulse */
        .sonar-pulse-ring {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 2em;
          height: 2em;
          border: 1.5px solid rgba(34, 197, 94, 0.6);
          border-radius: 50%;
          pointer-events: none;
          animation: sonarRingPulse 2.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
          z-index: 99;
        }
        @keyframes sonarRingPulse {
          0% {
            width: 1em;
            height: 1em;
            opacity: 0.8;
          }
          100% {
            width: 3.5em;
            height: 3.5em;
            opacity: 0;
          }
        }

        /* Glowing green beam below active dragging UFO */
        .ufo-scan-beam-active {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translateX(-50%);
          width: 0.25em;
          height: 80vh;
          background: linear-gradient(to bottom, rgba(34, 197, 94, 0.45) 0%, rgba(34, 197, 94, 0.02) 100%);
          filter: blur(2px);
          pointer-events: none;
          border-radius: 50%;
          animation: laserPulse 1.5s ease-in-out infinite alternate;
        }
        @keyframes laserPulse {
          0% { opacity: 0.6; width: 0.2em; }
          100% { opacity: 1; width: 0.35em; }
        }

        /* Expand pulse scanning wave when released */
        .scan-pulse-wave {
          position: fixed;
          border: 2px solid #22c55e;
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          z-index: 99998;
          animation: scanExplode 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
        @keyframes scanExplode {
          0% {
            width: 0px;
            height: 0px;
            opacity: 1;
            box-shadow: inset 0 0 15px rgba(34,197,94,0.8), 0 0 15px rgba(34,197,94,0.8);
          }
          100% {
            width: 600px;
            height: 600px;
            opacity: 0;
            box-shadow: inset 0 0 40px rgba(34,197,94,0), 0 0 40px rgba(34,197,94,0);
          }
        }

        /* HUD Scanner Console styles */
        .hud-scanner-console {
          position: fixed;
          top: 0;
          right: -380px;
          width: 350px;
          height: 100vh;
          background: rgba(14, 14, 14, 0.9);
          border-left: 1px solid var(--accent);
          backdrop-filter: blur(20px);
          box-shadow: -10px 0 40px rgba(0,0,0,0.8);
          z-index: 100001;
          display: flex;
          flex-direction: column;
          transition: right 0.5s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .hud-scanner-console.open {
          right: 0;
        }

        .hud-console-header {
          display: flex;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(200, 169, 110, 0.2);
        }
        .hud-status-led {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          margin-right: 12px;
          animation: ledBlink 1.5s infinite alternate;
        }
        @keyframes ledBlink {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .hud-header-title {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.2em;
          color: var(--accent);
          font-weight: bold;
          flex-grow: 1;
        }
        .hud-close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 24px;
          cursor: pointer;
          transition: color 0.2s;
          line-height: 1;
          padding: 0;
        }
        .hud-close-btn:hover {
          color: var(--accent);
        }

        .hud-console-body {
          flex-grow: 1;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
        }
        .hud-scan-title {
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 0.1em;
          color: #22c55e;
          margin: 0 0 16px 0;
        }
        .hud-scan-divider {
          width: 30px;
          height: 2px;
          background: #22c55e;
          margin-bottom: 24px;
          box-shadow: 0 0 6px #22c55e;
        }
        .hud-scan-intel {
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.6;
          color: rgba(240, 237, 232, 0.85);
          margin: 0;
        }

        .hud-console-footer {
          padding: 24px;
          border-top: 1px solid rgba(200, 169, 110, 0.15);
          background: rgba(200, 169, 110, 0.02);
        }
        .hud-action-btn {
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.25em;
          cursor: pointer;
          transition: all 0.25s;
        }
        .hud-action-btn:hover {
          background: var(--accent);
          color: #0e0e0e;
          box-shadow: 0 0 15px rgba(200, 169, 110, 0.3);
        }

        @media (max-width: 640px) {
          .flow-grid {
            grid-template-columns: 1fr;
          }
          .hud-scanner-console {
            top: auto;
            bottom: -50vh;
            right: 0;
            width: 100%;
            height: 45vh;
            border-left: none;
            border-top: 1px solid var(--accent);
            transition: bottom 0.5s cubic-bezier(0.25, 1, 0.5, 1);
            border-radius: 12px 12px 0 0;
          }
          .hud-scanner-console.open {
            bottom: 0;
          }
        }
      `}</style>

      {/* UFO Circle to Search dragging canvas overlay */}
      {ufoDragging && (
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            touchAction: 'none',
            background: 'transparent',
            cursor: 'crosshair',
          }}
        />
      )}

      {/* Dragging UFO overlay */}
      {ufoDragging && (
        <div 
          className={`ufo-drag-overlay ${ufoReturning ? 'returning' : ''}`}
          style={{
            position: 'fixed',
            left: ufoPos.x,
            top: ufoPos.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100000,
            transition: ufoReturning ? 'all 0.7s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
          }}
        >
          {/* Laser scanning beam below active UFO */}
          {!ufoReturning && (
            <div className="ufo-scan-beam-active"></div>
          )}
          
          <span className="ufo floating-ufo">
            <span className="ufo-dome"></span>
            <span className="ufo-disc">
              <span className="ufo-light ufo-light-1"></span>
              <span className="ufo-light ufo-light-2"></span>
              <span className="ufo-light ufo-light-3"></span>
            </span>
          </span>
        </div>
      )}

      {/* Expanding Scan Pulse shockwave on release */}
      {isScanning && (
        <div 
          className="scan-pulse-wave"
          style={{
            left: ufoPos.x,
            top: ufoPos.y
          }}
        />
      )}

      {/* Holographic Slide-out Scan Console */}
      <div className={`hud-scanner-console ${hudOpen ? 'open' : ''}`}>
        <div className="hud-console-header">
          <span className="hud-status-led"></span>
          <span className="hud-header-title">INTEL DECRYPTOR</span>
          <button className="hud-close-btn" onClick={() => setHudOpen(false)}>×</button>
        </div>
        
        {scanResult && hudOpen && (
          <div className="hud-console-body">
            <h3 className="hud-scan-title">{scanResult.title}</h3>
            <div className="hud-scan-divider"></div>
            <p className="hud-scan-intel">
              <TypewriterText text={scanResult.intel} />
            </p>
          </div>
        )}
        
        <div className="hud-console-footer">
          <button className="hud-action-btn" onClick={() => setHudOpen(false)}>
            DISMISS INTEL
          </button>
        </div>
      </div>

      {/* Floating UFO scanner when scrolled down */}
      {isUfoSticky && !ufoDragging && (
        <div className="floating-ufo-scanner-dock">
          {/* Sonar and tooltip badge */}
          {!hasScannedOnce && (
            <span className="ufo-tooltip-onboarding sticky-tooltip">
              [ DRAG TO SCAN ]
            </span>
          )}
          {!hasScannedOnce && (
            <span className="sonar-pulse-ring sticky-sonar"></span>
          )}
          
          <span 
            className="ufo interactive-ufo-node"
            onPointerDown={handleDragStart}
            style={{ touchAction: 'none' }}
          >
            <span className="ufo-dome"></span>
            <span className="ufo-disc">
              <span className="ufo-light ufo-light-1"></span>
              <span className="ufo-light ufo-light-2"></span>
              <span className="ufo-light ufo-light-3"></span>
            </span>
          </span>
          <div className="dock-label">SCANNER</div>
        </div>
      )}
    </main>
  );
}

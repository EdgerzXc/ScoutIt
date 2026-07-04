"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import ReactionButtons from "@/components/ui/ReactionButtons";
import ProfileButton from "@/components/ui/ProfileButton";
import BoardPodium from "@/components/board/BoardPodium";
import CinematicJourney from "@/components/cinematic/CinematicJourney";
import Footer from "@/components/layout/Footer";
import { Building2, Camera, Search, CalendarDays } from "lucide-react";
import { isLiteMode } from "@/lib/liteMode";

// Scrollytelling manifesto ΓÇö lazy-loaded so it costs the homepage nothing
// until the UFO is clicked.
const DescentSequence = dynamic(
  () => import("@/components/scrollytelling/DescentSequence"),
  { ssr: false }
);




function getDBCategory(cat) {
  if (cat === "Venues/Events") return "Venues";
  return cat;
}

export default function Home() {
  const router = useRouter();

    

  const [activePropertyType, setActivePropertyType] = useState("Residential");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeDiscoverType, setActiveDiscoverType] = useState("Residential");
  const [driftingRocks, setDriftingRocks] = useState([]);
  const [descentActive, setDescentActive] = useState(false); // scrollytelling manifesto
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scoutit_user");
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);
  const containerRef = useRef(null);
  const eventHorizonRef = useRef(null);

  // Title-screen beam interaction (auto-fires on load + on UFO click)
  const [fireId, setFireId]   = useState(0);   // remounts the beam to replay its animation
  const [flashId, setFlashId] = useState(0);   // remounts the wordmark impact flash
  const [wordLit, setWordLit] = useState(false);
  const [powering, setPowering] = useState(false);
  const beamTimers = useRef([]);
  const beamInterval = useRef(null); // repeating auto-fire interval

  const fireBeam = useCallback((withPower) => {
    beamTimers.current.forEach(clearTimeout);
    beamTimers.current = [];
    const push = (fn, ms) => beamTimers.current.push(setTimeout(fn, ms));
    const launch = () => {
      setFireId((id) => id + 1);                                    // (re)play beam
      push(() => { setWordLit(true); setFlashId((f) => f + 1); }, 600); // beam reaches wordmark
      push(() => setWordLit(false), 1600);                          // hold, then 2s glow fade-back
    };
    if (withPower) {
      setPowering(true);
      push(() => { setPowering(false); launch(); }, 500);           // power-up flash, then fire
      // Cinematic journey disabled ΓÇö beam sequence ends here.
    } else {
      launch();
    }
  }, []);

  // Auto-fire on load, then repeat every 6s so the beam stays visible on both mobile & desktop
  useEffect(() => {
    if (isLiteMode()) return; // Lite Mode: no beam loop
    const t = setTimeout(() => {
      fireBeam(false);
      beamInterval.current = setInterval(() => fireBeam(false), 6000);
    }, 2000);
    return () => {
      clearTimeout(t);
      if (beamInterval.current) clearInterval(beamInterval.current);
    };
  }, [fireBeam]);
  // Clear any pending beam timers on unmount
  useEffect(() => () => {
    beamTimers.current.forEach(clearTimeout);
    if (beamInterval.current) clearInterval(beamInterval.current);
  }, []);

  // ΓöÇΓöÇ Event-horizon pull field (canvas) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    if (isLiteMode()) return; // Lite Mode: skip the cosmic canvas entirely
    const canvas = eventHorizonRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rand = (min, max) => min + Math.random() * (max - min);
    let w = 0, h = 0, cx = 0, cy = 0, maxR = 0, dpr = 1;
    let stars = [], bodies = [], dust = [], rings = [], comets = [];
    let pulseRings = [];
    let nextPulseAt = 2.5;
    let raf = 0;
    let t = 0;

    const edgeRadius = () => maxR * rand(0.75, 1.05);

    const initStar = () => ({
      angle: rand(0, Math.PI * 2),
      radius: edgeRadius(),
      size: rand(0.4, 1.8),
      baseOpacity: rand(0.3, 0.9),
      pull: rand(0.0003, 0.0012),
      twPhase: rand(0, Math.PI * 2),
      twSpeed: rand(0.6, 1.8),
    });
    const BODY_COLORS = [
      () => `rgba(232, 174, 60,${rand(0.3, 0.6).toFixed(2)})`,   // gold
      () => `rgba(240,237,232,${rand(0.2, 0.4).toFixed(2)})`,   // warm white
      () => `rgba(136,136,170,${rand(0.2, 0.4).toFixed(2)})`,   // cool blue
    ];
    const initBody = () => ({
      angle: rand(0, Math.PI * 2),
      radius: edgeRadius(),
      size: rand(2, 6),
      pull: rand(0.0004, 0.0009),
      angVel: rand(-0.0009, 0.0009),     // gentle arc / lensing curve
      color: BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)](),
    });
    const initDust = () => ({
      angle: rand(0, Math.PI * 2),
      radius: edgeRadius(),
      length: rand(8, 20),
      opacity: rand(0.1, 0.2),
      pull: rand(0.0004, 0.0011),
      warm: Math.random() > 0.5,
    });
    const initComet = (spread = true) => ({
      angle: rand(0, Math.PI * 2),
      // spread along the path on first build so arrivals are staggered
      radius: spread ? rand(maxR * 0.45, maxR * 1.05) : edgeRadius(),
      speed: rand(0.8, 2),                                   // px per frame @60fps
      tail: rand(40, 100),
      size: rand(1.5, 2.5),
      angVel: Math.random() < 0.5 ? rand(-0.001, 0.001) : 0, // some curve slightly
      delay: rand(0, 5),                                     // stagger first appearance (s)
    });

    const buildScene = () => {
      const starCount = Math.round(rand(150, 180));
      const bodyCount = Math.round(rand(8, 10));
      const dustCount = Math.round(rand(4, 6));
      stars = Array.from({ length: starCount }, initStar);
      bodies = Array.from({ length: bodyCount }, initBody);
      dust = Array.from({ length: dustCount }, initDust);
      comets = Array.from({ length: Math.round(rand(4, 6)) }, () => initComet(true));
      pulseRings = [];
      nextPulseAt = t + rand(2, 3);
      const base = Math.min(w, h);
      rings = [0.16, 0.27, 0.4, 0.56].map((f, i) => ({
        r: base * f,
        phase: rand(0, Math.PI * 2),
        speed: rand(0.4, 0.9),
        lo: 0.03, hi: 0.07,
        inner: i === 0,
        outer: i === 3,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      maxR = Math.hypot(w, h) / 2 * 1.05;
      buildScene();
    };

    const draw = (dt) => {
      t += dt;
      ctx.clearRect(0, 0, w, h);

      // Inner core breath ΓÇö central glow opacity oscillates (~4s cycle)
      const coreOp = 0.08 + 0.04 * Math.sin(t * 1.5);
      const coreR = Math.min(w, h) * 0.22;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, `rgba(232, 174, 60,${coreOp.toFixed(3)})`);
      coreGrad.addColorStop(1, "rgba(232, 174, 60,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Black-hole darkness pulse ΓÇö expands to pull light in, contracts to release it.
      // 5s cycle, offset 2.5s from the outer ring so they alternate (dark center while
      // outer ring brightens, then center glows while outer ring dims).
      const darkF = 0.5 + 0.5 * Math.sin((t - 2.5) * (2 * Math.PI / 5));
      const darkR = Math.min(w, h) * (0.10 + 0.14 * darkF);
      const darkGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, darkR);
      darkGrad.addColorStop(0, `rgba(0,0,0,${(0.7 * darkF).toFixed(3)})`);
      darkGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, darkR, 0, Math.PI * 2);
      ctx.fillStyle = darkGrad;
      ctx.fill();

      // Pulse shockwave rings ΓÇö emanate every 3-4s, decelerating as they expand
      if (t >= nextPulseAt) {
        pulseRings.push({ age: 0 });
        nextPulseAt = t + rand(3, 4);
      }
      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const pr = pulseRings[i];
        pr.age += dt;
        const p = pr.age / 2.5;
        if (p >= 1) { pulseRings.splice(i, 1); continue; }
        const eased = 1 - Math.pow(1 - p, 2);          // shockwave: fast then slows
        const r = 40 + (300 - 40) * eased;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 174, 60,${(0.12 * (1 - p)).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Event-horizon rings (subtle breathing) + rotating lensing arc
      rings.forEach((ring) => {
        let op, lw = 1;
        if (ring.outer) {
          // Bold 4s breathe: opacity 0.05ΓåÆ0.35, stroke 1ΓåÆ2.5px
          const f = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 4));
          op = 0.05 + 0.30 * f;
          lw = 1 + 1.5 * f;
        } else {
          op = ring.lo + (ring.hi - ring.lo) * (0.5 + 0.5 * Math.sin(t * ring.speed + ring.phase));
        }
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 174, 60,${op.toFixed(3)})`;
        ctx.lineWidth = lw;
        ctx.stroke();
        if (ring.inner) {
          const a0 = (t * 0.25) % (Math.PI * 2);
          ctx.beginPath();
          ctx.arc(cx, cy, ring.r, a0, a0 + Math.PI * 0.6);
          ctx.strokeStyle = `rgba(232, 174, 60,${(op * 2.4).toFixed(3)})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      });

      // Dust trails ΓÇö radial streaks, fading as they fall in
      dust.forEach((d) => {
        d.radius *= (1 - d.pull);
        if (d.radius < 30) Object.assign(d, initDust(), { radius: edgeRadius() });
        const x = cx + Math.cos(d.angle) * d.radius;
        const y = cy + Math.sin(d.angle) * d.radius;
        const x2 = cx + Math.cos(d.angle) * (d.radius + d.length);
        const y2 = cy + Math.sin(d.angle) * (d.radius + d.length);
        const fade = Math.min(1, d.radius / (maxR * 0.6));
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x2, y2);
        ctx.strokeStyle = d.warm
          ? `rgba(240,237,232,${(d.opacity * fade).toFixed(3)})`
          : `rgba(232, 174, 60,${(d.opacity * fade).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Stars ΓÇö slow straight pull toward center + gentle twinkle
      stars.forEach((s) => {
        s.radius *= (1 - s.pull);
        if (s.radius < 30) Object.assign(s, initStar(), { radius: edgeRadius() });
        const x = cx + Math.cos(s.angle) * s.radius;
        const y = cy + Math.sin(s.angle) * s.radius;
        const tw = 0.75 + 0.25 * Math.sin(t * s.twSpeed + s.twPhase);
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,237,232,${(s.baseOpacity * tw).toFixed(3)})`;
        ctx.fill();
      });

      // Heavenly bodies ΓÇö curved (spiral) infall with soft glow halo
      bodies.forEach((b) => {
        b.radius *= (1 - b.pull);
        b.angle += b.angVel;
        if (b.radius < 30) Object.assign(b, initBody(), { radius: edgeRadius() });
        const x = cx + Math.cos(b.angle) * b.radius;
        const y = cy + Math.sin(b.angle) * b.radius;
        const haloR = b.size * 2.5;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, haloR);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(x, y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
      });

      // Comets ΓÇö bright heads with gold tails, pulled straight toward center
      comets.forEach((c) => {
        if (c.delay > 0) { c.delay -= dt; return; }
        c.radius -= c.speed * dt * 60;
        c.angle += c.angVel;
        if (c.radius < 30) {
          Object.assign(c, initComet(false), { delay: rand(0.5, 4) });
          return;
        }
        const hx = cx + Math.cos(c.angle) * c.radius;
        const hy = cy + Math.sin(c.angle) * c.radius;
        const tx = cx + Math.cos(c.angle) * (c.radius + c.tail);
        const ty = cy + Math.sin(c.angle) * (c.radius + c.tail);
        const grad = ctx.createLinearGradient(hx, hy, tx, ty);
        grad.addColorStop(0, "rgba(232, 174, 60,0.8)");
        grad.addColorStop(1, "rgba(232, 174, 60,0)");
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy, c.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,250,235,0.95)";
        ctx.shadowColor = "rgba(232, 174, 60,0.9)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    // Only animate while the hero canvas is actually on screen ΓÇö once the user
    // scrolls to lower sections, a 60fps canvas keeps competing with the
    // scroll/snap animation for frame time.
    let running = false;
    let visible = true;
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const syncRunning = () => {
      if (visible && !document.hidden) start();
      else stop();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncRunning();
    });
    observer.observe(canvas);
    const onVisibility = () => syncRunning();
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    draw(0);                 // paint one frame immediately (no blank flash before rAF)
    start();
    window.addEventListener("resize", resize);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const [discoveryFeed, setDiscoveryFeed] = useState([]);
  const [categoryPreviews, setCategoryPreviews] = useState({});
  const [locations, setLocations] = useState([
    "BGC Core", "Makati Central", "Roxas Triangle", "Quezon City", 
    "Quezon Province", "Alabang", "Siargao"
  ]);

  // Fetch live CMS data from Airtable
  useEffect(() => {
    async function loadCMSData() {
      try {
        const res = await fetch("/api/cms");
        if (!res.ok) return;
        const data = await res.json();
        
        // 1. Group/format Properties for categoryPreviews
        const airtableProperties = data.properties || [];
        const basePreviews = {};
        
        const updatedPreviews = {
          Residential: [...basePreviews.Residential],
          Commercial: [...basePreviews.Commercial],
          STR: [...basePreviews.STR],
          Hospitality: [...basePreviews.Hospitality],
          Restaurants: [...basePreviews.Restaurants],
          Venues: [...basePreviews.Venues],
        };
        
        const newLocations = [
          "BGC Core", "Makati Central", "Roxas Triangle", "Quezon City", 
          "Quezon Province", "Alabang", "Siargao"
        ];
        
        airtableProperties.forEach((p) => {
          if (!p.title || !p.slug || !p.spaceCategory) return;
          let category = p.spaceCategory;
          if (updatedPreviews[category]) {
            if (!updatedPreviews[category].some(x => x.id === p.id || x.id === p.slug)) {
              updatedPreviews[category].unshift({
                id: p.slug || p.id,
                slug: p.slug || p.id,
                title: p.title,
                image: p.image || (p.photos?.[0]) || "",
                tags: [
                  `Aesthetic: ${p.aestheticTag || "Modernist"}`,
                  `Spatial Density: ${p.spatialDensity || "Low"}`,
                  `Location: ${p.location || p.city}`
                ]
              });
            }
          }
          
          if (p.city && !newLocations.includes(p.city)) {
            newLocations.push(p.city);
          }
          if (p.location && !newLocations.includes(p.location)) {
            newLocations.push(p.location);
          }
        });
        
        setCategoryPreviews(updatedPreviews);
        setLocations(newLocations);
        
        // 2. Group/format Properties & Intel for discoveryFeed
        const baseFeed = [];
        const updatedFeed = {
          Residential: { ...baseFeed.Residential, spotlights: [...baseFeed.Residential.spotlights], news: [...baseFeed.Residential.news], collections: [...baseFeed.Residential.collections] },
          Commercial: { ...baseFeed.Commercial, spotlights: [...baseFeed.Commercial.spotlights], news: [...baseFeed.Commercial.news], collections: [...baseFeed.Commercial.collections] },
          STR: { ...baseFeed.STR, spotlights: [...baseFeed.STR.spotlights], news: [...baseFeed.STR.news], collections: [...baseFeed.STR.collections] },
          Hospitality: { ...baseFeed.Hospitality, spotlights: [...baseFeed.Hospitality.spotlights], news: [...baseFeed.Hospitality.news], collections: [...baseFeed.Hospitality.collections] },
          Restaurants: { ...baseFeed.Restaurants, spotlights: [...baseFeed.Restaurants.spotlights], news: [...baseFeed.Restaurants.news], collections: [...baseFeed.Restaurants.collections] },
          Venues: { ...baseFeed.Venues, spotlights: [...baseFeed.Venues.spotlights], news: [...baseFeed.Venues.news], collections: [...baseFeed.Venues.collections] },
        };
        
        airtableProperties.forEach((p) => {
          if (!p.title || !p.slug || !p.spaceCategory) return;
          let category = p.spaceCategory;
          if (updatedFeed[category]) {
            if (!updatedFeed[category].spotlights.some(x => x.slug === p.slug || x.id === p.id)) {
              updatedFeed[category].spotlights.unshift({
                id: p.id,
                slug: p.slug || p.id,
                title: p.title,
                location: p.location || p.city,
                style: p.aestheticTag || "Modernist",
                image: p.image || (p.photos?.[0]) || "",
                desc: p.hook || ""
              });
            }
          }
        });
        
        const airtableIntel = data.intel || [];
        airtableIntel.forEach((item) => {
          let category = item.category || "Residential";
          if (category.toLowerCase() === "hospitality") category = "Hospitality";
          if (category.toLowerCase() === "str") category = "STR";
          if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Restaurants";
          if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";
          
          if (updatedFeed[category]) {
            if (!updatedFeed[category].news.some(x => x.slug === item.slug)) {
              updatedFeed[category].news.unshift({
                slug: item.slug || item.id,
                title: item.title,
                date: item.date || "Just Now",
                excerpt: item.excerpt || ""
              });
            }
          }
        });
 
        // Dynamic Spotlight Match Logic
        const allArticles = [
          ...airtableIntel.map(item => {
            let category = item.category || "Residential";
            if (category.toLowerCase() === "hospitality") category = "Hospitality";
            if (category.toLowerCase() === "str") category = "STR";
            if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Restaurants";
            if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";
            return { ...item, category };
          }),
          ...getArticles().map(art => {
            let category = art.category || "Residential";
            if (category.toLowerCase() === "hospitality") category = "Hospitality";
            if (category.toLowerCase() === "str") category = "STR";
            if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Restaurants";
            if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";
            return { slug: art.slug, title: art.title, category, excerpt: art.excerpt };
          })
        ];
 
        const findNewsForSpotlight = (spot, category) => {
          const matchCity = allArticles.find(art => {
            const spotLoc = spot.location || "";
            const artCity = art.city || "";
            return spotLoc && artCity && (spotLoc.toLowerCase().includes(artCity.toLowerCase()) || artCity.toLowerCase().includes(spotLoc.toLowerCase()));
          });
          if (matchCity) return matchCity;
          
          const matchCategory = allArticles.find(art => art.category === category);
          return matchCategory || null;
        };
 
        for (const cat in updatedFeed) {
          updatedFeed[cat].spotlights = updatedFeed[cat].spotlights.map(spot => {
            const news = findNewsForSpotlight(spot, cat);
            return {
              ...spot,
              newsTitle: news ? news.title : null,
              newsSlug: news ? news.slug : null,
              newsExcerpt: news ? (news.excerpt || news.lead || "") : null
            };
          });
        }
        
        setDiscoveryFeed(updatedFeed);
        
      } catch (err) {
        console.error("Failed to load CMS data on homepage:", err);
        // Fallback matching for base feed
        const baseFeed = [];
        const updatedFeed = {
          Residential: { ...baseFeed.Residential, spotlights: [...baseFeed.Residential.spotlights], news: [...baseFeed.Residential.news], collections: [...baseFeed.Residential.collections] },
          Commercial: { ...baseFeed.Commercial, spotlights: [...baseFeed.Commercial.spotlights], news: [...baseFeed.Commercial.news], collections: [...baseFeed.Commercial.collections] },
          STR: { ...baseFeed.STR, spotlights: [...baseFeed.STR.spotlights], news: [...baseFeed.STR.news], collections: [...baseFeed.STR.collections] },
          Hospitality: { ...baseFeed.Hospitality, spotlights: [...baseFeed.Hospitality.spotlights], news: [...baseFeed.Hospitality.news], collections: [...baseFeed.Hospitality.collections] },
          Restaurants: { ...baseFeed.Restaurants, spotlights: [...baseFeed.Restaurants.spotlights], news: [...baseFeed.Restaurants.news], collections: [...baseFeed.Restaurants.collections] },
          Venues: { ...baseFeed.Venues, spotlights: [...baseFeed.Venues.spotlights], news: [...baseFeed.Venues.news], collections: [...baseFeed.Venues.collections] },
        };
        const allArticles = getArticles().map(art => {
          let category = art.category || "Residential";
          if (category.toLowerCase() === "hospitality") category = "Hospitality";
          if (category.toLowerCase() === "str") category = "STR";
          if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Restaurants";
          if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";
          return { slug: art.slug, title: art.title, category, excerpt: art.excerpt };
        });
        const findNewsForSpotlight = (spot, category) => {
          const matchCity = allArticles.find(art => {
            const spotLoc = spot.location || "";
            const artCity = art.city || "";
            return spotLoc && artCity && (spotLoc.toLowerCase().includes(artCity.toLowerCase()) || artCity.toLowerCase().includes(spotLoc.toLowerCase()));
          });
          if (matchCity) return matchCity;
          const matchCategory = allArticles.find(art => art.category === category);
          return matchCategory || null;
        };
        for (const cat in updatedFeed) {
          updatedFeed[cat].spotlights = updatedFeed[cat].spotlights.map(spot => {
            const news = findNewsForSpotlight(spot, cat);
            return {
              ...spot,
              newsTitle: news ? news.title : null,
              newsSlug: news ? news.slug : null,
              newsExcerpt: news ? (news.excerpt || "") : null
            };
          });
        }
        setDiscoveryFeed(updatedFeed);
      }
    }
    
    loadCMSData();
  }, []);

  // Restore scroll position from sessionStorage
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("homepage_scroll");
    if (savedScroll && containerRef.current) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = parseInt(savedScroll, 10);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save scroll position at most once per frame ΓÇö writing sessionStorage on
  // every scroll event adds main-thread work during the scroll itself.
  const scrollSaveRaf = useRef(0);
  const handleScroll = (e) => {
    const target = e.currentTarget;
    if (!target || scrollSaveRaf.current) return;
    scrollSaveRaf.current = requestAnimationFrame(() => {
      scrollSaveRaf.current = 0;
      sessionStorage.setItem("homepage_scroll", target.scrollTop.toString());
    });
  };
  useEffect(() => () => {
    if (scrollSaveRaf.current) cancelAnimationFrame(scrollSaveRaf.current);
  }, []);

  useEffect(() => {
    let active = true;
    
    // Detect mobile and reduced-motion preferences for performance optimization
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Disable animations in Lite Mode, with reduced motion, or on very small mobile
    if (isLiteMode() || prefersReducedMotion || (isMobile && window.innerWidth < 480)) {
      setDriftingRocks([]);
      return;
    }
    
    const spawnRock = () => {
      if (!active) return;
      
      // Limit max particles on mobile
      const maxParticles = isMobile ? 3 : 8;
      if (driftingRocks.length >= maxParticles) return;
      
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

      // Mobile: spawn slower for performance; Desktop: spawn faster for impact
      const nextDelay = isMobile ? 
        (6000 + Math.random() * 4000) :  // 6-10s on mobile
        (4000 + Math.random() * 5000);   // 4-9s on desktop
      timerId = setTimeout(spawnRock, nextDelay);
    };

    let timerId = setTimeout(spawnRock, isMobile ? 3000 : 2000); // delay animation start on mobile

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [driftingRocks.length]);
  
  const propertyTypes = ["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"];

  const discoverHubs = [];

  // Stars and glitters particle arrays removed for clean cinematic hero redesign

  return (
    <main
      ref={containerRef}
      onScroll={handleScroll}
      className={`cinematic-container ${descentActive ? "descending" : ""}`}
    >
      {/* Scrollytelling manifesto overlay (Stage 1: descent only) */}
      {descentActive && (
        <DescentSequence onExit={() => setDescentActive(false)} />
      )}
      {/* Account / profile access ΓÇö hidden during the descent so the
          manifesto overlay stays immersive */}
      {!descentActive && <ProfileButton floating />}
      {/* SECTION 1: SPACE HERO */}
      <section className="snap-section section-hook">
        <div className="grain"></div>

        {/* Cinematic Cosmic Space Background */}
        <div className="space-bg-container">
          {/* Event-horizon pull field (stars, heavenly bodies, dust, rings) */}
          <canvas ref={eventHorizonRef} className="event-horizon-canvas" aria-hidden="true" />
          {[].map((star, idx) => (
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
                      background: 'rgba(232, 174, 60, 0.55)', // Gold-tinted to match theme
                      boxShadow: '0 0 6px rgba(232, 174, 60, 0.25)',
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

          {/* SEO / a11y heading — visually hidden; the styled wordmark below is decorative */}
          <h1 className="visually-hidden-h1">
            ScoutIt — Philippine Space Intelligence Platform
          </h1>

          {/* UFO (clickable easter egg) hovering above the wordmark + tractor beam */}
          <div className="title-ufo-zone">
            <span
              className={`title-ufo ${powering ? "powering" : ""}`}
              onClick={() => {
                fireBeam(true);
                // The beam's power-up runs ~500ms; begin the descent just after
                // so the darkening feels caused by the beam, not simultaneous.
                setTimeout(() => setDescentActive(true), 650);
              }}
              role="presentation"
            >
              <span className="title-ufo-underglow" />
              <span className="title-ufo-ping" />
              <svg className="title-ufo-svg" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="ufoRimGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#E8AE3C" floodOpacity="0.55" />
                  </filter>
                </defs>
                {/* saucer body ΓÇö wide disc */}
                <ellipse cx="60" cy="44" rx="55" ry="13" fill="#1a1a1a" stroke="#E8AE3C" strokeWidth="2" filter="url(#ufoRimGlow)" />
                {/* belly ΓÇö slightly lighter underside */}
                <ellipse cx="60" cy="48" rx="40" ry="8" fill="#222222" />
                {/* belly lights ΓÇö 4 evenly spaced gold dots */}
                <circle className="ufo-belly" cx="36" cy="49" r="2.2" />
                <circle className="ufo-belly" cx="52" cy="51" r="2.2" />
                <circle className="ufo-belly" cx="68" cy="51" r="2.2" />
                <circle className="ufo-belly" cx="84" cy="49" r="2.2" />
                {/* dome / cockpit ΓÇö prominent, green-tinted */}
                <path d="M37 38 Q60 4 83 38 Z" fill="#1e2a1e" stroke="#E8AE3C" strokeWidth="1" />
                {/* porthole windows ΓÇö sequential 1-2-3 blink */}
                <circle className="porthole porthole-1" cx="49" cy="28" r="4" />
                <circle className="porthole porthole-2" cx="60" cy="24" r="4" />
                <circle className="porthole porthole-3" cx="71" cy="28" r="4" />
              </svg>
            </span>
            {fireId > 0 && <span key={fireId} className="title-beam" />}
          </div>

          {/* ScoutIT wordmark */}
          <div className={`scoutit-wordmark ${wordLit ? "lit" : ""}`} aria-label="ScoutIT">
            <span className="word-s">S</span><span className="word-scout">cout</span><span className="word-it">IT</span>
            {flashId > 0 && <span key={`flash-${flashId}`} className="title-impact" />}
          </div>

          {/* Discipline badge */}
          <div className="title-badge">SPACE &middot; INTELLIGENCE &middot; TECHNOLOGY</div>

          {/* Divider */}
          <div className="title-divider"></div>

          {/* Plain-Language Value Proposition */}
          <p className="title-tagline-intro">
            The Philippines&apos; first spatial commerce platform. We turn every kind of space — homes, offices, venues, restaurants — into clear, verified intelligence. No fake listings. No pressure. Just the signals that matter.
          </p>

          {/* Taglines */}
          <p className="title-tagline-1">Get lost in spaces that actually inspire you.</p>
          <div className="title-tagline-2">SPACE INTELLIGENCE &middot; PHILIPPINE PROPERTY</div>

          {/* Primary action path — gives first-time visitors a clear door in */}
          <div className="hero-cta-row">
            <Link href="/property" className="hero-cta-primary">Discover Spaces</Link>
            <Link href="/layer/orbit" className="hero-cta-secondary">Browse The Board</Link>
          </div>

          {/* Pre-launch founding-cohort capture */}
          <button
            type="button"
            className="hero-founding-link"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("scoutit:open-waitlist", { detail: { source: "hero" } })
              )
            }
          >
            ◈ Founding access — lock your rate before launch
          </button>
        </div>

        {/* Scroll indicator removed ΓÇö beam sequence begins the story */}
      </section>


      {/* =========================================
          LAUNCHPAD (ELEVATOR MENU)
          ========================================= */}
      <section className="relative w-full max-w-6xl mx-auto px-6 py-24 z-20 flex flex-col items-center" style={{ backgroundColor: 'transparent' }}>
        <h2 className="font-mono text-sm tracking-[0.3em] uppercase text-[#E8AE3C] mb-12 text-center opacity-80" style={{ textShadow: '0 0 10px rgba(232, 174, 60,0.3)' }}>
          Browse Space Catalog
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {/* Card 01: Orbit (The Board) */}
          <Link href="/layer/orbit" className="text-left group relative bg-[#111111]/80 backdrop-blur-md border border-white/5 rounded-xl p-8 overflow-hidden hover:border-[#E8AE3C]/50 transition-all duration-500 hover:-translate-y-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232, 174, 60,0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[10px] text-[#E8AE3C] tracking-widest mb-4">LAYER 01 // ORBIT</div>
            <h3 className="font-display text-2xl text-white mb-2">The Board</h3>
            <p className="text-sm text-gray-400">Top 100 Most Inquired Properties</p>
          </Link>

          {/* Card 02: Stratosphere */}
          <Link href="/layer/stratosphere" className="text-left group relative bg-[#111111]/80 backdrop-blur-md border border-white/5 rounded-xl p-8 overflow-hidden hover:border-[#E8AE3C]/50 transition-all duration-500 hover:-translate-y-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232, 174, 60,0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[10px] text-[#E8AE3C] tracking-widest mb-4">LAYER 02 // STRATOSPHERE</div>
            <h3 className="font-display text-2xl text-white mb-2">Stories & Intel</h3>
            <p className="text-sm text-gray-400">Neighborhood stories & market features</p>
          </Link>

          {/* Card 03: Metropolis */}
          <Link href="/layer/metropolis" className="text-left group relative bg-[#111111]/80 backdrop-blur-md border border-white/5 rounded-xl p-8 overflow-hidden hover:border-[#E8AE3C]/50 transition-all duration-500 hover:-translate-y-1 lg:col-span-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(232, 174, 60,0.15),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[10px] text-[#E8AE3C] tracking-widest mb-4">LAYER 03 // METROPOLIS</div>
            <h3 className="font-display text-2xl text-white mb-2">Explore Spaces</h3>
            <p className="text-sm text-gray-400">Search the complete property directory</p>
          </Link>

          {/* Card 04: The Crust */}
          <Link href="/layer/crust" className="text-left group relative bg-[#111111]/80 backdrop-blur-md border border-white/5 rounded-xl p-8 overflow-hidden hover:border-[#E8AE3C]/50 transition-all duration-500 hover:-translate-y-1 md:col-span-1 lg:col-span-2 block">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232, 174, 60,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[10px] text-[#E8AE3C] tracking-widest mb-4">LAYER 04 // THE CRUST</div>
            <h3 className="font-display text-2xl text-white mb-2">The Ecosystem</h3>
            <p className="text-sm text-gray-400">Verified Advisors & Professionals</p>
          </Link>

          {/* Card 05: The Core */}
          <Link href="/layer/core" className="text-left group relative bg-[#111111]/80 backdrop-blur-md border border-white/5 rounded-xl p-8 overflow-hidden hover:border-[#E8AE3C]/50 transition-all duration-500 hover:-translate-y-1 md:col-span-1 lg:col-span-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232, 174, 60,0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[10px] text-[#E8AE3C] tracking-widest mb-4">LAYER 05 // THE CORE</div>
            <h3 className="font-display text-2xl text-white mb-2">Your Workspace</h3>
            <p className="text-sm text-gray-400">Private Wishlist & Dashboard</p>
          </Link>
        </div>
      </section>

      <style>{`
        /* Cinematic Snap Container */
        .cinematic-container {
          height: 100dvh;
          width: 100vw;
          overflow-y: scroll;
          /* NOTE: snap must stay "proximity" and there must be NO
             scroll-behavior:smooth here. With "mandatory" snap (and worse,
             mandatory + smooth), every wheel tick during the snap animation
             forces Chrome to restart it; combined with the hero canvas this
             locked up rendering for 30s+. Proximity still settles sections
             gently but lets free scrolling breathe. */
          scroll-snap-type: y proximity;
          background: var(--bg);
          color: var(--text-primary);
        }
        
        .cinematic-container::-webkit-scrollbar {
          display: none;
        }

        /* While the descent is active the hero holds in place ΓÇö the sequence
           happens "in place" over the homepage (scroll-driven reveal arrives
           in Stage 2). */
        .cinematic-container.descending {
          overflow: hidden;
        }

        .snap-section {
          scroll-snap-align: start;
          width: 100%;
          height: 100dvh;
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
          background: var(--accent-bright);
          border-color: var(--accent-bright);
          color: #000;
          box-shadow: var(--shadow-glow);
          transform: translateY(-2px);
        }

        .prominent-action-link:focus-visible {
          outline: 1.5px solid var(--accent-bright);
          outline-offset: 3px;
        }

        .section-action-footer {
          text-align: center;
          margin-top: 64px;
        }

        /* Visually-hidden SEO/a11y heading */
        .visually-hidden-h1 {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Hero primary action path */
        .hero-cta-row {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 36px;
        }

        .hero-cta-primary {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #0a0a0a;
          background: var(--accent);
          border: 1px solid var(--accent);
          padding: 15px 34px;
          border-radius: 4px;
          text-decoration: none;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
          animation: glowPulse 3.2s ease-in-out infinite;
        }
        .hero-cta-primary:hover {
          background: var(--accent-bright);
          border-color: var(--accent-bright);
          box-shadow: 0 8px 30px rgba(232, 174, 60, 0.25);
          transform: translateY(-2px);
          animation: none;
        }
        .hero-cta-primary:focus-visible {
          outline: 2px solid var(--accent-bright);
          outline-offset: 3px;
        }

        .hero-cta-secondary {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--accent);
          background: transparent;
          border: 1px solid var(--accent-muted);
          padding: 15px 30px;
          border-radius: 4px;
          text-decoration: none;
          transition: transform var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
        }
        .hero-cta-secondary:hover {
          border-color: var(--accent);
          color: var(--accent-bright);
          transform: translateY(-2px);
        }
        .hero-cta-secondary:focus-visible {
          outline: 2px solid var(--accent-bright);
          outline-offset: 3px;
        }

        .hero-founding-link {
          display: inline-block;
          margin-top: 18px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.78;
          transition: opacity var(--transition-fast), text-shadow var(--transition-fast);
        }
        .hero-founding-link:hover {
          opacity: 1;
          text-shadow: 0 0 14px rgba(232, 174, 60, 0.5);
        }
        .hero-founding-link:focus-visible {
          outline: 1.5px solid var(--accent-bright);
          outline-offset: 4px;
        }

        /* ΓòÉΓòÉΓòÉ SECTION 1: SPACE HERO ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
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
            rgba(232, 174, 60, 0.04) 45%,
            rgba(232, 174, 60, 0.12) 55%,
            transparent 75%
          );
          border: 1px solid rgba(232, 174, 60, 0.18);
          box-shadow: 0 0 120px rgba(232, 174, 60, 0.14), inset 0 0 40px rgba(232, 174, 60, 0.08);
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
            rgba(232, 174, 60, 0.12) 0%,
            transparent 25%,
            rgba(232, 174, 60, 0.18) 50%,
            transparent 75%,
            rgba(232, 174, 60, 0.12) 100%
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
            rgba(232, 174, 60, 0.22) 0%,
            rgba(232, 174, 60, 0.06) 40%,
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
            rgba(232, 174, 60, 0.09) 0%,
            transparent 30%,
            rgba(232, 174, 60, 0.15) 50%,
            transparent 80%,
            rgba(232, 174, 60, 0.09) 100%
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

        /* ΓöÇΓöÇ Faint drifting rock fragments / meteors (Occasional) ΓöÇΓöÇΓöÇΓöÇ */
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

        /* ΓöÇΓöÇ Comet Elements ΓöÇΓöÇ */
        .comet-head {
          width: 100%;
          height: 100%;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(232, 174, 60, 0.4);
          position: relative;
        }
        .comet-tail {
          position: absolute;
          right: calc(100% - 2px);
          top: 50%;
          transform: translateY(-50%);
          width: 90px; /* Longer, highly noticeable tail */
          height: 3px; /* Thicker head connection */
          background: linear-gradient(to left, #ffffff 0%, rgba(232, 174, 60, 0.6) 30%, rgba(232, 174, 60, 0.15) 75%, transparent 100%);
          clip-path: polygon(0 50%, 100% 0, 100% 100%); /* Elegant taper wedge shape */
          pointer-events: none;
        }

        /* ΓöÇΓöÇ Drifting Neutron Star ΓöÇΓöÇ */
        .neutron-star-drifting {
          width: 100%;
          height: 100%;
          background: #e0f2fe;
          border-radius: 50%;
          box-shadow: 
            0 0 12px rgba(224, 242, 254, 0.9), 
            0 0 24px rgba(232, 174, 60, 0.6);
          animation: pulseNeutronDrifting 2.5s ease-in-out infinite alternate;
        }
        @keyframes pulseNeutronDrifting {
          0% {
            transform: scale(0.85);
            box-shadow: 
              0 0 8px rgba(224, 242, 254, 0.7), 
              0 0 16px rgba(232, 174, 60, 0.4);
          }
          100% {
            transform: scale(1.15);
            box-shadow: 
              0 0 16px rgba(224, 242, 254, 0.95), 
              0 0 32px rgba(232, 174, 60, 0.75);
          }
        }

        /* Static pulsing star styling removed per user request */

        /* ΓöÇΓöÇ Main wordmark container ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        .hook-content {
          text-align: center;
          z-index: 10;
          position: relative;
        }

        /* Event-horizon canvas ΓÇö full-cover, behind all hero content */
        .event-horizon-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          display: block;
        }

        /* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ TITLE SCREEN ΓÇö WORDMARK REDESIGN ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
        .scoutit-wordmark {
          position: relative;
          display: flex;
          align-items: baseline;
          justify-content: center;
          margin: 0 0 20px;
          line-height: 1;
        }
        .scoutit-wordmark .word-s,
        .scoutit-wordmark .word-scout,
        .scoutit-wordmark .word-it {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 400;
          font-size: clamp(64px, 10vw, 120px);
          letter-spacing: 4px;
          line-height: 1;
          /* slow fade-back to resting state (2s) when the lit class is removed */
          transition: color 2s ease, text-shadow 2s ease;
        }
        .scoutit-wordmark .word-scout { color: #ffffff; }
        .scoutit-wordmark .word-s     { color: #E8AE3C; }
        .scoutit-wordmark .word-it    { color: #E8AE3C; margin-right: -4px; }
        /* beam-hit illumination snaps on fast, then fades back slowly via base transition */
        .scoutit-wordmark.lit .word-scout {
          color: #ffffff;
          text-shadow: 0 0 60px rgba(232, 174, 60, 0.8), 0 0 120px rgba(232, 174, 60, 0.3);
          transition: color 0.15s ease, text-shadow 0.15s ease;
        }
        .scoutit-wordmark.lit .word-s,
        .scoutit-wordmark.lit .word-it {
          color: #E8AE3C;
          text-shadow: 0 0 60px rgba(232, 174, 60, 0.9), 0 0 120px rgba(232, 174, 60, 0.4);
          transition: color 0.15s ease, text-shadow 0.15s ease;
        }

        /* Impact flash burst at the wordmark when the beam lands */
        .title-impact {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232, 174, 60, 0.6) 0%, rgba(232, 174, 60, 0) 60%);
          transform: translate(-50%, -50%) scale(0.3);
          pointer-events: none;
          opacity: 0;
          z-index: -1;
          animation: titleImpact 0.3s ease-out forwards;
        }

        /* ΓöÇΓöÇ UFO (clickable easter egg) hovering above the wordmark ΓöÇΓöÇ */
        .title-ufo-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          height: 160px;
          margin-bottom: 8px;
        }
        .title-ufo {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 24px;          /* generous, reliable click target around the saucer */
          cursor: pointer;
          z-index: 5;
          animation: titleUfoFloat 3s ease-in-out infinite;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          -webkit-user-select: none;
        }
        .title-ufo.powering { animation: none; }   /* stop floating during power-up */
        /* Soft gold underglow ΓÇö UFO emits faint warmth downward */
        .title-ufo-underglow {
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 90px;
          background: radial-gradient(ellipse at top, rgba(232, 174, 60, 0.12), rgba(232, 174, 60, 0) 70%);
          pointer-events: none;
          z-index: -1;
        }
        /* Faint gold "I'm alive" pulse ring beneath the saucer every 4s */
        .title-ufo-ping {
          position: absolute;
          top: 56%;
          left: 50%;
          width: 60px;
          height: 60px;
          margin: -30px 0 0 -30px;
          border-radius: 50%;
          border: 1px solid rgba(232, 174, 60, 0.5);
          pointer-events: none;
          opacity: 0;
          z-index: -1;
          animation: ufoPing 4s ease-out infinite;
        }
        .title-ufo-svg {
          width: 104px;
          height: auto;
          display: block;
          animation: titleSaucerTilt 9s ease-in-out infinite;
        }
        .title-ufo-svg .porthole { fill: #00ff88; }
        /* sequential 1-2-3 blink (delays stagger the same keyframe) */
        .title-ufo-svg .porthole-1 { animation: portSeq 1.4s linear infinite; animation-delay: 0s; }
        .title-ufo-svg .porthole-2 { animation: portSeq 1.4s linear infinite; animation-delay: 0.2s; }
        .title-ufo-svg .porthole-3 { animation: portSeq 1.4s linear infinite; animation-delay: 0.4s; }
        /* power-up: all three flash together, rapidly, 3x over ~0.5s */
        .title-ufo.powering .porthole { animation: portPower 0.166s ease-in-out 3; }
        .title-ufo-svg .ufo-belly { fill: rgba(232, 174, 60, 0.6); }

        /* ΓöÇΓöÇ Tractor beam: gold cone, fades to transparent, extend ΓåÆ hold ΓåÆ fade ΓöÇΓöÇ */
        .title-beam {
          display: block;
          width: 3px;
          height: 80px;
          margin-top: 0;
          background: linear-gradient(
            to bottom,
            rgba(255, 235, 160, 1) 0%,
            rgba(232, 174, 60, 0.85) 30%,
            rgba(232, 174, 60, 0.3) 70%,
            rgba(232, 174, 60, 0) 100%
          );
          box-shadow:
            0 0 8px rgba(232, 174, 60, 0.6),
            0 0 20px rgba(232, 174, 60, 0.25);
          border-radius: 0 0 4px 4px;
          transform-origin: top center;
          opacity: 0;
          animation: titleBeamSeq 1.5s ease-out forwards;
        }
        /* Desktop: slightly wider beam for more visual impact */
        @media (min-width: 769px) {
          .title-beam {
            width: 4px;
            height: 100px;
            box-shadow:
              0 0 12px rgba(232, 174, 60, 0.7),
              0 0 30px rgba(232, 174, 60, 0.3);
          }
        }

        /* ΓöÇΓöÇ Discipline badge ΓöÇΓöÇ */
        .title-badge {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: #777777;
          margin-bottom: 22px;
        }

        /* ΓöÇΓöÇ Divider ΓöÇΓöÇ */
        .title-divider {
          width: 32px;
          height: 1px;
          background: rgba(232, 174, 60, 0.35);
          margin: 0 auto 22px;
        }

        /* ΓöÇΓöÇ Taglines ΓöÇΓöÇ */
        .title-tagline-intro {
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 14px;
          line-height: 1.6;
          color: #888888;
          max-width: 520px;
          margin: 0 auto 24px;
          text-align: center;
          font-weight: 400;
        }
        .title-tagline-1 {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 20px;
          color: #aaaaaa;
          text-align: center;
          margin: 0 0 10px;
        }
        .title-tagline-2 {
          font-family: var(--font-mono), 'Courier New', monospace;
          font-size: 11px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(232, 174, 60, 0.55);
          text-align: center;
          margin: 0 0 34px;
        }

        @keyframes titleUfoFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes titleSaucerTilt {
          0%, 100% { transform: rotate(-2.5deg); }
          50%      { transform: rotate(2.5deg); }
        }
        /* sequential porthole: ON ~0.2s within a 1.4s cycle, staggered by delay */
        @keyframes portSeq {
          0%   { opacity: 0.15; }
          5%   { opacity: 1; }
          14%  { opacity: 1; }
          20%  { opacity: 0.15; }
          100% { opacity: 0.15; }
        }
        @keyframes portPower {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.15; }
        }
        @keyframes ufoPing {
          0%   { transform: scale(0.5); opacity: 0; }
          4%   { opacity: 0.6; }
          25%  { transform: scale(1); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes titleBeamSeq {
          0%   { transform: scaleY(0); opacity: 0; }
          6%   { opacity: 1; }
          40%  { transform: scaleY(1); opacity: 1; }   /* extended (~0.6s) */
          65%  { transform: scaleY(1); opacity: 1; }   /* hold (~0.4s) */
          100% { transform: scaleY(1); opacity: 0; }   /* fade out (~0.5s) */
        }
        @keyframes titleImpact {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          35%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }
        /* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ END TITLE SCREEN ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

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

        /* ΓöÇΓöÇ S: Comet Trail ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        .letter-s {
          animation: cometDraw 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
          text-shadow: 0 0 12px rgba(232, 174, 60, 0.5);
        }

        /* ΓöÇΓöÇ C: Eclipse Reveal ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        .letter-c {
          animation: eclipseReveal 0.65s ease forwards;
          clip-path: inset(0 100% 0 0);
        }

        /* ΓöÇΓöÇ O: Planet + Orbit Ring ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        .letter-o {
          animation: planetPulse 0.6s ease forwards;
        }

        .orbit-ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 120%; height: 35%;
          border: 1px solid rgba(232, 174, 60,0.5);
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

        /* ΓöÇΓöÇ T1: Satellite Arms ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        .letter-t1 {
          animation: satelliteArms 0.55s ease forwards;
          transform-origin: center center;
        }

        /* I ΓÇö normal letter, just needs position:relative for the UFO anchor */
        .letter-i {
          animation: fadeIn 0.4s ease forwards;
          position: relative;
        }

        /* UFO ANCHOR ΓÇö static centering, never animated.
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

        /* UFO FLOAT ΓÇö only translateY animated, horizontal centering untouched */
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
          background: linear-gradient(to bottom, rgba(232, 174, 60,0.7) 0%, rgba(232, 174, 60,0.15) 100%);
          clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
          animation: beamPulse 2s ease-in-out 3.4s infinite;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        /* ΓöÇΓöÇ T2: Targeting Reticle ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        .letter-t2 {
          animation: targetLock 0.6s ease forwards;
          position: relative;
        }

        .reticle-ring {
          position: absolute;
          top: 50%; left: 50%;
          border-radius: 50%;
          border: 1px solid rgba(232, 174, 60,0.5);
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

        /* ΓöÇΓöÇ Subtitle ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
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
          gap: 8px;
          animation: scrollPulse 2.5s ease-in-out infinite;
          opacity: 1;
        }

        .scroll-text {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: #888888;
        }

        /* Pulsing downward chevrons (top fades in first, then bottom) */
        .scroll-chevrons {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 0.65;
        }
        .scroll-chev {
          font-size: 13px;
          color: #E8AE3C;
          opacity: 0;
        }
        .scroll-chev-1 { animation: chevSeq 1.5s ease-in-out infinite; }
        .scroll-chev-2 { animation: chevSeq 1.5s ease-in-out infinite; animation-delay: 0.2s; }

        @keyframes scrollPulse {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        @keyframes chevSeq {
          0%   { opacity: 0; }
          30%  { opacity: 0.6; }
          60%  { opacity: 0.6; }
          100% { opacity: 0; }
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
          box-shadow: 0 0 35px rgba(232, 174, 60, 0.45);
          transform: translateY(-2px);
        }

        /* KEYFRAMES ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

        /* Primary CTA — breathing gold glow (dim -> bright -> dim), signals
           "this is the one clickable thing" without a second accent color */
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(232, 174, 60, 0.15); }
          50%      { box-shadow: 0 0 26px rgba(232, 174, 60, 0.55); }
        }

        /* S ΓÇö comet: draws left-to-right with trailing glow */
        @keyframes cometDraw {
          0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
          30%  { opacity: 1; clip-path: inset(0 60% 0 0); }
          100% { opacity: 1; clip-path: inset(0 0% 0 0); }
        }

        /* C ΓÇö eclipse reveal */
        @keyframes eclipseReveal {
          0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
          100% { opacity: 1; clip-path: inset(0 0% 0 0); }
        }

        /* O ΓÇö planet pulse */
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

        /* U ΓÇö signal fill from bottom */
        @keyframes signalFill {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* T1 ΓÇö satellite arms extend */
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
          0%, 100% { box-shadow: 0 0 12px rgba(232, 174, 60,0.4); }
          50%       { box-shadow: 0 0 22px rgba(232, 174, 60,0.9), 0 0 40px rgba(232, 174, 60,0.2); }
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

        /* T2 ΓÇö reticle contract */
        @keyframes reticleContract {
          0%   { opacity: 0.8; transform: translate(-50%, -50%) scale(2); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(0.9); }
        }

        /* T2 ΓÇö target lock-in */
        @keyframes targetLock {
          0%   { opacity: 0; transform: scale(1.3); filter: blur(3px); }
          70%  { opacity: 1; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }

        /* UFO gentle float bob ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        @keyframes float {
          0%, 100% { transform: translateY(-3px); }
          50%       { transform: translateY(3px); }
        }

        /* Green cognition beam pulse ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        @keyframes beamGlow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }

        /* Star twinkle ΓÇö fast (bright, quick blink) */
        @keyframes twinkleFast {
          0%, 100% { opacity: 0;    transform: scale(0.8); }
          40%, 60% { opacity: 0.75; transform: scale(1.2); }
        }

        /* Star twinkle ΓÇö medium */
        @keyframes twinkleMed {
          0%, 100% { opacity: 0;   transform: scale(0.9); }
          45%, 55% { opacity: 0.5; transform: scale(1.1); }
        }

        /* Star twinkle ΓÇö slow (dim, deep-space) */
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
          padding: 60px 40px;
          z-index: 10;
          overflow: hidden;
        }

        .menu-header h2 {
          font-family: var(--font-display);
          font-size: 34px;
          margin: 10px 0;
          color: var(--text-primary);
        }

        .menu-header p {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .vector-label {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: var(--accent);
        }

        .menu-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }

        .menu-btn {
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 22px;
          font-family: var(--font-display);
          padding: 13px 24px;
          cursor: pointer;
          transition: all var(--transition);
          border-radius: var(--radius-sm);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .menu-btn:hover {
          color: var(--accent);
          transform: scale(1.03);
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.1);
          border-color: rgba(232, 174, 60, 0.25);
          padding-left: 28px;
        }

        .menu-btn.active {
          color: var(--accent);
          background: var(--surface2);
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(232, 174, 60, 0.05);
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
          max-height: 100vh;
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
          box-shadow: 0 0 8px rgba(232, 174, 60, 0.15);
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
          background: linear-gradient(165deg, #1a1917, #111110);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .mini-preview-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45), var(--shadow-glow-soft);
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
          padding: 0 8px;
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
          border-color: var(--accent-bright) !important;
          transform: translateX(4px);
          box-shadow: var(--shadow-glow-soft);
        }

        .discover-news-item-link {
          display: block;
          border-bottom: 1px solid #1e1e1e;
          padding: 12px;
          margin: 0 -12px;
          border-radius: 4px;
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .discover-news-item-link:hover {
          background: rgba(232, 174, 60, 0.03);
          border-color: rgba(232, 174, 60, 0.15) !important;
          transform: translateX(4px);
        }
        .news-item-title {
          font-size: 13px;
          font-weight: 500;
          color: #f0ede8;
          transition: color var(--transition-fast);
          margin: 0;
        }
        .discover-news-item-link:hover .news-item-title {
          color: var(--accent);
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
          background: linear-gradient(165deg, #1a1917, #111110);
          border: 1px solid rgba(255, 255, 255, 0.08);
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
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45), var(--shadow-glow-soft);
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
          background: rgba(232, 174, 60, 0.1);
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

        /* SECTION: SERVICES LAYER */
        .section-services {
          background: #070707;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 120px 40px;
        }

        .services-content {
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          width: 100%;
        }

        @media (max-width: 1024px) {
          .services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .services-grid {
            grid-template-columns: 1fr;
          }
        }

        .service-card {
          background: linear-gradient(165deg, #1a1917, #111110);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          text-decoration: none;
          display: block;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .service-card:hover {
          transform: translateY(-4px);
          border-color: rgba(232, 174, 60, 0.3);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45), var(--shadow-glow-soft);
        }

        .service-card-inner {
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .service-icon-wrapper {
          font-size: 32px;
          margin-bottom: 24px;
        }

        .service-status-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 4px 8px;
          border-radius: 3px;
          align-self: flex-start;
          margin-bottom: 16px;
        }

        .live-badge {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 0.5px solid rgba(16, 185, 129, 0.3);
        }

        .soon-badge {
          background: rgba(232, 174, 60, 0.1);
          color: var(--accent);
          border: 0.5px solid rgba(232, 174, 60, 0.3);
        }

        .service-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: #fff;
          margin-bottom: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .service-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 24px;
          flex-grow: 1;
        }

        .service-cta {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-secondary);
          transition: color 0.2s ease;
          margin-top: auto;
        }

        .live-card:hover {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.02);
          transform: translateY(-4px);
        }

        .live-card:hover .service-cta {
          color: #10b981;
        }

        .coming-soon-card:hover {
          border-color: var(--accent-border);
          background: rgba(232, 174, 60, 0.02);
          transform: translateY(-4px);
        }

        .coming-soon-card:hover .service-cta {
          color: var(--accent);
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
          background: linear-gradient(165deg, #1a1917, #111110);
          border: 1px solid rgba(255, 255, 255, 0.08);
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
          background: rgba(232, 174, 60, 0.05);
          border: 1px solid rgba(232, 174, 60, 0.2);
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
            overflow: visible;
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
            flex-shrink: 0;
          }
          .menu-btn:hover, .menu-btn.active {
            padding-left: 16px;
          }
          .matrix-preview-pane {
            padding: 32px 24px;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
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

        @media (max-width: 640px) {
          .flow-grid {
            grid-template-columns: 1fr;
          }
          /* Tap target and mobile compliance rules */
          .menu-btn {
            min-height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
          }
          .prominent-action-link {
            min-height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            touch-action: manipulation;
          }
          .service-card {
            touch-action: manipulation;
          }
          .cinematic-container {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }

        @media (max-width: 480px) {
          .section-header-center h2 {
            font-size: 32px;
          }
          .section-header-center p {
            font-size: 13px;
          }
          .services-content, .brokers-content, .wishlist-content {
            gap: 36px;
          }
        }

        @media (max-width: 768px) {
          /* 1. Layer 01: Horizontally scrollable property preview grid */
          .mini-cards-grid {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
            gap: 16px !important;
            width: 100% !important;
            scroll-snap-type: x mandatory !important;
            padding-bottom: 8px !important;
          }
          .mini-cards-grid::-webkit-scrollbar {
            display: none !important;
          }
          .mini-preview-card {
            flex: 0 0 280px !important;
            width: 280px !important;
            scroll-snap-align: center !important;
          }
          
          /* Shorten card box to fit in 1 scroll */
          .mini-card-visual {
            height: 120px !important;
          }
          .mini-card-body {
            padding: 12px 16px !important;
          }
          .mini-card-body h4 {
            font-size: 16px !important;
            margin-bottom: 8px !important;
          }
          .mini-tag-label {
            font-size: 8px !important;
          }
          .mini-tag {
            font-size: 10px !important;
            padding: 2px 6px !important;
          }

          /* 2. Layer 02: Horizontally scrollable spotlights list */
          .discover-feed-preview > div:first-child > div {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
            gap: 16px !important;
            width: 100% !important;
            scroll-snap-type: x mandatory !important;
            padding-bottom: 8px !important;
          }
          .discover-feed-preview > div:first-child > div::-webkit-scrollbar {
            display: none !important;
          }
          .discover-spotlight-card-link {
            flex: 0 0 260px !important;
            width: 260px !important;
            scroll-snap-align: center !important;
          }
          .discover-spotlight-card-link > div:first-child {
            height: 100px !important;
          }
          .discover-spotlight-card-link p {
            display: none !important;
          }
          
          /* Horizontally scrollable news and collections in Layer 02 */
          .discover-feed-preview > div:last-child {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
            gap: 16px !important;
            width: 100% !important;
            scroll-snap-type: x mandatory !important;
            padding-bottom: 8px !important;
          }
          .discover-feed-preview > div:last-child::-webkit-scrollbar {
            display: none !important;
          }
          .discover-feed-preview > div:last-child > div {
            flex: 0 0 260px !important;
            width: 260px !important;
            scroll-snap-align: center !important;
          }

          /* 3. Layer 03: Horizontal row showing cards */
          .services-grid {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
            gap: 12px !important;
            width: 100vw !important;
            margin-left: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
            scroll-snap-type: x mandatory !important;
            padding-bottom: 8px !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .services-grid::-webkit-scrollbar {
            display: none !important;
          }
          .service-card {
            flex: 0 0 75vw !important;
            width: 75vw !important;
            scroll-snap-align: start !important;
            margin-right: 16px !important;
          }
          .service-card-inner {
            padding: 16px 12px !important;
          }
          .service-icon-wrapper {
            font-size: 20px !important;
            margin-bottom: 12px !important;
          }
          .service-status-badge {
            font-size: 7.5px !important;
            padding: 2px 4px !important;
            margin-bottom: 10px !important;
          }
          .service-title {
            font-size: 13px !important;
            margin-bottom: 8px !important;
          }
          .service-desc {
            display: none !important;
          }
          .service-cta {
            font-size: 10px !important;
          }

          /* 4. Layer 04: Horizontally draggable flow cards */
          .flow-grid {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
            gap: 16px !important;
            width: 100% !important;
            scroll-snap-type: x mandatory !important;
            padding-bottom: 8px !important;
          }
          .flow-grid::-webkit-scrollbar {
            display: none !important;
          }
          .flow-card {
            flex: 0 0 220px !important;
            width: 220px !important;
            scroll-snap-align: center !important;
            padding: 16px !important;
          }
          .flow-card h4 {
            font-size: 12px !important;
          }
          .flow-card p {
            font-size: 10px !important;
          }
          .flow-card svg {
            width: 32px !important;
            height: 32px !important;
          }
        }

        /* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
           MOBILE-FIRST COMPREHENSIVE OPTIMIZATIONS
           ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

        /* TABLET & MEDIUM MOBILE (768px - 900px) */
        @media (max-width: 900px) {
          .cinematic-container {
            scroll-snap-type: none;
          }

          .snap-section {
            height: auto;
            min-height: 100vh;
            scroll-snap-align: none;
          }

          .section-hook {
            min-height: 70vh;
            padding: 40px 0;
          }

          .property-split {
            flex-direction: column;
            height: auto;
          }

          .property-menu {
            width: 100%;
            min-width: auto;
            border-right: none;
            border-bottom: 1px solid var(--border-solid);
            padding: 40px 20px;
            max-height: 300px;
            overflow-x: auto;
            overflow-y: hidden;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            gap: 20px;
          }

          .menu-nav {
            flex-direction: row;
            flex: 0;
            padding-right: 0;
            gap: 12px;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            width: 100%;
          }

          .matrix-preview-pane {
            padding: 40px 20px;
            max-height: none;
          }

          .menu-btn {
            font-size: 16px;
            padding: 10px 16px;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .letter {
            font-size: clamp(28px, 4.5vw, 48px);
          }

          .hero-tagline {
            font-size: clamp(24px, 3.5vw, 48px);
          }

          .hero-subheadline {
            font-size: clamp(14px, 1.8vw, 18px);
          }
        }

        /* SMALL MOBILE (640px - 768px) */
        @media (max-width: 768px) {
          .cinematic-container {
            height: auto;
            overflow-y: auto;
            scroll-snap-type: none;
          }

          .snap-section {
            height: auto;
            min-height: 100vh;
          }

          .section-hook {
            min-height: 65vh;
            padding: 30px 16px;
            justify-content: flex-start;
            align-items: flex-end;
            padding-bottom: 60px;
          }

          .hook-content {
            text-align: center;
          }

          .scoutit-wordmark {
            margin-bottom: 36px;
          }

          .letter {
            font-size: clamp(24px, 4vw, 40px);
          }

          .hero-tagline {
            font-size: clamp(20px, 3vw, 36px);
            margin-bottom: 16px;
          }

          .hero-subheadline {
            font-size: clamp(13px, 1.5vw, 16px);
            margin-bottom: 32px;
          }

          .hero-cta-btn {
            padding: 16px 32px;
            font-size: 12px;
            min-height: 44px;
          }

          .hook-scroll-indicator {
            bottom: 20px;
            gap: 10px;
          }

          .scroll-line {
            height: 40px;
          }

          .property-menu {
            padding: 32px 16px;
            max-height: 250px;
            gap: 12px;
          }

          .matrix-preview-pane {
            padding: 32px 16px;
          }

          .pane-header {
            margin-bottom: 24px;
          }

          .pane-header h3 {
            font-size: 24px;
          }

          .pane-header p {
            font-size: 11px;
          }

          .menu-nav {
            gap: 8px;
          }

          .menu-btn {
            font-size: 15px;
            padding: 12px 16px;
          }

          .menu-btn:hover {
            padding-left: 16px;
          }

          .menu-btn.active {
            padding-left: 16px;
          }

          .search-input-wrapper {
            max-width: 100%;
          }

          .vector-search-input {
            padding: 14px 16px;
            font-size: 14px;
            min-height: 44px;
          }

          .section-action-footer {
            margin-top: 48px;
          }

          .prominent-action-link {
            display: block;
            width: 100%;
            padding: 16px 24px;
            min-height: 48px;
            font-size: 12px;
          }
        }

        /* EXTRA SMALL MOBILE (480px - 640px) */
        @media (max-width: 640px) {
          .cinematic-container {
            height: auto;
          }

          .snap-section {
            height: auto;
            min-height: auto;
            padding: 24px 14px !important;
          }

          .section-hook {
            min-height: 55vh;
            padding: 24px 12px;
          }

          .scoutit-wordmark {
            margin-bottom: 28px;
            gap: 0.02em;
          }

          .letter {
            font-size: clamp(18px, 3.5vw, 32px);
          }

          .hero-tagline {
            font-size: clamp(18px, 2.8vw, 32px);
            margin-bottom: 12px;
            max-width: 15em;
          }

          .hero-subheadline {
            font-size: clamp(12px, 1.3vw, 14px);
            margin-bottom: 24px;
          }

          .hook-subtitle {
            font-size: 11px;
            letter-spacing: 0.15em;
          }

          .hero-cta-btn {
            padding: 14px 24px;
            font-size: 11px;
            min-height: 44px;
            letter-spacing: 0.15em;
          }

          .hook-scroll-indicator {
            bottom: 16px;
            gap: 8px;
          }

          .scroll-text {
            font-size: 9px;
          }

          .scroll-line {
            height: 30px;
          }

          .property-split {
            min-height: auto;
          }

          .property-menu {
            padding: 24px 12px;
            max-height: 220px;
            gap: 8px;
            border-bottom: 1px solid var(--border-solid);
          }

          .menu-header h2 {
            font-size: 22px;
          }

          .menu-header p {
            font-size: 12px;
          }

          .vector-label {
            font-size: 10px;
          }

          .matrix-preview-pane {
            padding: 24px 12px;
            max-height: none;
          }

          .pane-header {
            margin-bottom: 20px;
          }

          .pane-header h3 {
            font-size: 20px;
          }

          .pane-header p {
            font-size: 10px;
          }

          .menu-nav {
            gap: 6px;
            font-size: 14px;
          }

          .menu-btn {
            font-size: 14px;
            padding: 12px 14px;
            min-height: 44px;
          }

          .search-container {
            margin-bottom: 20px;
          }

          .vector-search-input {
            padding: 12px 14px;
            font-size: 14px;
            min-height: 44px;
            border-radius: 4px;
          }

          .prominent-action-link {
            font-size: 11px;
            padding: 14px 20px;
            min-height: 44px;
            width: 100%;
            letter-spacing: 0.15em;
          }

          .discover-spotlight-card-link {
            border-radius: 6px !important;
          }

          .discover-spotlight-card-link h5 {
            font-size: 14px !important;
          }

          .discover-spotlight-card-link p {
            font-size: 12px !important;
          }

          /* Ensure buttons are properly sized for touch */
          button, [role="button"], .menu-btn, .header-menu-btn, .header-back-btn {
            min-height: 44px !important;
          }
        }

        /* TINY MOBILE (< 480px) */
        @media (max-width: 480px) {
          .cinematic-container {
            height: auto;
          }

          .snap-section {
            height: auto;
            min-height: auto;
            padding: 20px 10px !important;
          }

          .section-hook {
            min-height: 50vh;
            padding: 20px 10px 40px;
          }

          .black-hole-core {
            width: 300px;
            height: 300px;
          }

          .scoutit-wordmark {
            margin-bottom: 24px;
            gap: 0;
          }

          .letter {
            font-size: clamp(16px, 3vw, 28px);
          }

          .hero-tagline {
            font-size: clamp(16px, 2.5vw, 28px);
            margin-bottom: 12px;
            max-width: 13em;
          }

          .hero-subheadline {
            font-size: clamp(12px, 1.1vw, 13px);
            margin-bottom: 20px;
          }

          .hook-subtitle {
            font-size: 10px;
            letter-spacing: 0.1em;
          }

          .hero-cta-btn {
            padding: 12px 20px;
            font-size: 10px;
            min-height: 42px;
            letter-spacing: 0.1em;
          }

          .hook-scroll-indicator {
            display: none;
          }

          .property-menu {
            padding: 20px 10px;
            max-height: 200px;
            gap: 6px;
          }

          .menu-header h2 {
            font-size: 20px;
            margin: 4px 0;
          }

          .menu-header p {
            font-size: 11px;
          }

          .menu-nav {
            gap: 4px;
          }

          .menu-btn {
            font-size: 13px;
            padding: 10px 12px;
            min-height: 42px;
          }

          .menu-btn:hover {
            transform: none;
            padding-left: 12px;
          }

          .matrix-preview-pane {
            padding: 20px 10px;
          }

          .pane-header {
            margin-bottom: 16px;
          }

          .pane-header h3 {
            font-size: 18px;
            margin-bottom: 2px;
          }

          .pane-header p {
            font-size: 9px;
          }

          .vector-label {
            font-size: 9px;
          }

          .search-container {
            margin-bottom: 16px;
          }

          .vector-search-input {
            padding: 10px 12px;
            font-size: 14px;
            min-height: 42px;
            border-radius: 4px;
          }

          .prominent-action-link {
            font-size: 10px;
            padding: 12px 16px;
            min-height: 42px;
            width: 100%;
            letter-spacing: 0.1em;
          }

          .section-action-footer {
            margin-top: 40px;
          }

          /* Hide secondary elements on tiny screens */
          .drifting-container {
            display: none !important;
          }

          .accretion-disk-outer {
            width: 400px;
            height: 400px;
          }

          .event-horizon {
            height: 250px;
            width: 120vw;
          }

          /* Compact card styles */
          .discover-spotlight-card-link {
            border-radius: 4px !important;
          }

          .discover-spotlight-card-link h5 {
            font-size: 13px !important;
          }

          .discover-spotlight-card-link p {
            font-size: 11px !important;
          }

          .mini-preview-card {
            padding: 10px !important;
          }
        }

        /* ΓöÇΓöÇ PERFORMANCE: Disable animations on reduced motion ΓöÇΓöÇ */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .letter,
          .hero-tagline,
          .hero-subheadline,
          .hero-cta-btn,
          .hook-scroll-indicator {
            animation: none !important;
            opacity: 1 !important;
          }

          .hero-cta-primary {
            animation: none !important;
            box-shadow: var(--shadow-glow-soft) !important;
          }

          .black-hole-core,
          .accretion-disk-outer,
          .event-horizon-swirl {
            animation: none !important;
          }
        }

        /* ΓöÇΓöÇ LANDSCAPE ORIENTATION ΓöÇΓöÇ */
        @media (max-height: 600px) and (orientation: landscape) {
          .section-hook {
            min-height: 100vh;
            padding: 20px 16px;
          }

          .scoutit-wordmark {
            margin-bottom: 20px;
          }

          .letter {
            font-size: clamp(20px, 3vw, 36px);
          }

          .hero-tagline {
            font-size: clamp(14px, 2.5vw, 24px);
            margin-bottom: 8px;
          }

          .hero-subheadline {
            margin-bottom: 16px;
          }

          .hook-scroll-indicator {
            display: none;
          }

          .hero-cta-btn {
            padding: 12px 28px;
          }
        }

        /* =========================================
           MOBILE OPTIMIZATION (MAX-WIDTH: 768px)
           ========================================= */
        @media (max-width: 768px) {
          /* 1. Disable Scroll Snapping on Mobile */
          .cinematic-container {
            scroll-snap-type: none !important;
            height: auto !important;
            min-height: 100dvh !important;
            overflow-y: auto !important;
          }
          .snap-section {
            scroll-snap-align: none !important;
            height: auto !important;
            min-height: 100dvh !important;
            padding: 40px 16px !important;
          }

          /* Hero section: account for sticky header + bottom nav */
          .section-hook {
            min-height: calc(100dvh - 72px) !important;
            padding-top: 80px !important;
            padding-bottom: 24px !important;
          }

          /* 2. Stack the Split Panes */
          .property-split {
            flex-direction: column !important;
            height: auto !important;
            min-height: auto !important;
          }

          .property-menu {
            width: 100% !important;
            min-width: 100% !important;
            padding: 32px 20px !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border-solid) !important;
            height: auto !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: center !important;
            max-height: none !important;
          }

          .property-menu .menu-footer {
            width: 100% !important;
            margin-top: 16px !important;
          }

          .property-menu .menu-footer .prominent-action-link {
            width: 100% !important;
            text-align: center !important;
          }

          .matrix-preview-pane {
            width: 100% !important;
            padding: 32px 16px !important;
            height: auto !important;
          }

          /* 3. Adjust Flow Grid (Wishlist Layer) */
          .flow-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
          }

          /* 4. Fix Abstract Workspace Graphic */
          .matrix-preview-pane > div {
            padding: 24px 16px !important;
          }

          /* 5. UFO zone — smaller on mobile */
          .title-ufo-zone {
            height: 120px !important;
            margin-bottom: 4px !important;
          }
          .title-ufo-svg {
            width: 80px !important;
          }
        }
        
        @media (max-width: 480px) {
          /* Stack Flow Grid to 1 column on tiny screens */
          .flow-grid {
            grid-template-columns: 1fr !important;
          }
          
          /* Slightly smaller padding on phones */
          .property-menu {
            padding: 24px 16px !important;
          }
        }
      `}</style>

      <section className="snap-section section-footer-wrapper" style={{ height: 'auto', minHeight: 'auto', scrollSnapAlign: 'end' }}>
        <Footer />
      </section>

      {/* Cinematic golden-light journey ΓÇö overlay, activated by the UFO click */}
      <CinematicJourney />
    </main>
  );
}

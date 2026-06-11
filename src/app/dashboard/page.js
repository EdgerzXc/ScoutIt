"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import Link from "next/link";

// --- Mock Data for Role Switcher ---
const MOCK_BROKER_DATA = {
  properties: [
    { id: "prop-1", title: "Aurelia Residences Penthouse", category: "Residential", location: "BGC Core", views: 1240, inquiries: 42, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80" },
    { id: "prop-2", title: "The Estate Makati", category: "Residential", location: "Makati Central", views: 980, inquiries: 28, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80" },
    { id: "prop-3", title: "Zuellig Commercial Tower", category: "Commercial", location: "Makati CBD", views: 640, inquiries: 15, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80" }
  ],
  leads: [
    { id: "lead-1", client: "Julian de Ayala", email: "julian@ayala-capital.ph", intent: "Targeting modernist penthouse in BGC Core with high private terrace buffer. Prepared for outright acquisition.", status: "Pending Clearance", date: "June 3, 2026" },
    { id: "lead-2", client: "Maria Clara Lopez", email: "m.clara@lopez-holdings.com", intent: "Evaluating Siargao beachfront properties for fractional STR yield. ₱80M deployment limit.", status: "Cleared", date: "May 30, 2026" }
  ],
  rating: {
    score: 88,
    retentions: 92,
    continuity: 85,
    velocity: 88
  }
};

const MOCK_PHOTOGRAPHER_DATA = {
  portfolio: [
    { id: "photo-1", title: "Modernist BGC Villa", category: "Interior Architecture", location: "BGC Core", client: "Elena Santos", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80" },
    { id: "photo-2", title: "Poblacion Culinary Warehouse", category: "Commercial & F&B", location: "Poblacion", client: "Sofia Araneta", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80" }
  ],
  bookings: [
    { id: "book-1", client: "Marco Reyes", location: "Siargao Resort Site", service: "Drone & Lifestyle Session", date: "June 18, 2026", status: "Confirmed" },
    { id: "book-2", client: "Camille Laurel", location: "QC Heritage Estate", service: "Architectural HDR Session", date: "June 25, 2026", status: "Pending Response" }
  ],
  stats: {
    delivered: 48,
    rating: 4.9,
    activeContracts: 2
  }
};

const MOCK_RESEARCHER_DATA = {
  briefs: [
    { id: "brief-1", title: "Alabang Hills Zoning Validation", district: "Alabang", type: "Zoning & Title Chain", deadline: "June 15, 2026", status: "Active" },
    { id: "brief-2", title: "Ortigas Commercial Density Report", district: "Ortigas", type: "Geographical Flow Analysis", deadline: "June 22, 2026", status: "Assigned" }
  ],
  completed: [
    { id: "rep-1", title: "Batasan Hills Flood Risk Analysis", date: "May 12, 2026", clearance: "Tier 2 - Omega Approved" },
    { id: "rep-2", title: "Makati Core Foot Traffic Survey", date: "April 29, 2026", clearance: "Tier 1 - Alpha Approved" }
  ],
  stats: {
    reportsDelivered: 19,
    marketsCovered: "Makati, BGC, Alabang, QC",
    accuracyRating: "99.4%"
  }
};

const MOCK_DESIGNER_DATA = {
  projects: [
    { id: "des-1", title: "The Glasshouse Styling Setup", venue: "The Glasshouse BGC", theme: "Glassmorphism Floral", date: "May 2026", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80" },
    { id: "des-2", title: "Antonio's Ridge Banquet Layout", venue: "Antonio's Tagaytay", theme: "Spanish Colonial Elegance", date: "April 2026", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&q=80" }
  ],
  requests: [
    { id: "req-1", client: "Solaire Corporate Event Group", venue: "Solaire Ballroom", theme: "Retro Futurist Showcase", date: "July 12, 2026", status: "Awaiting Moodboard" },
    { id: "req-2", client: "Aurelia Luxury Reception", venue: "Aurelia Podium", theme: "Modernist Tropical Garden", date: "August 04, 2026", status: "Under Review" }
  ],
  stats: {
    styledVenues: 14,
    clientSatisfaction: "98%",
    partnerRank: "Principal Designer"
  }
};

const ROLES = [
  { value: "Broker", label: "Broker" },
  { value: "Photographer", label: "Photographer" },
  { value: "Researcher", label: "Site Researcher" },
  { value: "Event Designer", label: "Event Designer" }
];

export default function MultiRoleDashboard() {
  // --- Profile Identity Setup ---
  const [profile, setProfile] = useState({
    name: "Miguel Torres, REB",
    title: "Principal Design Advisor",
    specialty: "Ultra-Luxury Residential // BGC Focus",
    bio: "With over a decade of experience in BGC and Makati central districts, Miguel specializes in modernist architectural estates, low-density penthouses, and high-value design-first spaces.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    clearance: "Tier 1 - Alpha",
    license: "PRC REB License No. 0019284",
    location: "BGC Focus",
    role: "Broker"
  });

  const [activeTab, setActiveTab] = useState("roster"); // 'profile', 'roster', 'leads', 'stats', 'id'
  const [notification, setNotification] = useState("");
  const [formData, setFormData] = useState(profile);
  const [showAddModal, setShowAddModal] = useState(false);

  // Broker curation additions state
  const [brokerProperties, setBrokerProperties] = useState(MOCK_BROKER_DATA.properties);
  const [brokerLeads, setBrokerLeads] = useState(MOCK_BROKER_DATA.leads);
  const [newAsset, setNewAsset] = useState({ title: "", category: "Residential", location: "", image: "" });

  // Photographer additions state
  const [photoPortfolio, setPhotoPortfolio] = useState(MOCK_PHOTOGRAPHER_DATA.portfolio);
  const [photoBookings, setPhotoBookings] = useState(MOCK_PHOTOGRAPHER_DATA.bookings);
  const [newPhoto, setNewPhoto] = useState({ title: "", category: "Interior Architecture", location: "", client: "", image: "" });

  // Researcher additions state
  const [researchBriefs, setResearchBriefs] = useState(MOCK_RESEARCHER_DATA.briefs);
  const [researchCompleted, setResearchCompleted] = useState(MOCK_RESEARCHER_DATA.completed);
  const [newReport, setNewReport] = useState({ title: "", date: "", briefId: "" });

  // Designer additions state
  const [designerProjects, setDesignerProjects] = useState(MOCK_DESIGNER_DATA.projects);
  const [designerRequests, setDesignerRequests] = useState(MOCK_DESIGNER_DATA.requests);
  const [newProject, setNewProject] = useState({ title: "", venue: "", theme: "", date: "", image: "" });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("scoutit_user_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setFormData(parsed);
      } catch (e) {
        console.error("Failed to parse saved user profile", e);
      }
    }
  }, []);

  const saveProfile = (nextProfile) => {
    setProfile(nextProfile);
    localStorage.setItem("scoutit_user_profile", JSON.stringify(nextProfile));
  };

  const handleRoleChange = (e) => {
    const nextRole = e.target.value;
    // Map defaults for the chosen role to make it realistic
    let nextTitle = profile.title;
    let nextSpecialty = profile.specialty;
    let nextBio = profile.bio;
    let nextLicense = profile.license;

    if (nextRole === "Broker") {
      nextTitle = "Principal Design Advisor";
      nextSpecialty = "Ultra-Luxury Residential // BGC Focus";
      nextBio = "With over a decade of experience in BGC and Makati central districts, Miguel specializes in modernist architectural estates, low-density penthouses, and high-value design-first spaces.";
      nextLicense = "PRC REB License No. 0019284";
    } else if (nextRole === "Photographer") {
      nextTitle = "Bespoke Architectural Photographer";
      nextSpecialty = "Interior Design & Aerial Drone Vibe";
      nextBio = "Focusing on capturing the geometric integrity, raw material layouts, and dynamic natural light profiles of modern residential and hospitality structures.";
      nextLicense = "PRC Photographer Accreditation No. 20934";
    } else if (nextRole === "Researcher") {
      nextTitle = "Senior Spatial Intelligence Analyst";
      nextSpecialty = "Title Validation & Flood Risk Modeling";
      nextBio = "Conducting deep zoning research, historical title traces, and architectural due diligence reports to secure capital placements in high-growth corridors.";
      nextLicense = "PRC Analyst Registration No. 0038914";
    } else if (nextRole === "Event Designer") {
      nextTitle = "Lead Spatial Event Stylist";
      nextSpecialty = "Glassmorphism & Biophilic Venue Layouts";
      nextBio = "Designing immersive atmosphere overlays and custom spatial setups for prestige corporate launches and high-value private receptions.";
      nextLicense = "PRC Design Guild No. 10294";
    }

    const updated = {
      ...profile,
      role: nextRole,
      title: nextTitle,
      specialty: nextSpecialty,
      bio: nextBio,
      license: nextLicense
    };
    saveProfile(updated);
    setFormData(updated);
    showSuccess(`Switched workspace to ${nextRole} matrix.`);
    setActiveTab("roster");
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    saveProfile(formData);
    showSuccess("Identity briefing synchronized with browser memory.");
  };

  const showSuccess = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  // --- Actions per role ---
  // Broker
  const handleAddProperty = (e) => {
    e.preventDefault();
    if (!newAsset.title || !newAsset.location) return;
    const finalProp = {
      id: `prop-${Date.now()}`,
      title: newAsset.title,
      category: newAsset.category,
      location: newAsset.location,
      views: 0,
      inquiries: 0,
      image: newAsset.image.trim() || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80"
    };
    setBrokerProperties(prev => [finalProp, ...prev]);
    setNewAsset({ title: "", category: "Residential", location: "", image: "" });
    setShowAddModal(false);
    showSuccess("New spatial asset cataloged.");
  };

  const removeProperty = (id) => {
    setBrokerProperties(prev => prev.filter(p => p.id !== id));
    showSuccess("Property removed from portfolio.");
  };

  const updateLeadStatus = (id, newStatus) => {
    setBrokerLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    showSuccess(`Lead status updated to: ${newStatus}`);
  };

  // Photographer
  const handleAddPortfolio = (e) => {
    e.preventDefault();
    if (!newPhoto.title) return;
    const finalPhoto = {
      id: `photo-${Date.now()}`,
      title: newPhoto.title,
      category: newPhoto.category,
      location: newPhoto.location || "Metro Manila",
      client: newPhoto.client || "Self Commissioned",
      image: newPhoto.image.trim() || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80"
    };
    setPhotoPortfolio(prev => [finalPhoto, ...prev]);
    setNewPhoto({ title: "", category: "Interior Architecture", location: "", client: "", image: "" });
    setShowAddModal(false);
    showSuccess("Portfolio shot cataloged.");
  };

  const removePortfolioShot = (id) => {
    setPhotoPortfolio(prev => prev.filter(p => p.id !== id));
    showSuccess("Portfolio piece archived.");
  };

  const updateBookingStatus = (id, newStatus) => {
    setPhotoBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    showSuccess(`Booking request updated to: ${newStatus}`);
  };

  // Researcher
  const handleAddReport = (e) => {
    e.preventDefault();
    if (!newReport.title) return;
    const finalReport = {
      id: `rep-${Date.now()}`,
      title: newReport.title,
      date: newReport.date || "Today",
      clearance: "Review Awaiting"
    };
    setResearchCompleted(prev => [finalReport, ...prev]);
    if (newReport.briefId) {
      setResearchBriefs(prev => prev.filter(b => b.id !== newReport.briefId));
    }
    setNewReport({ title: "", date: "", briefId: "" });
    setShowAddModal(false);
    showSuccess("Due diligence report submitted for regulatory scan.");
  };

  const handleStartBrief = (id) => {
    setResearchBriefs(prev => prev.map(b => b.id === id ? { ...b, status: "In Progress" } : b));
    showSuccess("Brief locks bypassed. Investigation started.");
  };

  // Designer
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProject.title) return;
    const finalProj = {
      id: `des-${Date.now()}`,
      title: newProject.title,
      venue: newProject.venue || "Universal Hall",
      theme: newProject.theme || "Modernist Minimalism",
      date: newProject.date || "Just Now",
      image: newProject.image.trim() || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80"
    };
    setDesignerProjects(prev => [finalProj, ...prev]);
    setNewProject({ title: "", venue: "", theme: "", date: "", image: "" });
    setShowAddModal(false);
    showSuccess("Design layout registered to profile showcase.");
  };

  const updateRequestStatus = (id, newStatus) => {
    setDesignerRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    showSuccess(`Styling task marked as: ${newStatus}`);
  };

  return (
    <div className="page-wrapper">
      <Header />

      <main className="workspace-main">
        {/* Success toast notification */}
        <div className={`notification-toast ${notification ? "show" : ""}`}>
          <div className="toast-inner">
            <span className="toast-dot"></span>
            <span className="toast-text">{notification}</span>
          </div>
        </div>

        <div className="workspace-grid">
          {/* 1. SIDEBAR MATRIX CONTROL PANEL */}
          <aside className="workspace-sidebar">
            <div className="sidebar-identity">
              <div className="sidebar-avatar" style={{ backgroundImage: `url(${profile.image})` }}></div>
              <div className="sidebar-profile-text">
                <h3>{profile.name}</h3>
                <p>{profile.title}</p>
                <span className="clearance-badge">{profile.clearance}</span>
              </div>
            </div>

            <div className="role-switcher-section">
              <label className="role-switcher-label">WORKSPACE MATRIX MODE</label>
              <div className="custom-select-wrapper">
                <select className="role-switcher-select" value={profile.role} onChange={handleRoleChange}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>

            <nav className="sidebar-nav-list">
              <button className={`nav-item-btn ${activeTab === "roster" ? "active" : ""}`} onClick={() => setActiveTab("roster")}>
                <span className="nav-icon">📁</span>
                <span>{profile.role === "Broker" ? "Managed Spaces" : profile.role === "Photographer" ? "Showcase Portfolio" : profile.role === "Researcher" ? "Active Research" : "Designed Layouts"}</span>
              </button>
              <button className={`nav-item-btn ${activeTab === "leads" ? "active" : ""}`} onClick={() => setActiveTab("leads")}>
                <span className="nav-icon">💬</span>
                <span>{profile.role === "Broker" ? "Inbound Leads" : profile.role === "Photographer" ? "Bookings Queue" : profile.role === "Researcher" ? "Research Briefs" : "Styling Requests"}</span>
              </button>
              <button className={`nav-item-btn ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
                <span className="nav-icon">📈</span>
                <span>Performance Matrix</span>
              </button>
              <button className={`nav-item-btn ${activeTab === "id" ? "active" : ""}`} onClick={() => setActiveTab("id")}>
                <span className="nav-icon">🪪</span>
                <span>Verification ID</span>
              </button>
              <button className={`nav-item-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                <span className="nav-icon">⚙️</span>
                <span>Identity Settings</span>
              </button>
            </nav>
          </aside>

          {/* 2. DYNAMIC WORKSPACE PANEL CONTENT */}
          <section className="workspace-panel-view">
            {/* Tab A: Roster Items */}
            {activeTab === "roster" && (
              <div className="panel-fade-wrapper">
                <header className="panel-header">
                  <div className="panel-title-block">
                    <span className="panel-kicker">Matrix Asset Registry</span>
                    <h2 className="panel-heading">{profile.role === "Broker" ? "Managed Properties" : profile.role === "Photographer" ? "Portfolio Pieces" : profile.role === "Researcher" ? "Zoning Investigations" : "Visual Layout Gallery"}</h2>
                  </div>
                  <button className="panel-action-btn" onClick={() => setShowAddModal(true)}>
                    + Catalog New {profile.role === "Broker" ? "Property" : profile.role === "Photographer" ? "Piece" : profile.role === "Report" ? "Report" : "Layout"}
                  </button>
                </header>

                {profile.role === "Broker" && (
                  <div className="curations-grid">
                    {brokerProperties.map(prop => (
                      <article key={prop.id} className="asset-card">
                        <div className="asset-card-image" style={{ backgroundImage: `url(${prop.image})` }}>
                          <span className="asset-loc-badge">{prop.location}</span>
                        </div>
                        <div className="asset-card-body">
                          <span className="asset-cat-tag">{prop.category}</span>
                          <h3>{prop.title}</h3>
                          <div className="asset-inquiry-stats">
                            <div className="stat-pill"><strong>{prop.views}</strong> views</div>
                            <div className="stat-pill"><strong>{prop.inquiries}</strong> leads</div>
                          </div>
                          <div className="asset-card-footer">
                            <Link href={`/property/${prop.slug || prop.id}`} className="view-briefing-btn">View Briefing →</Link>
                            <button className="delete-asset-btn" onClick={() => removeProperty(prop.id)}>Remove</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {profile.role === "Photographer" && (
                  <div className="curations-grid">
                    {photoPortfolio.map(shot => (
                      <article key={shot.id} className="asset-card">
                        <div className="asset-card-image" style={{ backgroundImage: `url(${shot.image})` }}>
                          <span className="asset-loc-badge">{shot.location}</span>
                        </div>
                        <div className="asset-card-body">
                          <span className="asset-cat-tag">{shot.category}</span>
                          <h3>{shot.title}</h3>
                          <p className="asset-desc-text">Client Commission: <strong>{shot.client}</strong></p>
                          <div className="asset-card-footer">
                            <button className="delete-asset-btn" onClick={() => removePortfolioShot(shot.id)}>Archive Piece</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {profile.role === "Researcher" && (
                  <div className="leads-list">
                    <h3 className="section-subheading">Delivered Briefing Investigations</h3>
                    {researchCompleted.map(rep => (
                      <div key={rep.id} className="lead-card flex-between">
                        <div>
                          <span className="lead-date">{rep.date}</span>
                          <h4>{rep.title}</h4>
                        </div>
                        <span className="clearance-tag-status green">{rep.clearance}</span>
                      </div>
                    ))}
                  </div>
                )}

                {profile.role === "Event Designer" && (
                  <div className="curations-grid">
                    {designerProjects.map(proj => (
                      <article key={proj.id} className="asset-card">
                        <div className="asset-card-image" style={{ backgroundImage: `url(${proj.image})` }}>
                          <span className="asset-loc-badge">{proj.date}</span>
                        </div>
                        <div className="asset-card-body">
                          <span className="asset-cat-tag">{proj.venue}</span>
                          <h3>{proj.title}</h3>
                          <p className="asset-desc-text">Design Theme: <strong>{proj.theme}</strong></p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab B: Leads / Work Queue */}
            {activeTab === "leads" && (
              <div className="panel-fade-wrapper">
                <header className="panel-header">
                  <div className="panel-title-block">
                    <span className="panel-kicker">Secure Comms Pipeline</span>
                    <h2 className="panel-heading">{profile.role === "Broker" ? "Inbound Connection Leads" : profile.role === "Photographer" ? "Creative Shoot Requests" : profile.role === "Researcher" ? "Active Research Briefs" : "Styling Inquiries"}</h2>
                  </div>
                </header>

                {profile.role === "Broker" && (
                  <div className="leads-list">
                    {brokerLeads.map(lead => (
                      <div key={lead.id} className="lead-card">
                        <div className="lead-card-header">
                          <div className="client-meta">
                            <h4>{lead.client}</h4>
                            <span>{lead.email}</span>
                          </div>
                          <span className={`lead-status-badge ${lead.status.toLowerCase().replace(/\s+/g, '-')}`}>{lead.status}</span>
                        </div>
                        <p className="lead-intent-text">"{lead.intent}"</p>
                        <div className="lead-actions-row">
                          <span className="lead-date">{lead.date}</span>
                          <div className="btn-group">
                            {lead.status !== "Cleared" && (
                              <button className="approve-lead-btn" onClick={() => updateLeadStatus(lead.id, "Cleared")}>Approve Connection</button>
                            )}
                            <button className="reject-lead-btn" onClick={() => updateLeadStatus(lead.id, "Archived")}>Archive</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {profile.role === "Photographer" && (
                  <div className="leads-list">
                    {photoBookings.map(book => (
                      <div key={book.id} className="lead-card">
                        <div className="lead-card-header">
                          <div className="client-meta">
                            <h4>{book.client}</h4>
                            <span>Project Location: <strong>{book.location}</strong></span>
                          </div>
                          <span className={`lead-status-badge ${book.status.toLowerCase().replace(/\s+/g, '-')}`}>{book.status}</span>
                        </div>
                        <p className="lead-intent-text">Requested Session Type: <strong>{book.service}</strong></p>
                        <div className="lead-actions-row">
                          <span className="lead-date">Scheduled Shoot Target: {book.date}</span>
                          <div className="btn-group">
                            {book.status !== "Confirmed" && (
                              <button className="approve-lead-btn" onClick={() => updateBookingStatus(book.id, "Confirmed")}>Confirm Booking</button>
                            )}
                            <button className="reject-lead-btn" onClick={() => updateBookingStatus(book.id, "Declined")}>Decline</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {profile.role === "Researcher" && (
                  <div className="leads-list">
                    {researchBriefs.map(brief => (
                      <div key={brief.id} className="lead-card">
                        <div className="lead-card-header">
                          <div className="client-meta">
                            <h4>{brief.title}</h4>
                            <span>Target Corridor: <strong>{brief.district}</strong></span>
                          </div>
                          <span className={`lead-status-badge ${brief.status.toLowerCase().replace(/\s+/g, '-')}`}>{brief.status}</span>
                        </div>
                        <p className="lead-intent-text">Deliverables Profile: <strong>{brief.type}</strong></p>
                        <div className="lead-actions-row">
                          <span className="lead-date">Deadline: {brief.deadline}</span>
                          {brief.status !== "In Progress" && (
                            <button className="approve-lead-btn" onClick={() => handleStartBrief(brief.id)}>Initialize Scan Brief</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {profile.role === "Event Designer" && (
                  <div className="leads-list">
                    {designerRequests.map(req => (
                      <div key={req.id} className="lead-card">
                        <div className="lead-card-header">
                          <div className="client-meta">
                            <h4>{req.client}</h4>
                            <span>Proposed Venue: <strong>{req.venue}</strong></span>
                          </div>
                          <span className={`lead-status-badge ${req.status.toLowerCase().replace(/\s+/g, '-')}`}>{req.status}</span>
                        </div>
                        <p className="lead-intent-text">Atmosphere Concept: <strong>{req.theme}</strong></p>
                        <div className="lead-actions-row">
                          <span className="lead-date">Event Date: {req.date}</span>
                          <div className="btn-group">
                            <button className="approve-lead-btn" onClick={() => updateRequestStatus(req.id, "Concept Approved")}>Approve Theme</button>
                            <button className="reject-lead-btn" onClick={() => updateRequestStatus(req.id, "Request Declined")}>Decline</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab C: Stats & Ratings */}
            {activeTab === "stats" && (
              <div className="panel-fade-wrapper">
                <header className="panel-header">
                  <div className="panel-title-block">
                    <span className="panel-kicker">Performance Metrics &amp; Analytics</span>
                    <h2 className="panel-heading">{profile.role === "Broker" ? "Scout Rating Blueprint" : "Roster Analytics Matrix"}</h2>
                  </div>
                </header>

                {profile.role === "Broker" && (
                  <div className="stats-dashboard">
                    <div className="metric-overview-banner">
                      <div className="main-score-block">
                        <span className="score-lbl">OVERALL SCOUT RATING</span>
                        <div className="score-val-wrap">
                          <span className="score-value">{MOCK_BROKER_DATA.rating.score}</span>
                          <span className="score-max">/100</span>
                        </div>
                      </div>
                      <div className="score-explanation">
                        <p>Your Scout Rating is a weighted cryptographic metric derived from three key vectors of structural accuracy and response performance.</p>
                      </div>
                    </div>

                    <div className="rating-breakdown-grid">
                      <div className="breakdown-card">
                        <div className="breakdown-header">
                          <h4>Active Retentions</h4>
                          <span className="breakdown-pct">{MOCK_BROKER_DATA.rating.retentions}%</span>
                        </div>
                        <div className="rating-bar-outer">
                          <div className="rating-bar-inner" style={{ width: `${MOCK_BROKER_DATA.rating.retentions}%` }}></div>
                        </div>
                        <p className="breakdown-desc">Measures long-term listing client verification scores and verified closures weight (40%).</p>
                      </div>

                      <div className="breakdown-card">
                        <div className="breakdown-header">
                          <h4>Continuity Score</h4>
                          <span className="breakdown-pct">{MOCK_BROKER_DATA.rating.continuity}%</span>
                        </div>
                        <div className="rating-bar-outer">
                          <div className="rating-bar-inner" style={{ width: `${MOCK_BROKER_DATA.rating.continuity}%` }}></div>
                        </div>
                        <p className="breakdown-desc">Evaluates standard profile details retention, license standing, and data freshness metrics (40%).</p>
                      </div>

                      <div className="breakdown-card">
                        <div className="breakdown-header">
                          <h4>Stewardship Velocity</h4>
                          <span className="breakdown-pct">{MOCK_BROKER_DATA.rating.velocity}%</span>
                        </div>
                        <div className="rating-bar-outer">
                          <div className="rating-bar-inner" style={{ width: `${MOCK_BROKER_DATA.rating.velocity}%` }}></div>
                        </div>
                        <p className="breakdown-desc">Tracks lead response timelines and dispatch clearance speed metrics (20%).</p>
                      </div>
                    </div>
                  </div>
                )}

                {profile.role === "Photographer" && (
                  <div className="rating-breakdown-grid">
                    <div className="breakdown-card">
                      <h3>Total Delivered Sessions</h3>
                      <span className="big-stat-number">{MOCK_PHOTOGRAPHER_DATA.stats.delivered}</span>
                      <p className="breakdown-desc">Verified interior and architectural media brief deliveries across Philippine properties.</p>
                    </div>
                    <div className="breakdown-card">
                      <h3>Client Satisfaction Rating</h3>
                      <span className="big-stat-number" style={{ color: 'var(--accent)' }}>{MOCK_PHOTOGRAPHER_DATA.stats.rating} / 5.0</span>
                      <p className="breakdown-desc">Average feedback score from registered BGC and Makati advisors.</p>
                    </div>
                    <div className="breakdown-card">
                      <h3>Active Contracts</h3>
                      <span className="big-stat-number">{MOCK_PHOTOGRAPHER_DATA.stats.activeContracts}</span>
                      <p className="breakdown-desc">Ongoing shoot schedules currently registered in memory ledger.</p>
                    </div>
                  </div>
                )}

                {profile.role === "Researcher" && (
                  <div className="rating-breakdown-grid">
                    <div className="breakdown-card">
                      <h3>Total Reports Delivered</h3>
                      <span className="big-stat-number">{MOCK_RESEARCHER_DATA.stats.reportsDelivered}</span>
                      <p className="breakdown-desc">Regulatory land traces, titles checks, and soil stability audits compiled.</p>
                    </div>
                    <div className="breakdown-card">
                      <h3>Accredited Hubs Coverage</h3>
                      <span className="big-stat-number" style={{ fontSize: '24px', lineHeight: '2.5' }}>{MOCK_RESEARCHER_DATA.stats.marketsCovered}</span>
                      <p className="breakdown-desc">Vetted coverage areas with direct access to local register of deeds archives.</p>
                    </div>
                    <div className="breakdown-card">
                      <h3>Briefing Accuracy Rating</h3>
                      <span className="big-stat-number" style={{ color: 'var(--accent)' }}>{MOCK_RESEARCHER_DATA.stats.accuracyRating}</span>
                      <p className="breakdown-desc">Regulatory compliance rating from independent external audits.</p>
                    </div>
                  </div>
                )}

                {profile.role === "Event Designer" && (
                  <div className="rating-breakdown-grid">
                    <div className="breakdown-card">
                      <h3>Styled Venues</h3>
                      <span className="big-stat-number">{MOCK_DESIGNER_DATA.stats.styledVenues}</span>
                      <p className="breakdown-desc">Commercial, retail, and resort venues styled under principal accreditation.</p>
                    </div>
                    <div className="breakdown-card">
                      <h3>Satisfaction Index</h3>
                      <span className="big-stat-number" style={{ color: 'var(--accent)' }}>{MOCK_DESIGNER_DATA.stats.clientSatisfaction}</span>
                      <p className="breakdown-desc">Percentage of private clients recommending setup layouts for subsequent events.</p>
                    </div>
                    <div className="breakdown-card">
                      <h3>Roster Ranking Status</h3>
                      <span className="big-stat-number" style={{ fontSize: '28px', lineHeight: '2.2' }}>{MOCK_DESIGNER_DATA.stats.partnerRank}</span>
                      <p className="breakdown-desc">Current rank within the ScoutIt ecosystem styling directory.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab D: Verification Card / Digital ID */}
            {activeTab === "id" && (
              <div className="panel-fade-wrapper flex-center" style={{ flexDirection: 'column', gap: '32px' }}>
                <div className="id-card-frame">
                  <div className="id-card-glow-layer"></div>
                  <div className="id-card-content">
                    <div className="id-card-header">
                      <div className="id-branding">
                        <span className="id-brand-scout">Scout</span><span className="id-brand-it">IT</span>
                      </div>
                      <span className="id-ver-status">VERIFIED PARTNER</span>
                    </div>

                    <div className="id-card-body">
                      <div className="id-avatar-slot" style={{ backgroundImage: `url(${profile.image})` }}></div>
                      <div className="id-meta-slot">
                        <h3 className="id-name">{profile.name}</h3>
                        <p className="id-role-desc">{profile.title}</p>
                        <div className="id-params-list">
                          <div className="id-param"><span className="id-lbl">CLEARANCE:</span><strong>{profile.clearance}</strong></div>
                          <div className="id-param"><span className="id-lbl">MAT MODE:</span><strong>{profile.role}</strong></div>
                          <div className="id-param"><span className="id-lbl">MARKET:</span><strong>{profile.location}</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="id-card-footer">
                      <div className="id-qr-placeholder">
                        <div className="qr-grid">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className={`qr-cell ${i % 2 === 0 || i % 3 === 0 ? "filled" : ""}`}></div>
                          ))}
                        </div>
                      </div>
                      <div className="id-card-compliance">
                        <span>{profile.license}</span>
                        <span>ISSUED: 2026 &middot; SECURE CRYPTO ACCESS</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="download-id-btn" onClick={() => showSuccess("Digital Verification Card downloaded to assets folder.")}>
                  Download Cryptographic ID Pass
                </button>
              </div>
            )}

            {/* Tab E: Profile Identity Editing */}
            {activeTab === "profile" && (
              <div className="panel-fade-wrapper">
                <header className="panel-header">
                  <div className="panel-title-block">
                    <span className="panel-kicker">Ecosystem Credentials</span>
                    <h2 className="panel-heading">Edit Identity Profile</h2>
                  </div>
                </header>

                <form className="profile-edit-form" onSubmit={handleProfileSubmit}>
                  <div className="form-row-split">
                    <div className="form-group">
                      <label>FULL LEGAL NAME &amp; DECORATIONS</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>ACCED-RANK POSITION TITLE</label>
                      <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-row-split">
                    <div className="form-group">
                      <label>PRC REGISTRATION OR GUILD CREDENTIAL NO.</label>
                      <input type="text" value={formData.license} onChange={(e) => setFormData({ ...formData, license: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>GEOGRAPHIC OPERATIONAL BASE</label>
                      <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>AVATAR IMAGE SECURE HTTPS URL</label>
                    <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label>OPERATIONAL FOCUS &amp; SPECIALTIES</label>
                    <input type="text" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label>IDENTITY BIO BRIEFING STATEMENT</label>
                    <textarea rows="4" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} required></textarea>
                  </div>

                  <button type="submit" className="profile-submit-btn">Synchronize Briefing Matrix</button>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* --- ADD NEW ASSET MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            
            {profile.role === "Broker" && (
              <form onSubmit={handleAddProperty}>
                <h3>Catalog New Property Asset</h3>
                <div className="form-group">
                  <label>PROPERTY TITLE</label>
                  <input type="text" value={newAsset.title} onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })} required placeholder="e.g. Aurelia Residences Loft" />
                </div>
                <div className="form-group">
                  <label>SECTOR CATEGORY</label>
                  <select value={newAsset.category} onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="STR">STR / Vacation</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Restaurants">Restaurants / Culinary</option>
                    <option value="Venues">Venues</option>
                  </select>
                </div>
                <div className="form-row-split">
                  <div className="form-group">
                    <label>LOCATION TOWN / CITY</label>
                    <input type="text" value={newAsset.location} onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })} required placeholder="e.g. BGC Core" />
                  </div>
                  <div className="form-group">
                    <label>IMAGE SECURE URL</label>
                    <input type="text" value={newAsset.image} onChange={(e) => setNewAsset({ ...newAsset, image: e.target.value })} placeholder="e.g. https://..." />
                  </div>
                </div>
                <button type="submit" className="modal-submit-btn">Submit Asset Briefing</button>
              </form>
            )}

            {profile.role === "Photographer" && (
              <form onSubmit={handleAddPortfolio}>
                <h3>Catalog New Portfolio Shot</h3>
                <div className="form-group">
                  <label>SHOOT / PROJECT NAME</label>
                  <input type="text" value={newPhoto.title} onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })} required placeholder="e.g. Tagaytay Vista Restaurant Shoot" />
                </div>
                <div className="form-group">
                  <label>VISUAL SPECIALTY CATEGORY</label>
                  <select value={newPhoto.category} onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}>
                    <option value="Interior Architecture">Interior Architecture</option>
                    <option value="Drone Aerial + Lifestyle">Drone Aerial + Lifestyle</option>
                    <option value="Commercial & F&B">Commercial & F&B</option>
                    <option value="Minimalist Residential">Minimalist Residential</option>
                    <option value="Luxury & High-End">Luxury & High-End</option>
                  </select>
                </div>
                <div className="form-row-split">
                  <div className="form-group">
                    <label>COMMISSIONING CLIENT</label>
                    <input type="text" value={newPhoto.client} onChange={(e) => setNewPhoto({ ...newPhoto, client: e.target.value })} required placeholder="e.g. Sofia Araneta" />
                  </div>
                  <div className="form-group">
                    <label>IMAGE SECURE URL</label>
                    <input type="text" value={newPhoto.image} onChange={(e) => setNewPhoto({ ...newPhoto, image: e.target.value })} placeholder="e.g. https://..." />
                  </div>
                </div>
                <button type="submit" className="modal-submit-btn">Register Shot Briefing</button>
              </form>
            )}

            {profile.role === "Researcher" && (
              <form onSubmit={handleAddReport}>
                <h3>Submit Due Diligence Report</h3>
                <div className="form-group">
                  <label>INVESTIGATION / BRIEF TITLE</label>
                  <input type="text" value={newReport.title} onChange={(e) => setNewReport({ ...newReport, title: e.target.value })} required placeholder="e.g. New Manila Zoning Audit" />
                </div>
                <div className="form-group">
                  <label>LINKED OUTSTANDING BRIEF (OPTIONAL)</label>
                  <select value={newReport.briefId} onChange={(e) => setNewReport({ ...newReport, briefId: e.target.value })}>
                    <option value="">No link - Direct submission</option>
                    {researchBriefs.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>INVESTIGATION COMPILE DATE</label>
                  <input type="text" value={newReport.date} onChange={(e) => setNewReport({ ...newReport, date: e.target.value })} placeholder="e.g. June 11, 2026" />
                </div>
                <button type="submit" className="modal-submit-btn">Upload Matrix Report</button>
              </form>
            )}

            {profile.role === "Event Designer" && (
              <form onSubmit={handleAddProject}>
                <h3>Catalog Designed Styling Setup</h3>
                <div className="form-group">
                  <label>STYLING LAYOUT NAME</label>
                  <input type="text" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} required placeholder="e.g. BGC Glasshouse Launch Setup" />
                </div>
                <div className="form-row-split">
                  <div className="form-group">
                    <label>VENUE LOCATION</label>
                    <input type="text" value={newProject.venue} onChange={(e) => setNewProject({ ...newProject, venue: e.target.value })} required placeholder="e.g. The Glasshouse BGC" />
                  </div>
                  <div className="form-group">
                    <label>ATMOSPHERE DESIGN THEME</label>
                    <input type="text" value={newProject.theme} onChange={(e) => setNewProject({ ...newProject, theme: e.target.value })} required placeholder="e.g. Biophilic Steel Minimalist" />
                  </div>
                </div>
                <div className="form-row-split">
                  <div className="form-group">
                    <label>COMPLETED DATE</label>
                    <input type="text" value={newProject.date} onChange={(e) => setNewProject({ ...newProject, date: e.target.value })} placeholder="e.g. June 2026" />
                  </div>
                  <div className="form-group">
                    <label>IMAGE SECURE URL</label>
                    <input type="text" value={newProject.image} onChange={(e) => setNewProject({ ...newProject, image: e.target.value })} placeholder="e.g. https://..." />
                  </div>
                </div>
                <button type="submit" className="modal-submit-btn">Upload Design Specifications</button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />

      <style jsx global>{`
        .workspace-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 60px 45px;
          min-height: 80vh;
          font-family: var(--font-body), sans-serif;
          color: var(--text-primary, #f5f3ee);
        }

        /* success notification toast */
        .notification-toast {
          position: fixed;
          top: 80px;
          right: 40px;
          z-index: 1100;
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
          transition: all 0.35s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .notification-toast.show {
          opacity: 1;
          transform: translateY(0);
        }
        .toast-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(14, 14, 14, 0.95);
          border: 1px solid var(--accent, #c8a96e);
          box-shadow: 0 8px 32px rgba(200, 169, 110, 0.2);
          border-radius: 4px;
          padding: 12px 20px;
          backdrop-filter: blur(12px);
        }
        .toast-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent, #c8a96e);
          box-shadow: 0 0 8px var(--accent, #c8a96e);
        }
        .toast-text {
          font-size: 13px;
          font-weight: 550;
          letter-spacing: 0.02em;
          color: #fff;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 48px;
          align-items: start;
        }

        /* 1. SIDEBAR CONTROLS */
        .workspace-sidebar {
          background: #111111;
          border: 1px solid var(--border-solid, rgba(255, 255, 255, 0.08));
          border-radius: 6px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .sidebar-identity {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 24px;
        }
        .sidebar-avatar {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          border: 2px solid rgba(200, 169, 110, 0.2);
        }
        .sidebar-profile-text h3 {
          font-family: var(--font-display, serif);
          font-size: 18px;
          margin-bottom: 4px;
          color: #fff;
        }
        .sidebar-profile-text p {
          font-size: 11px;
          color: var(--text-secondary, #a0a0a0);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .clearance-badge {
          display: inline-block;
          font-family: var(--font-mono, monospace);
          font-size: 8px;
          color: var(--accent, #c8a96e);
          border: 1px solid var(--accent, #c8a96e);
          padding: 3px 8px;
          border-radius: 2px;
          letter-spacing: 0.1em;
        }

        .role-switcher-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .role-switcher-label {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.12em;
          color: var(--text-secondary, #a0a0a0);
        }
        .custom-select-wrapper {
          position: relative;
          width: 100%;
        }
        .role-switcher-select {
          width: 100%;
          appearance: none;
          background: #090909;
          border: 1px solid var(--border-solid, rgba(255, 255, 255, 0.08));
          color: #fff;
          padding: 10px 16px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .role-switcher-select:focus {
          outline: none;
          border-color: var(--accent, #c8a96e);
        }
        .select-arrow {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 8px;
          color: var(--text-secondary);
          pointer-events: none;
        }

        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nav-item-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          padding: 12px 16px;
          border-radius: 4px;
          color: var(--text-secondary, #a0a0a0);
          font-size: 13px;
          font-weight: 550;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .nav-item-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
        }
        .nav-item-btn.active {
          color: var(--accent, #c8a96e);
          background: rgba(200, 169, 110, 0.06);
          border-color: rgba(200, 169, 110, 0.15);
        }
        .nav-icon {
          font-size: 14px;
        }

        /* 2. MAIN WORKSPACE VIEW */
        .workspace-panel-view {
          min-height: 500px;
        }
        .panel-fade-wrapper {
          animation: panelFadeIn 0.3s ease-out forwards;
        }
        @keyframes panelFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 24px;
          margin-bottom: 36px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .panel-kicker {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent, #c8a96e);
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        .panel-heading {
          font-family: var(--font-display);
          font-size: 28px;
          color: #fff;
          margin-top: 4px;
        }
        .panel-action-btn {
          background: transparent;
          border: 1px solid var(--accent, #c8a96e);
          color: var(--accent, #c8a96e);
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .panel-action-btn:hover {
          background: var(--accent);
          color: #0e0e0e;
        }

        /* Grid curation portfolios */
        .curations-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
        }
        .asset-card {
          background: #111;
          border: 1px solid var(--border-solid, rgba(255, 255, 255, 0.08));
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color 0.25s;
        }
        .asset-card:hover {
          border-color: rgba(200, 169, 110, 0.3);
        }
        .asset-card-image {
          height: 180px;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .asset-loc-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.75);
          color: #fff;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 2px;
        }
        .asset-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .asset-cat-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--accent);
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }
        .asset-card-body h3 {
          font-family: var(--font-display);
          font-size: 16px;
          margin-bottom: 12px;
          color: #fff;
          line-height: 1.3;
        }
        .asset-desc-text {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        .asset-inquiry-stats {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-pill {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 4px;
          color: var(--text-secondary);
        }
        .stat-pill strong {
          color: #fff;
        }
        .asset-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 16px;
          margin-top: auto;
        }
        .view-briefing-btn {
          font-size: 11px;
          color: var(--accent);
          text-decoration: none;
          font-weight: bold;
        }
        .delete-asset-btn {
          background: transparent;
          border: none;
          color: #ff6b6b;
          font-size: 11px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .delete-asset-btn:hover {
          opacity: 0.8;
        }

        /* Leads list and pipelines */
        .leads-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .lead-card {
          background: #111;
          border: 1px solid var(--border-solid, rgba(255,255,255,0.08));
          border-radius: 6px;
          padding: 24px;
        }
        .lead-card.flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .lead-card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 16px;
          margin-bottom: 12px;
        }
        .client-meta h4 {
          font-size: 15px;
          color: #fff;
          margin-bottom: 2px;
        }
        .client-meta span {
          font-size: 12px;
          color: var(--text-muted, #777);
        }
        .lead-status-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 4px 8px;
          border-radius: 2px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .lead-status-badge.pending-clearance,
        .lead-status-badge.pending-response,
        .lead-status-badge.assigned,
        .lead-status-badge.awaiting-moodboard {
          background: rgba(200, 169, 110, 0.15);
          color: var(--accent);
          border: 1px solid rgba(200,169,110,0.3);
        }
        .lead-status-badge.cleared,
        .lead-status-badge.confirmed,
        .lead-status-badge.active,
        .lead-status-badge.concept-approved {
          background: rgba(76, 175, 125, 0.15);
          color: #4caf7d;
          border: 1px solid rgba(76,175,125,0.3);
        }
        .clearance-tag-status {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 2px;
          font-weight: 700;
        }
        .clearance-tag-status.green {
          background: rgba(76, 175, 125, 0.12);
          color: #4caf7d;
          border: 1px solid rgba(76,175,125,0.2);
        }
        .lead-intent-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 20px;
          font-style: italic;
        }
        .lead-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 16px;
        }
        .lead-date {
          font-size: 11px;
          color: var(--text-muted, #777);
        }
        .btn-group {
          display: flex;
          gap: 12px;
        }
        .approve-lead-btn {
          background: var(--accent);
          border: 1px solid var(--accent);
          color: #0e0e0e;
          font-size: 11px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .approve-lead-btn:hover {
          background: #e5c388;
        }
        .reject-lead-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary);
          font-size: 11px;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .reject-lead-btn:hover {
          border-color: #ff6b6b;
          color: #ff6b6b;
        }

        /* Stats & Ratings */
        .stats-dashboard {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .metric-overview-banner {
          background: linear-gradient(135deg, rgba(200, 169, 110, 0.08) 0%, rgba(14, 14, 14, 0.6) 100%);
          border: 1px solid var(--accent-border, rgba(200,169,110,0.25));
          border-radius: 6px;
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .main-score-block {
          display: flex;
          flex-direction: column;
        }
        .score-lbl {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--accent);
          margin-bottom: 6px;
        }
        .score-val-wrap {
          display: flex;
          align-items: baseline;
        }
        .score-value {
          font-family: var(--font-mono);
          font-size: 56px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
        }
        .score-max {
          font-family: var(--font-mono);
          font-size: 20px;
          color: var(--text-muted);
          margin-left: 2px;
        }
        .score-explanation {
          flex: 1;
          min-width: 250px;
        }
        .score-explanation p {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0;
        }

        .rating-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .breakdown-card {
          background: #111;
          border: 1px solid var(--border-solid, rgba(255,255,255,0.08));
          border-radius: 6px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .breakdown-header h4 {
          font-size: 14px;
          color: #fff;
        }
        .breakdown-pct {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 700;
          color: var(--accent);
        }
        .rating-bar-outer {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }
        .rating-bar-inner {
          height: 100%;
          background: var(--accent);
        }
        .breakdown-desc {
          font-size: 12px;
          line-height: 1.5;
          color: var(--text-secondary);
        }
        .big-stat-number {
          font-family: var(--font-mono);
          font-size: 40px;
          font-weight: 700;
          color: #fff;
        }

        /* Identity Edit Form */
        .profile-edit-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #111;
          border: 1px solid var(--border-solid, rgba(255,255,255,0.08));
          border-radius: 6px;
          padding: 36px;
        }
        .form-row-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          background: #090909;
          border: 1px solid var(--border-solid, rgba(255,255,255,0.08));
          color: #fff;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 13px;
          font-family: inherit;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
        }
        .profile-submit-btn {
          background: var(--accent);
          border: 1px solid var(--accent);
          color: #0e0e0e;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 14px 28px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 12px;
          align-self: flex-start;
        }
        .profile-submit-btn:hover {
          background: #e5c388;
        }

        /* QR Pass and Verifiable ID */
        .id-card-frame {
          width: 380px;
          height: 520px;
          background: #090909;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }
        .id-card-glow-layer {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 10%, rgba(200, 169, 110, 0.1) 0%, transparent 60%);
          z-index: 1;
        }
        .id-card-content {
          position: relative;
          z-index: 2;
          padding: 32px;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }
        .id-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed rgba(255,255,255,0.1);
          padding-bottom: 16px;
        }
        .id-branding {
          font-family: Georgia, serif;
          font-size: 20px;
          letter-spacing: 1px;
        }
        .id-brand-scout { color: #fff; }
        .id-brand-it { color: var(--accent); }
        .id-ver-status {
          font-family: var(--font-mono);
          font-size: 8px;
          color: #4caf7d;
          background: rgba(76, 175, 125, 0.12);
          border: 1px solid rgba(76,175,125,0.25);
          padding: 2px 6px;
          border-radius: 2px;
          letter-spacing: 0.08em;
        }

        .id-card-body {
          display: flex;
          gap: 20px;
          align-items: center;
          margin: 24px 0;
        }
        .id-avatar-slot {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.15);
          flex-shrink: 0;
        }
        .id-meta-slot {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .id-name {
          font-family: var(--font-display);
          font-size: 18px;
          color: #fff;
        }
        .id-role-desc {
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .id-params-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .id-param {
          font-size: 11px;
          display: flex;
          gap: 6px;
        }
        .id-lbl {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-muted);
          width: 70px;
        }

        .id-card-footer {
          display: flex;
          gap: 16px;
          align-items: center;
          border-top: 1px dashed rgba(255,255,255,0.1);
          padding-top: 20px;
        }
        .id-qr-placeholder {
          flex-shrink: 0;
        }
        .qr-grid {
          display: grid;
          grid-template-columns: repeat(5, 8px);
          grid-template-rows: repeat(5, 8px);
          gap: 2px;
        }
        .qr-cell {
          width: 8px;
          height: 8px;
          background: transparent;
        }
        .qr-cell.filled {
          background: var(--accent);
        }
        .id-card-compliance {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .id-card-compliance span {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
        }

        .download-id-btn {
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 14px 28px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .download-id-btn:hover {
          background: var(--accent);
          color: #0e0e0e;
        }

        /* --- ADD ASSET MODAL STYLING --- */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content-box {
          background: #111;
          border: 1px solid var(--border-solid, rgba(255,255,255,0.08));
          border-radius: 8px;
          padding: 40px;
          width: 500px;
          max-width: 90vw;
          position: relative;
          animation: panelFadeIn 0.3s ease-out forwards;
        }
        .modal-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 16px;
          cursor: pointer;
        }
        .modal-content-box h3 {
          font-family: var(--font-display);
          font-size: 22px;
          margin-bottom: 24px;
          color: #fff;
        }
        .modal-submit-btn {
          background: var(--accent);
          border: 1px solid var(--accent);
          color: #0e0e0e;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 16px;
          width: 100%;
        }
        .modal-submit-btn:hover {
          background: #e5c388;
        }

        /* Utility flex alignments */
        .flex-center {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .workspace-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
        }

        @media (max-width: 768px) {
          .workspace-main {
            padding: 40px 20px;
          }
          .curations-grid {
            grid-template-columns: 1fr;
          }
          .form-row-split {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .rating-breakdown-grid {
            grid-template-columns: 1fr;
          }
          .profile-edit-form {
            padding: 24px;
          }
          .id-card-frame {
            width: 100%;
            height: auto;
            min-height: 480px;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import Header from "@/components/Header";
import { useState, useEffect } from "react";

const INITIAL_PROFILE = {
  name: "Miguel Torres, REB",
  title: "Principal Design Advisor",
  specialty: "Ultra-Luxury Residential // BGC Focus",
  bio: "With over a decade of experience in BGC and Makati central districts, Miguel specializes in modernist architectural estates, low-density penthouses, and high-value design-first spaces.",
  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
  clearance: "Tier 1 - Alpha",
  status: "Active Roster"
};

const INITIAL_LEADS = [
  {
    id: "lead-1",
    client: "Julian de Ayala",
    email: "julian@ayala-capital.ph",
    intent: "Targeting modernist penthouse in BGC Core with high private terrace buffer. Prepared for outright acquisition.",
    status: "Pending Clearance",
    date: "June 3, 2026"
  },
  {
    id: "lead-2",
    client: "Maria Clara Lopez",
    email: "m.clara@lopez-holdings.com",
    intent: "Evaluating Siargao beachfront properties for fractional STR yield. ₱80M deployment limit.",
    status: "Cleared",
    date: "May 30, 2026"
  }
];

const INITIAL_CURATIONS = [
  {
    id: "cur-1",
    title: "Aurelia Residences Penthouse",
    category: "Residential",
    location: "BGC Core",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80"
  },
  {
    id: "cur-2",
    title: "The Estate Makati",
    category: "Residential",
    location: "Makati Central",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80"
  }
];

export default function BrokerWorkspace() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [curations, setCurations] = useState(INITIAL_CURATIONS);
  
  // Form editing state
  const [formData, setFormData] = useState(INITIAL_PROFILE);
  const [notification, setNotification] = useState("");
  const [activeTab, setActiveTab] = useState("curator"); // 'curator', 'leads', 'assets', 'id'

  // Modal / Add asset form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ title: "", category: "Residential", location: "", image: "" });

  // Sync edits
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfile(formData);
    showSuccessNotification("Profile Briefing Synced Successfully.");
  };

  const showSuccessNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  // Leads actions
  const grantClearance = (id) => {
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status: "Cleared" } : lead));
    showSuccessNotification("Communication Clearance Granted.");
  };

  const rejectLead = (id) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
    showSuccessNotification("Connection Request Archived.");
  };

  // Curations actions
  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!newAsset.title || !newAsset.location) return;

    const fallbackImg = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80";
    const finalAsset = {
      id: `cur-${Date.now()}`,
      title: newAsset.title,
      category: newAsset.category,
      location: newAsset.location,
      image: newAsset.image.trim() || fallbackImg
    };

    setCurations(prev => [...prev, finalAsset]);
    setNewAsset({ title: "", category: "Residential", location: "", image: "" });
    setShowAddModal(false);
    showSuccessNotification("New Spatial Asset Curated.");
  };

  const removeAsset = (id) => {
    setCurations(prev => prev.filter(cur => cur.id !== id));
    showSuccessNotification("Asset Removed From Roster.");
  };

  return (
    <div className="page-wrapper">
      <Header />
      
      <main className="workspace-main">
        {/* Success toast notification */}
        <div className={`notification-toast ${notification ? "show" : ""}`}>
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <span className="toast-text">{notification}</span>
          </div>
        </div>

        {/* Profile Card Header */}
        <section className="profile-hero-section">
          <div className="broker-header-block">
            <div 
              className="broker-avatar-wrap" 
              style={{ backgroundImage: `url(${profile.image})` }}
            ></div>
            <div className="broker-details">
              <span className="clearance-badge">{profile.clearance} &middot; {profile.status}</span>
              <h2>{profile.name}</h2>
              <p className="broker-title-sub">{profile.title}</p>
              <p className="broker-specialty-sub">{profile.specialty}</p>
            </div>
            
            {/* Quick Metrics */}
            <div className="workspace-metrics">
              <div className="metric-box">
                <span className="metric-num">{leads.filter(l => l.status === "Pending Clearance").length}</span>
                <span className="metric-label">Pending Leads</span>
              </div>
              <div className="metric-box">
                <span className="metric-num">{curations.length}</span>
                <span className="metric-label">Curations</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === "curator" ? "active" : ""}`}
            onClick={() => setActiveTab("curator")}
          >
            Profile Curator
          </button>
          <button 
            className={`tab-btn ${activeTab === "leads" ? "active" : ""}`}
            onClick={() => setActiveTab("leads")}
          >
            Inbound Comm Links ({leads.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "assets" ? "active" : ""}`}
            onClick={() => setActiveTab("assets")}
          >
            Curated Spaces ({curations.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "id" ? "active" : ""}`}
            onClick={() => setActiveTab("id")}
          >
            Digital ID Card
          </button>
        </nav>

        {/* Dynamic Panels */}
        <section className="workspace-content-panels">
          
          {/* PANEL 1: PROFILE CURATOR FORM */}
          {activeTab === "curator" && (
            <div className="panel-card fade-in">
              <div className="panel-header">
                <h3>Asset Advisor Profile Briefing</h3>
                <p>Modify credentials, bio, and operational specialization parameters for the public catalog.</p>
              </div>
              <form className="curator-form" onSubmit={handleProfileSubmit}>
                <div className="form-row-split">
                  <div className="form-group">
                    <label>Broker Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Advisor Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-split">
                  <div className="form-group">
                    <label>Regional Specialty</label>
                    <input 
                      type="text" 
                      value={formData.specialty}
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Avatar Photo URL</label>
                    <input 
                      type="text" 
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-split">
                  <div className="form-group">
                    <label>Clearance Level</label>
                    <select 
                      value={formData.clearance}
                      onChange={(e) => setFormData({...formData, clearance: e.target.value})}
                    >
                      <option>Tier 1 - Alpha</option>
                      <option>Tier 2 - Omega</option>
                      <option>Tier 3 - Beta</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Roster Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option>Active Roster</option>
                      <option>Standby</option>
                      <option>On Leave</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Operational Profile Biography</label>
                  <textarea 
                    rows="4" 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-form-btn">
                  Update Profile Briefing
                </button>
              </form>
            </div>
          )}

          {/* PANEL 2: LEADS LIST */}
          {activeTab === "leads" && (
            <div className="panel-card fade-in">
              <div className="panel-header">
                <h3>Inbound Leads Portal</h3>
                <p>Verify buyer credentials and state acquisition intents. Grant comm links to unlock dialogue.</p>
              </div>

              <div className="leads-list">
                {leads.map(lead => (
                  <div key={lead.id} className="lead-card-item">
                    <div className="lead-header">
                      <div className="lead-meta">
                        <span className="lead-client-name">{lead.client}</span>
                        <span className="lead-date">{lead.date}</span>
                      </div>
                      <span className={`status-pill ${lead.status === "Cleared" ? "cleared" : "pending"}`}>
                        {lead.status}
                      </span>
                    </div>
                    
                    <p className="lead-intent">"{lead.intent}"</p>
                    
                    <div className="lead-footer">
                      <span className="lead-email">Comm Link: <strong>{lead.email}</strong></span>
                      {lead.status !== "Cleared" && (
                        <div className="lead-actions">
                          <button onClick={() => rejectLead(lead.id)} className="lead-btn-reject">Archive Request</button>
                          <button onClick={() => grantClearance(lead.id)} className="lead-btn-approve">Grant Comm Clearance</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {leads.length === 0 && (
                  <div className="empty-panel-msg">
                    No active communications requested in directory.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 3: CURATIONS BOARD */}
          {activeTab === "assets" && (
            <div className="panel-card fade-in">
              <div className="panel-header-split">
                <div>
                  <h3>Curated Properties</h3>
                  <p>Add, edit, or archive visual property matrices directly linked to your advisor profile.</p>
                </div>
                <button className="add-asset-trigger-btn" onClick={() => setShowAddModal(true)}>
                  + Curate New Asset
                </button>
              </div>

              <div className="curations-grid">
                {curations.map(cur => (
                  <div key={cur.id} className="cur-asset-card">
                    <div 
                      className="cur-asset-img" 
                      style={{ backgroundImage: `url(${cur.image})` }}
                    ></div>
                    <div className="cur-asset-body">
                      <span className="cur-asset-cat">{cur.category} &middot; {cur.location}</span>
                      <h4>{cur.title}</h4>
                      <button onClick={() => removeAsset(cur.id)} className="archive-asset-btn">
                        ✕ Remove Asset
                      </button>
                    </div>
                  </div>
                ))}
                {curations.length === 0 && (
                  <div className="empty-panel-msg" style={{ gridColumn: '1 / -1' }}>
                    Zero assets curated. Use the button above to link properties.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 4: DIGITAL ID CARD */}
          {activeTab === "id" && (
            <div className="panel-card fade-in">
              <div className="panel-header">
                <h3>Digital ID Card</h3>
                <p>Your verifiable advisor credential. Download or share to establish trust with clients.</p>
              </div>

              <div className="id-card-wrapper">
                <div className="id-card" id="broker-id-card">
                  <div className="id-card-header">
                    <span className="id-card-platform">ScoutIt</span>
                    <span className="id-card-type">VERIFIED ADVISOR</span>
                  </div>
                  <div className="id-card-avatar" style={{ backgroundImage: `url(${profile.image})` }}></div>
                  <div className="id-card-name">{profile.name}</div>
                  <div className="id-card-title">{profile.title}</div>
                  <div className="id-card-specialty">{profile.specialty}</div>

                  <div className="id-card-divider"></div>

                  <div className="id-card-fields">
                    <div className="id-card-field">
                      <span className="id-field-label">PRC License</span>
                      <span className="id-field-value">REB License No. 0019284</span>
                    </div>
                    <div className="id-card-field">
                      <span className="id-field-label">DHSUD Registration</span>
                      <span className="id-field-value">Registered Broker</span>
                    </div>
                    <div className="id-card-field">
                      <span className="id-field-label">LERIS Status</span>
                      <span className="id-field-value" style={{ color: "#4caf7d" }}>Active &amp; Compliant</span>
                    </div>
                    <div className="id-card-field">
                      <span className="id-field-label">Clearance</span>
                      <span className="id-field-value">{profile.clearance}</span>
                    </div>
                    <div className="id-card-field">
                      <span className="id-field-label">Status</span>
                      <span className="id-field-value" style={{ color: "#4caf7d" }}>{profile.status}</span>
                    </div>
                  </div>

                  <div className="id-card-divider"></div>

                  <div className="id-card-footer">
                    <div className="id-qr-placeholder">
                      <div className="qr-grid">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className={`qr-cell ${Math.random() > 0.5 ? "filled" : ""}`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="id-card-compliance">
                      <span>RA 9646 Compliant</span>
                      <span>ScoutIt Space Intelligence</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>scout-it.vercel.app</span>
                    </div>
                  </div>
                </div>

                <button
                  className="download-id-btn"
                  onClick={() => {
                    const card = document.getElementById("broker-id-card");
                    if (card) {
                      const printWindow = window.open("", "_blank");
                      printWindow.document.write(`<html><head><title>ScoutIt Digital ID</title><style>body{margin:0;background:#0e0e0e;display:flex;align-items:center;justify-content:center;min-height:100vh;}${card.style.cssText}</style></head><body>${card.outerHTML}</body></html>`);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                >
                  Download / Print ID Card
                </button>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>✕</button>
            <h3>Curate New Space Asset</h3>
            <p>Establish architectural data slot parameters to display this property on public lists.</p>
            
            <form onSubmit={handleAddAsset} className="curator-form" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Property Showcase Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Aurelia Residences Penthouse"
                  value={newAsset.title}
                  onChange={(e) => setNewAsset({...newAsset, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-row-split">
                <div className="form-group">
                  <label>Showcase Sector</label>
                  <select 
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({...newAsset, category: e.target.value})}
                  >
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>STR</option>
                    <option>Hospitality</option>
                    <option>Restaurants</option>
                    <option>Venues/Events</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Showcase Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BGC Core"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({...newAsset, location: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Showcase Image URL (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Insert unsplash URL or leave blank for template"
                  value={newAsset.image}
                  onChange={(e) => setNewAsset({...newAsset, image: e.target.value})}
                />
              </div>

              <button type="submit" className="submit-form-btn">
                Add Showcase Matrix
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .page-wrapper {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .workspace-main {
          padding: 60px 45px;
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
        }

        /* Hero */
        .profile-hero-section {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 40px;
          margin-bottom: 40px;
        }

        .broker-header-block {
          display: flex;
          align-items: center;
          gap: 32px;
          position: relative;
        }

        .broker-avatar-wrap {
          width: 110px;
          height: 110px;
          border-radius: 4px;
          background-size: cover;
          background-position: center;
          border: 1px solid var(--border-solid);
          filter: grayscale(100%) contrast(1.1);
          transition: filter var(--transition-fast);
        }

        .broker-avatar-wrap:hover {
          filter: grayscale(0%) contrast(1.1);
        }

        .broker-details {
          flex: 1;
        }

        .clearance-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          display: block;
          margin-bottom: 6px;
        }

        .broker-details h2 {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 500;
          color: #fff;
          margin: 0 0 6px 0;
        }

        .broker-title-sub {
          font-size: 13px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 4px 0;
        }

        .broker-specialty-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
        }

        .workspace-metrics {
          display: flex;
          gap: 24px;
        }

        .metric-box {
          background: #0a0a0a;
          border: 1px solid var(--border-solid);
          padding: 16px 20px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 108px;
        }

        .metric-num {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--accent);
          font-weight: bold;
          line-height: 1.1;
        }

        .metric-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-top: 6px;
        }

        /* Navigation */
        .tab-navigation {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--border-solid);
          padding-bottom: 16px;
        }

        .tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 550;
          padding: 10px 20px;
          cursor: pointer;
          border-radius: 4px;
          transition: all var(--transition-fast);
        }

        .tab-btn:hover {
          color: var(--accent);
          background: rgba(255,255,255,0.02);
        }

        .tab-btn.active {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(200,169,110,0.08);
        }

        /* Panel Card */
        .panel-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 40px;
        }

        .panel-header {
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 16px;
        }

        .panel-header h3 {
          font-family: var(--font-display);
          font-size: 22px;
          color: #fff;
          margin: 0 0 6px 0;
        }

        .panel-header p {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .panel-header-split {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 16px;
        }

        .panel-header-split h3 {
          font-family: var(--font-display);
          font-size: 22px;
          color: #fff;
          margin: 0 0 6px 0;
        }

        .panel-header-split p {
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* Curator Form */
        .curator-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-family: var(--font-mono);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent);
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          background: rgba(0,0,0,0.3);
          border: 1px solid #333;
          border-radius: 4px;
          padding: 12px 16px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 13px;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--accent);
        }

        .submit-form-btn {
          background: var(--accent);
          color: #0e0e0e;
          border: none;
          padding: 16px 32px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          align-self: flex-start;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .submit-form-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(200,169,110,0.3);
        }

        /* Leads List */
        .leads-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .lead-card-item {
          background: #101010;
          border: 1px solid var(--border-solid);
          padding: 24px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lead-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lead-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lead-client-name {
          font-family: var(--font-display);
          font-size: 18px;
          color: #fff;
        }

        .lead-date {
          font-size: 11px;
          color: var(--text-muted);
        }

        .status-pill {
          font-family: var(--font-mono);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 2px;
          font-weight: bold;
        }

        .status-pill.pending {
          background: rgba(232, 200, 74, 0.1);
          color: var(--yellow);
          border: 1px solid rgba(232, 200, 74, 0.2);
        }

        .status-pill.cleared {
          background: rgba(76, 175, 125, 0.1);
          color: var(--green);
          border: 1px solid rgba(76, 175, 125, 0.2);
        }

        .lead-intent {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          font-style: italic;
          background: #0a0a0a;
          padding: 14px 18px;
          border-radius: 4px;
          margin: 0;
          border-left: 2px solid var(--border-solid);
        }

        .lead-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255,255,255,0.03);
          padding-top: 14px;
        }

        .lead-email {
          font-size: 12px;
          color: var(--text-muted);
        }

        .lead-email strong {
          color: var(--text-primary);
        }

        .lead-actions {
          display: flex;
          gap: 12px;
        }

        .lead-btn-reject {
          background: transparent;
          border: 1px solid #333;
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .lead-btn-reject:hover {
          background: rgba(232, 100, 74, 0.1);
          border-color: var(--red);
          color: var(--red);
        }

        .lead-btn-approve {
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .lead-btn-approve:hover {
          background: var(--accent);
          color: #0e0e0e;
        }

        /* Curations Grid */
        .curations-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .cur-asset-card {
          background: #101010;
          border: 1px solid var(--border-solid);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          height: 120px;
        }

        .cur-asset-img {
          width: 120px;
          background-size: cover;
          background-position: center;
        }

        .cur-asset-body {
          flex: 1;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .cur-asset-cat {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .cur-asset-body h4 {
          font-family: var(--font-display);
          font-size: 16px;
          color: #fff;
          margin: 0 0 12px 0;
        }

        .archive-asset-btn {
          background: transparent;
          border: none;
          color: var(--red);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          align-self: flex-start;
          padding: 0;
          font-family: var(--font-mono);
        }

        .archive-asset-btn:hover {
          text-decoration: underline;
        }

        .add-asset-trigger-btn {
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 18px;
          border-radius: 4px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .add-asset-trigger-btn:hover {
          background: var(--accent);
          color: #0e0e0e;
        }

        /* Success Toast */
        .notification-toast {
          position: fixed;
          bottom: 40px;
          right: 40px;
          z-index: 1500;
          opacity: 0;
          transform: translateY(20px);
          visibility: hidden;
          transition: all 0.35s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .notification-toast.show {
          opacity: 1;
          transform: translateY(0);
          visibility: visible;
        }

        .toast-content {
          background: #111;
          border: 1px solid var(--accent-border);
          border-radius: 4px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-lg);
        }

        .toast-icon {
          color: var(--accent);
          font-weight: bold;
          font-size: 18px;
        }

        .toast-text {
          font-size: 13px;
          letter-spacing: 0.02em;
          color: #fff;
          font-family: var(--font-body);
        }

        .empty-panel-msg {
          text-align: center;
          padding: 60px 0;
          color: var(--text-muted);
          font-size: 13px;
          font-style: italic;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: #121212;
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          width: 100%;
          max-width: 550px;
          padding: 40px;
          position: relative;
          box-shadow: var(--shadow-lg);
        }

        .close-modal-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 18px;
          cursor: pointer;
        }

        .close-modal-btn:hover {
          color: #fff;
        }

        .modal-content h3 {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin: 0 0 6px 0;
        }

        .modal-content p {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Digital ID Card */
        .id-card-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .id-card {
          width: 340px;
          background: #0a0a0a;
          border: 1px solid var(--accent-border);
          border-radius: 4px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .id-card-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .id-card-platform {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--accent);
          font-weight: bold;
          letter-spacing: 0.05em;
        }

        .id-card-type {
          font-family: var(--font-mono);
          font-size: 8px;
          color: #4caf7d;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border: 1px solid #4caf7d;
          padding: 3px 7px;
          border-radius: 2px;
        }

        .id-card-avatar {
          width: 80px;
          height: 80px;
          border-radius: 2px;
          background-size: cover;
          background-position: center;
          border: 1px solid var(--border-solid);
          filter: grayscale(100%) contrast(1.1);
        }

        .id-card-name {
          font-family: var(--font-display);
          font-size: 20px;
          color: #fff;
          text-align: center;
        }

        .id-card-title {
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .id-card-specialty {
          font-size: 11px;
          color: var(--accent);
          text-align: center;
          font-family: var(--font-mono);
        }

        .id-card-divider {
          width: 100%;
          height: 1px;
          background: var(--border-solid);
          margin: 4px 0;
        }

        .id-card-fields {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .id-card-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .id-field-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .id-field-value {
          font-size: 11px;
          color: var(--text-primary);
          text-align: right;
        }

        .id-card-footer {
          width: 100%;
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .id-qr-placeholder {
          flex-shrink: 0;
        }

        .qr-grid {
          display: grid;
          grid-template-columns: repeat(5, 10px);
          grid-template-rows: repeat(5, 10px);
          gap: 2px;
        }

        .qr-cell {
          width: 10px;
          height: 10px;
          background: transparent;
        }

        .qr-cell.filled {
          background: var(--accent);
        }

        .id-card-compliance {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .id-card-compliance span {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-secondary);
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
          transition: all var(--transition-fast);
        }

        .download-id-btn:hover {
          background: var(--accent);
          color: #0e0e0e;
        }

        /* Fade Animation */
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @media (max-width: 768px) {
          .form-row-split, .curations-grid {
            grid-template-columns: 1fr;
          }
          .broker-header-block {
            flex-direction: column;
            text-align: center;
          }
          .workspace-metrics {
            width: 100%;
            justify-content: center;
          }
          .workspace-main {
            padding: 40px 20px;
          }
          .panel-card {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import styles from "./BrokerMode.module.css";

// Mocks for Phase 4
const PIPELINE_DATA = {
  pending: [
    { id: 'p1', type: 'House', title: 'Modern Villa 4BR', loc: 'Dasmariñas Village, Makati', owner: 'R. Zobel', time: '14h ago' }
  ],
  accepted: [
    { id: 'p2', type: 'Commercial', title: 'Retail Space', loc: 'BGC High Street', owner: 'M. Clara', time: '2d ago' },
    { id: 'p3', type: 'Condo', title: 'Penthouse Unit', loc: 'Rockwell Center', owner: 'J. Ayala', time: '5d ago' }
  ],
  declined: [
    { id: 'p4', type: 'Lot', title: 'Vacant Lot 500sqm', loc: 'Nuvali, Sta Rosa', owner: 'A. Luna', time: '1w ago' }
  ]
};

const FEED_DATA = [
  {
    id: 'f1',
    type: 'Condo',
    title: 'Studio Unit with Balcony',
    loc: 'Legazpi Village, Makati',
    hasMedia: true,
    signals: {
      ownerAge: '14 days',
      responseRate: '100%',
      completeness: '85%'
    }
  },
  {
    id: 'f2',
    type: 'House',
    title: '3BR Townhouse',
    loc: 'Kapitolyo, Pasig',
    hasMedia: false,
    signals: {
      ownerAge: '2 days',
      responseRate: 'N/A',
      completeness: '55%'
    }
  }
];

export default function BrokerMode() {
  const [connects, setConnects] = useState(5);
  const [pipeline, setPipeline] = useState(PIPELINE_DATA);
  const [feed, setFeed] = useState(FEED_DATA);

  // Sync connects from local storage if available
  useEffect(() => {
    const userStr = localStorage.getItem("scoutit_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.connects_balance !== undefined) {
        setConnects(user.connects_balance);
      }
    }
  }, []);

  const handlePitch = (item) => {
    if (connects < 1) return alert("Not enough connects!");
    
    // Deduct connect
    const newBalance = connects - 1;
    setConnects(newBalance);
    
    // Update local storage
    const userStr = localStorage.getItem("scoutit_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.connects_balance = newBalance;
      localStorage.setItem("scoutit_user", JSON.stringify(user));
    }

    // Move from feed to pending pipeline
    setFeed(feed.filter(f => f.id !== item.id));
    setPipeline({
      ...pipeline,
      pending: [
        { 
          id: item.id, 
          type: item.type, 
          title: item.title, 
          loc: item.loc, 
          owner: 'Hidden', 
          time: 'Just now' 
        },
        ...pipeline.pending
      ]
    });
  };

  const PipelineCard = ({ item }) => (
    <div className={styles.pipelineCard}>
      <div className={styles.cardType}>{item.type}</div>
      <div className={styles.cardTitle}>{item.title}</div>
      <div className={styles.cardLoc}>{item.loc}</div>
      <div className={styles.cardMeta}>
        <div className={styles.ownerTag}>
          <div className={styles.ownerAvatar}>{item.owner.charAt(0)}</div>
          <span>{item.owner}</span>
        </div>
        <span style={{color: 'var(--text-muted)'}}>{item.time}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.dashboardContainer}>
      
      {/* 1. ACTION BAR */}
      <div className={styles.actionBar}>
        <div className={styles.actionLeft}>
          <h3>Broker Workspace</h3>
          <p>Speed is everything. Pitch high-completeness listings first.</p>
        </div>
        <div className={styles.connectsWallet}>
          <div className={styles.balance}>
            <span>◈</span> {connects}
          </div>
          <button className={styles.buttonPrimary}>Buy Connects</button>
        </div>
      </div>

      {/* 2. PIPELINE BOARD */}
      <div>
        <div className={styles.sectionHeader}>
          <span>Pipeline</span>
          <span style={{color: 'var(--text-secondary)'}}>Swipe →</span>
        </div>
        
        <div className={styles.boardContainer}>
          {/* Pending Col */}
          <div className={styles.column}>
            <div className={styles.colHeader}>
              <span>Pending Pitch</span>
              <span className={styles.colCount}>{pipeline.pending.length}</span>
            </div>
            {pipeline.pending.map(item => <PipelineCard key={item.id} item={item} />)}
          </div>

          {/* Accepted Col */}
          <div className={styles.column} style={{borderColor: 'var(--accent-border)'}}>
            <div className={styles.colHeader}>
              <span style={{color: 'var(--accent)'}}>Accepted (Active Lead)</span>
              <span className={styles.colCount}>{pipeline.accepted.length}</span>
            </div>
            {pipeline.accepted.map(item => <PipelineCard key={item.id} item={item} />)}
          </div>

          {/* Declined Col */}
          <div className={styles.column} style={{opacity: 0.7}}>
            <div className={styles.colHeader}>
              <span>Declined / Passed</span>
              <span className={styles.colCount}>{pipeline.declined.length}</span>
            </div>
            {pipeline.declined.map(item => <PipelineCard key={item.id} item={item} />)}
          </div>
        </div>
      </div>

      {/* 3. NEW LISTINGS FEED */}
      <div>
        <div className={styles.sectionHeader} style={{marginTop: '16px'}}>
          <span>Market Intel & New Listings</span>
        </div>
        
        <div className={styles.feedList}>
          {feed.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
              You pitched all available properties.
            </div>
          ) : (
            feed.map(item => (
              <div key={item.id} className={styles.feedItem}>
                <div className={styles.feedMedia}>
                  {item.hasMedia ? "📸" : "No Media"}
                </div>
                
                <div className={styles.feedContent}>
                  <div className={styles.cardType}>{item.type}</div>
                  <div className={styles.feedTitle}>{item.title}</div>
                  <div className={styles.feedLoc}>{item.loc}</div>
                  
                  {/* Decision Signals */}
                  <div className={styles.signals}>
                    <div className={styles.signal}>
                      <span className={styles.sigVal}>{item.signals.completeness}</span>
                      <span className={styles.sigLabel}>Completeness</span>
                    </div>
                    <div className={styles.signal}>
                      <span className={styles.sigVal} style={{color: item.signals.responseRate === '100%' ? 'var(--green, #4ade80)' : 'var(--text-primary)'}}>
                        {item.signals.responseRate}
                      </span>
                      <span className={styles.sigLabel}>Response Rate</span>
                    </div>
                    <div className={styles.signal}>
                      <span className={styles.sigVal} style={{color: 'var(--text-primary)'}}>{item.signals.ownerAge}</span>
                      <span className={styles.sigLabel}>Owner Age</span>
                    </div>
                  </div>
                </div>

                <div className={styles.feedAction}>
                  <button 
                    className={styles.btnPitch} 
                    onClick={() => handlePitch(item)}
                    disabled={connects < 1}
                    style={{opacity: connects < 1 ? 0.5 : 1, cursor: connects < 1 ? 'not-allowed' : 'pointer'}}
                  >
                    Pitch Lead
                  </button>
                  <span className={styles.cost}>Costs 1 Connect ◈</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

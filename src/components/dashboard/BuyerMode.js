"use client";

import { useState } from "react";
import styles from "./BuyerMode.module.css";

const SAVED_LISTINGS = [
  { id: 's1', type: 'House', title: 'Ayala Alabang Core', loc: 'Muntinlupa City', img: '🏠' },
  { id: 's2', type: 'Condo', title: 'The Proscenium', loc: 'Rockwell Center', img: '🏢' },
  { id: 's3', type: 'Lot', title: 'Elaro Corner Lot', loc: 'Nuvali, Laguna', img: '🌳' },
];

const NEW_LISTINGS = [
  { id: 'n1', type: 'Commercial', title: 'Retail Space CBD', loc: 'Makati Ave', img: '🏬' },
  { id: 'n2', type: 'House', title: 'Modern Zen 3BR', loc: 'Valle Verde, Pasig', img: '🏠' },
];

export default function BuyerMode() {
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const ListingCard = ({ item }) => (
    <div className={styles.railCard}>
      <div className={styles.cardImg}>{item.img}</div>
      <div className={styles.cardContent}>
        <div className={styles.cardType}>{item.type}</div>
        <div className={styles.cardTitle}>{item.title}</div>
        <div className={styles.cardLoc}>{item.loc}</div>
      </div>
    </div>
  );

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Search Header */}
      <div className={styles.searchHeader}>
        <div className={styles.searchBar}>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search locations, asset types, or intel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className={styles.searchBtn}>Search</button>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.mapToggle}>
            <span>List</span>
            <label className={styles.switch}>
              <input type="checkbox" checked={showMap} onChange={(e) => setShowMap(e.target.checked)} />
              <span className={styles.slider}></span>
            </label>
            <span>Map</span>
          </div>
          
          <div style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)'}}>
            Filters +
          </div>
        </div>
      </div>

      {showMap ? (
        <div className={styles.mapPlaceholder}>
          <span style={{fontSize: 48}}>🗺️</span>
          <p>Mapbox integration goes here</p>
          <span style={{fontSize: 12, fontFamily: 'var(--font-mono)'}}>Showing 42 listings in view</span>
        </div>
      ) : (
        <>
          {/* Saved Listings Rail */}
          <div>
            <h2 className={styles.sectionTitle}>Saved Listings</h2>
            <div className={styles.rail}>
              {SAVED_LISTINGS.map(item => <ListingCard key={item.id} item={item} />)}
            </div>
          </div>

          {/* New in Area + Intel Feed */}
          <div>
            <h2 className={styles.sectionTitle}>New & Intel</h2>
            <div className={styles.feedGrid}>
              
              <div className={styles.intelCard}>
                <span className={styles.intelBadge}>Market Intel</span>
                <div>
                  <h3 className={styles.intelTitle}>Makati CBD Yields Drop</h3>
                  <p className={styles.intelDesc}>Recent transactions show a 1.2% decrease in gross rental yields for premium studios in Legazpi Village over the last 30 days.</p>
                </div>
                <a href="#" className={styles.intelAction}>Read Full Brief →</a>
              </div>

              {NEW_LISTINGS.map(item => <ListingCard key={item.id} item={item} />)}
              
              <div className={styles.intelCard}>
                <span className={styles.intelBadge}>Area Guide</span>
                <div>
                  <h3 className={styles.intelTitle}>Nuvali Expansion</h3>
                  <p className={styles.intelDesc}>A deep dive into the upcoming commercial blocks and how they affect residential pricing in Elaro and Venare.</p>
                </div>
                <a href="#" className={styles.intelAction}>Explore Area →</a>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}

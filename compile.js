const fs = require('fs');

let jsx = fs.readFileSync('C:/Users/jerze/.gemini/antigravity/scratch/scoutit/src/app/property/[slug]/raw-jsx.txt', 'utf8');

// 1. Strip class="active" from photo-slide and make it dynamic
jsx = jsx.replace(
  /<div className="photo-slide (natural|enhanced)[^"]*" data-index="(\d)"><\/div>/g, 
  '<div className={`photo-slide ${photoMode} ${currentImageIndex === $2 ? "active" : ""}`}></div>'
);

// 2. Wire photo toggle buttons
jsx = jsx.replace(
  /<button className="toggle-btn[^"]*" data-mode="natural">Natural<\/button>/,
  '<button className={`toggle-btn ${photoMode === "natural" ? "active" : "off"}`} onClick={() => setPhotoMode("natural")}>Natural</button>'
);
jsx = jsx.replace(
  /<button className="toggle-btn[^"]*" data-mode="enhanced">Enhanced<\/button>/,
  '<button className={`toggle-btn ${photoMode === "enhanced" ? "active" : "off"}`} onClick={() => setPhotoMode("enhanced")}>Enhanced</button>'
);

// 3. Wire navigation tabs
jsx = jsx.replace(
  /<div className="nav-chapter[^"]*" data-chapter="([a-z]+)">/g,
  (match, p1) => {
    let baseClass = match.includes('nav-chapter--cta') ? 'nav-chapter nav-chapter--cta' : 'nav-chapter';
    return `<div className={\`${baseClass} \${activeTab === "${p1}" ? "active" : ""}\`} onClick={() => setActiveTab("${p1}")}>`;
  }
);

// 4. Wire chapter panels
jsx = jsx.replace(
  /<div className="chapter-panel[^"]*" id="panel-([a-z]+)">/g,
  '<div className={`chapter-panel ${activeTab === "$1" ? "active" : ""}`} id="panel-$1">'
);

// 5. Wire accordions
jsx = jsx.replace(
  /<div className="accordion-item[^"]*" data-acc="([a-z]+)">/g,
  '<div className={`accordion-item ${activeAccordion === "$1" ? "open" : ""}`} onClick={() => setActiveAccordion(activeAccordion === "$1" ? null : "$1")}>'
);

// 6. Map data-field elements to {property?.fieldName}
// Matches <tag ... data-field="fieldName" ...>Text</tag>
jsx = jsx.replace(/<([a-zA-Z0-9]+)([^>]*)data-field="([^"]+)"([^>]*)>([^<]*)<\/\1>/g, (match, tag, before, field, after, text) => {
  let escapedText = text.trim().replace(/'/g, "\\'");
  let defaultValue = escapedText ? ` || '${escapedText}'` : '';
  return `<${tag}${before}data-field="${field}"${after}>{property?.${field}${defaultValue}}</${tag}>`;
});

// 7. Inject specific derived fields dynamically
// E.g., <div className="pill-val" data-field="baths">2</div>
// I've already done basic data-field mapping, but need to fix things like style="width:0%" for rating bars
jsx = jsx.replace(/id="bar-comfort" style={{width: "0%"}}/g, 'id="bar-comfort" style={{width: `${(property?.comfort_level || 0) * 10}%`}}');
jsx = jsx.replace(/id="bar-light" style={{width: "0%"}}/g, 'id="bar-light" style={{width: `${(property?.natural_light || 0) * 10}%`}}');
jsx = jsx.replace(/id="bar-privacy" style={{width: "0%"}}/g, 'id="bar-privacy" style={{width: `${(property?.privacy || 0) * 10}%`}}');
jsx = jsx.replace(/id="bar-space" style={{width: "0%"}}/g, 'id="bar-space" style={{width: `${(property?.space_feel || 0) * 10}%`}}');

// Convert rating tags to dynamic classes
jsx = jsx.replace(/className="accordion-tag [^"]*"/g, 'className={`accordion-tag tag-${(property?.accordion_1_rating || "neutral").toLowerCase()}`}'); 

// 8. Map derived fields using their IDs
jsx = jsx.replace(/id="down-payment-display">[^<]*</g, 'id="down-payment-display">{formatPeso(downPayment)}<');
jsx = jsx.replace(/id="price-per-sqm-display">[^<]*</g, 'id="price-per-sqm-display">{formatPeso(ppsm)}<');
jsx = jsx.replace(/id="price-per-sqm-val">[^<]*</g, 'id="price-per-sqm-val">{formatPeso(ppsm)}<');
jsx = jsx.replace(/id="price-per-sqm-sidebar">[^<]*</g, 'id="price-per-sqm-sidebar">{formatPeso(ppsm)}<');
jsx = jsx.replace(/id="flood-risk-text">[^<]*</g, 'id="flood-risk-text">{floodRiskText}<');
jsx = jsx.replace(/id="broker-initials">[^<]*</g, 'id="broker-initials">{brokerInitials}<');

// 9. Generate the full React Component file
const componentCode = `
"use client";

import { useState, useEffect } from "react";
import "./property.css";

function formatPeso(num) {
  if (!num) return '₱';
  return '₱' + Number(num).toLocaleString();
}

function floodText(score) {
  if (score <= 3) return 'Minimal risk';
  if (score <= 5) return 'Low risk';
  if (score <= 7) return 'Moderate risk';
  if (score <= 9) return 'High risk';
  return 'Extremely dangerous';
}

function convenienceText(score) {
  if (score >= 9) return 'Everything within reach';
  if (score >= 7) return 'Very convenient';
  if (score >= 5) return 'Moderately convenient';
  if (score >= 3) return 'Limited options';
  return 'Far from essentials';
}

export default function PropertyDetailClient({ slug }) {
  const [property, setProperty] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoMode, setPhotoMode] = useState("natural");
  const [activeTab, setActiveTab] = useState("space");
  const [activeAccordion, setActiveAccordion] = useState(null);
  
  useEffect(() => {
    async function fetchProperty() {
      try {
        const res = await fetch(\`/api/property?slug=\${slug}\`);
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          setProperty(data.records[0].fields);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchProperty();
  }, [slug]);

  const priceMin = parseFloat(property?.price_min);
  const floorSqm = parseFloat(property?.floor_sqm);
  const ppsm = (!isNaN(priceMin) && !isNaN(floorSqm) && floorSqm > 0) ? Math.round(priceMin / floorSqm) : null;
  const downPayment = !isNaN(priceMin) ? Math.round(priceMin * 0.2) : null;
  const brokerInitials = property?.broker_name ? property.broker_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'AV';
  const floodRiskText = !isNaN(parseFloat(property?.flood_risk_score)) ? floodText(parseFloat(property?.flood_risk_score)) : 'Minimal risk';

  return (
    <>
      ${jsx.trim()}
    </>
  );
}
`;

fs.writeFileSync('C:/Users/jerze/.gemini/antigravity/scratch/scoutit/src/app/property/[slug]/PropertyDetailClient.js', componentCode);
console.log('Compiled PropertyDetailClient.js');

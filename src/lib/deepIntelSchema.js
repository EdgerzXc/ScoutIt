// src/lib/deepIntelSchema.js

export const DEEP_INTEL_SCHEMA = {
  commercial: {
    1: [
      { key: "DI_CAMS", label: "CAMS (CUSA)", placeholder: "e.g. ₱185 / sqm / mo" },
      { key: "DI_AC_Charges", label: "A/C Charges", placeholder: "e.g. ₱48 / sqm / mo" },
      { key: "DI_Escalation", label: "Escalation Rate", placeholder: "e.g. 5% per annum" },
      { key: "DI_Fit_Out", label: "Fit-out Allowance", placeholder: "e.g. ₱8,000 / sqm" },
      { key: "DI_Rent_Free", label: "Rent-free Period", placeholder: "e.g. Up to 2 months" },
      { key: "DI_Cap_Rate", label: "Cap Rate", placeholder: "e.g. 6.8%" },
      { key: "DI_NOI", label: "NOI", placeholder: "e.g. ₱182.4M / yr (stabilized)" }
    ],
    2: [
      { key: "DI_Towers", label: "Towers / Zones", placeholder: "e.g. Single tower, high zone" },
      { key: "DI_Parking_Ratio", label: "Parking Ratio", placeholder: "e.g. 1 : 95 sqm" },
      { key: "DI_Reserved_Park", label: "Reserved Parking", placeholder: "e.g. 1 slot / 100 sqm leased" },
      { key: "DI_Solar", label: "Solar Orientation", placeholder: "e.g. NE-SW long axis" },
      { key: "DI_Pedestrian", label: "Pedestrian Flow Metrics", placeholder: "e.g. 12,400 avg daily" }
    ],
    3: [
      { key: "DI_Ventilation", label: "Ventilation Quality", placeholder: "e.g. ASHRAE 62.1, MERV-13" },
      { key: "DI_Noise", label: "Noise Level Score", placeholder: "e.g. 8.7 / 10 (low ambient)" },
      { key: "DI_Light", label: "Natural Light Score", placeholder: "e.g. 9.1 / 10 (floor-to-ceiling)" },
      { key: "DI_Privacy", label: "Privacy Score", placeholder: "e.g. 8.4 / 10" },
      { key: "DI_Acoustic", label: "Acoustic Baseline", placeholder: "e.g. NC-35 office baseline" }
    ],
    4: [
      { key: "DI_Internet", label: "Internet Providers", placeholder: "e.g. PLDT, Globe, Converge" },
      { key: "DI_Walkability", label: "Walkability Score", placeholder: "e.g. 98/100 Walker's Paradise" },
      { key: "DI_Peak_Traffic", label: "Peak Hour Traffic Data", placeholder: "e.g. Moderate 5pm-7pm" },
      { key: "DI_Delivery", label: "Delivery Zone Coverage", placeholder: "e.g. Core Grab radius" },
      { key: "DI_Transport", label: "Transport Node Coverage", placeholder: "e.g. 5 min walk to bus" }
    ],
    5: [
      { key: "DI_Backup_Power", label: "Backup Power", placeholder: "e.g. 100% N+1 generator" },
      { key: "DI_Floor_Load", label: "Floor Loading", placeholder: "e.g. 500 kg/sqm live load" },
      { key: "DI_MEP", label: "MEP Specifications", placeholder: "e.g. 2 x 2,500 kVA transformers" },
      { key: "DI_Elec_Load", label: "Electrical Load Capacity", placeholder: "e.g. 120 VA / sqm" },
      { key: "DI_Structural", label: "Structural Calculations", placeholder: "e.g. PT 0.4g seismic" }
    ],
    6: [
      { key: "DI_Available", label: "Available Units", placeholder: "e.g. Floors 14, 18 & 22" },
      { key: "DI_Density", label: "Office Density Data", placeholder: "e.g. Grade-A vacancy 8.2%" },
      { key: "DI_Pipeline", label: "Development Pipeline", placeholder: "e.g. 2 towers in 2027" },
      { key: "DI_Hist_Tx", label: "Historical Transaction Records", placeholder: "e.g. Developer-held, no resale" },
      { key: "DI_Ownership", label: "Provenance & Ownership Lineage", placeholder: "e.g. Single-owner SPV" },
      { key: "DI_Blueprint", label: "Original Permit & Blueprint Archive", placeholder: "e.g. On file, released to tenants" }
    ]
  },
  residential: {
    1: [
      { key: "DI_HOA_Reserve", label: "HOA Reserve Health", placeholder: "e.g. ₱12M surplus (2025)" },
      { key: "DI_Assoc_Dues_Hist", label: "Assoc Dues History", placeholder: "e.g. 3% avg annual increase" },
      { key: "DI_Property_Tax", label: "Annual Property Tax", placeholder: "e.g. ₱45,000 / yr" },
      { key: "DI_Insurance", label: "Insurance Coverage", placeholder: "e.g. Comprehensive Fire/Earthquake" },
      { key: "DI_Cap_Ex", label: "Upcoming CapEx", placeholder: "e.g. Elevator modernization 2026" }
    ],
    2: [
      { key: "DI_Solar", label: "Solar Orientation", placeholder: "e.g. Morning sun, shaded PM" },
      { key: "DI_View_Protect", label: "View Protection", placeholder: "e.g. Guaranteed no build zone" },
      { key: "DI_Zoning", label: "Zoning Classification", placeholder: "e.g. R-3 High Density" },
      { key: "DI_Elevation", label: "Flood/Elevation Risk", placeholder: "e.g. 15m above sea level" },
      { key: "DI_Pedestrian", label: "Pedestrian Flow Metrics", placeholder: "e.g. High weekend traffic" }
    ],
    3: [
      { key: "DI_Privacy", label: "Visual Privacy Rating", placeholder: "e.g. 9.2/10 (Blocked sightlines)" },
      { key: "DI_Noise", label: "Noise Decibel Readings", placeholder: "e.g. 45dB average ambient" },
      { key: "DI_Light", label: "Lighting Color Temperature", placeholder: "e.g. Natural warm (3000K)" },
      { key: "DI_Demographic", label: "Demographic Shift", placeholder: "e.g. Trending towards young families" },
      { key: "DI_Peak_Crowd", label: "Peak Hour Crowd Data", placeholder: "e.g. Quiet hours strictly enforced" }
    ],
    4: [
      { key: "DI_Walkability", label: "Walkability Score", placeholder: "e.g. 95/100 Daily errands" },
      { key: "DI_Transit", label: "Transit Frequency Analysis", placeholder: "e.g. Trains every 5 mins" },
      { key: "DI_Commute", label: "Peak Hour Commute Data", placeholder: "e.g. 25 min drive to CBD" },
      { key: "DI_School", label: "School District Quality", placeholder: "e.g. Top 10% national ranking" },
      { key: "DI_Delivery", label: "Delivery Zone Coverage", placeholder: "e.g. Within all major radiuses" }
    ],
    5: [
      { key: "DI_MEP", label: "MEP Specifications", placeholder: "e.g. PEX plumbing, 200A panel" },
      { key: "DI_Structural", label: "Structural Calculations", placeholder: "e.g. RC framed, seismic rating B" },
      { key: "DI_Renovation", label: "Renovation History", placeholder: "e.g. Gut rehab in 2022" },
      { key: "DI_Internet", label: "Internet Routing", placeholder: "e.g. Cat6 wired to all rooms" },
      { key: "DI_Backup_Power", label: "Backup Power", placeholder: "e.g. 5kW solar + battery ready" }
    ],
    6: [
      { key: "DI_Pipeline", label: "Development Pipeline", placeholder: "e.g. New park planned 2027" },
      { key: "DI_Hist_Tx", label: "Historical Transaction Records", placeholder: "e.g. Last sold 2018 (₱14M)" },
      { key: "DI_Ownership", label: "Provenance & Ownership Lineage", placeholder: "e.g. 2nd owner, clean title" },
      { key: "DI_Blueprint", label: "Original Permit & Blueprint Archive", placeholder: "e.g. Complete set digitized" },
      { key: "DI_Room_Dims", label: "Precise Room Dimensions", placeholder: "e.g. Master 4x5m, Living 6x8m" },
      { key: "DI_Materials", label: "Finish & Material Schedule", placeholder: "e.g. Engineered oak, Quartz" }
    ]
  },
  str: {
    1: [
      { key: "DI_ADR", label: "ADR Projections", placeholder: "e.g. ₱4,500/night baseline" },
      { key: "DI_Occ_Rate", label: "Occupancy Rate History", placeholder: "e.g. 78% trailing 12-mo" },
      { key: "DI_HOA_STR", label: "HOA Airbnb Rules", placeholder: "e.g. Allowed, max 4 pax" },
      { key: "DI_Cleaning_Fee", label: "Cleaning Fee Average", placeholder: "e.g. ₱800 per turnover" },
      { key: "DI_Mgmt_Split", label: "Property Mgmt Split", placeholder: "e.g. 20% gross revenue" }
    ],
    2: [
      { key: "DI_Tour_Prox", label: "Tourist Hub Proximity", placeholder: "e.g. 2 blocks from beach" },
      { key: "DI_Seasonality", label: "Seasonality Metrics", placeholder: "e.g. Peak: Dec-May" },
      { key: "DI_Parking_Logistics", label: "Guest Parking Logistics", placeholder: "e.g. 1 dedicated slot" },
      { key: "DI_Solar", label: "Solar Orientation", placeholder: "e.g. Sunset views" },
      { key: "DI_Zoning", label: "Zoning Classification", placeholder: "e.g. Mixed-use commercial" }
    ],
    3: [
      { key: "DI_Turnover", label: "Cleaning Turnover Time", placeholder: "e.g. 45 mins avg" },
      { key: "DI_Noise", label: "Noise Decibel Readings", placeholder: "e.g. 50dB (street facing)" },
      { key: "DI_Light", label: "Lighting Color Temperature", placeholder: "e.g. Mood lighting (2700K)" },
      { key: "DI_Privacy", label: "Visual Privacy Rating", placeholder: "e.g. 8/10 (blackout blinds)" },
      { key: "DI_Guest_Demo", label: "Guest Demographic Bias", placeholder: "e.g. Couples, solo travelers" }
    ],
    4: [
      { key: "DI_Walkability", label: "Walkability Score", placeholder: "e.g. 92/100" },
      { key: "DI_Airport", label: "Airport/Transit Routing", placeholder: "e.g. 15 mins to Terminal 3" },
      { key: "DI_Delivery", label: "Delivery Zone Coverage", placeholder: "e.g. 24/7 food delivery" },
      { key: "DI_Luggage", label: "Luggage Drop Logistics", placeholder: "e.g. Concierge holding" },
      { key: "DI_Nightlife", label: "Nightlife Proximity", placeholder: "e.g. 5 min walk" }
    ],
    5: [
      { key: "DI_Keyless", label: "Keyless Entry System", placeholder: "e.g. Yale smart lock API" },
      { key: "DI_Internet", label: "WiFi Speed & Reliability", placeholder: "e.g. 500Mbps Fiber" },
      { key: "DI_Appliances", label: "Fixed Equipment Specs", placeholder: "e.g. Washer/Dryer combo" },
      { key: "DI_Materials", label: "Finish & Material Schedule", placeholder: "e.g. Heavy-duty vinyl" },
      { key: "DI_MEP", label: "MEP Specifications", placeholder: "e.g. Split-type AC" }
    ],
    6: [
      { key: "DI_Room_Dims", label: "Precise Room Dimensions", placeholder: "e.g. Studio 32sqm" },
      { key: "DI_Pipeline", label: "Competitor Pipeline", placeholder: "e.g. 50 new units next year" },
      { key: "DI_Hist_Tx", label: "Historical Transaction Records", placeholder: "e.g. Last sold 2021" },
      { key: "DI_Ownership", label: "Provenance & Ownership Lineage", placeholder: "e.g. Individual owner" },
      { key: "DI_Blueprint", label: "Original Permit & Blueprint Archive", placeholder: "e.g. Available" }
    ]
  },
  hospitality: {
    1: [
      { key: "DI_RevPAR", label: "Baseline RevPAR", placeholder: "e.g. ₱3,500/night" },
      { key: "DI_GOPPAR", label: "GOPPAR Projections", placeholder: "e.g. ₱1,200/night" },
      { key: "DI_FFE", label: "FF&E Transfer Value", placeholder: "e.g. ₱50M book value" },
      { key: "DI_Star", label: "Star Rating Equivalent", placeholder: "e.g. 4-Star Boutique" },
      { key: "DI_Franchise", label: "Franchise Viability", placeholder: "e.g. Accor/Marriott compliant" }
    ],
    2: [
      { key: "DI_Tour_Prox", label: "Tourist Hub Proximity", placeholder: "e.g. Beachfront" },
      { key: "DI_Seasonality", label: "Seasonality Metrics", placeholder: "e.g. Year-round demand" },
      { key: "DI_Coach_Park", label: "Coach/Bus Logistics", placeholder: "e.g. 2 bays available" },
      { key: "DI_Solar", label: "Solar Orientation", placeholder: "e.g. West-facing sunset" },
      { key: "DI_Zoning", label: "Zoning Classification", placeholder: "e.g. Commercial/Resort" }
    ],
    3: [
      { key: "DI_Turnover", label: "Cleaning Turnover Time", placeholder: "e.g. 30 mins per room" },
      { key: "DI_Noise", label: "Noise Decibel Readings", placeholder: "e.g. 40dB (soundproofed)" },
      { key: "DI_Light", label: "Lighting Color Temperature", placeholder: "e.g. 2700K public areas" },
      { key: "DI_Privacy", label: "Visual Privacy Rating", placeholder: "e.g. 9/10" },
      { key: "DI_Guest_Demo", label: "Guest Demographic Bias", placeholder: "e.g. Corporate / Leisure" }
    ],
    4: [
      { key: "DI_Walkability", label: "Walkability Score", placeholder: "e.g. 85/100" },
      { key: "DI_Airport", label: "Airport/Transit Routing", placeholder: "e.g. Free shuttle 15m" },
      { key: "DI_Delivery", label: "Delivery Zone Coverage", placeholder: "e.g. Full BGC coverage" },
      { key: "DI_Supply_Chain", label: "Supply Chain Logistics", placeholder: "e.g. Rear loading dock" },
      { key: "DI_MICE", label: "MICE Proximity", placeholder: "e.g. 1km to convention center" }
    ],
    5: [
      { key: "DI_PMS", label: "PMS Integration Specs", placeholder: "e.g. Oracle Opera ready" },
      { key: "DI_Backup_Power", label: "Backup Power", placeholder: "e.g. 100% N+1" },
      { key: "DI_Kitchen_Equip", label: "Commercial Kitchen Specs", placeholder: "e.g. 500 pax capacity" },
      { key: "DI_Materials", label: "Finish & Material Schedule", placeholder: "e.g. High-traffic hospitality grade" },
      { key: "DI_MEP", label: "MEP Specifications", placeholder: "e.g. Centralized chiller" }
    ],
    6: [
      { key: "DI_Room_Dims", label: "Precise Room Dimensions", placeholder: "e.g. Standard 28sqm, Suites 55sqm" },
      { key: "DI_Pipeline", label: "Competitor Pipeline", placeholder: "e.g. No new hotels in 2km radius" },
      { key: "DI_Hist_Tx", label: "Historical Transaction Records", placeholder: "e.g. Built 2015, no resale" },
      { key: "DI_Ownership", label: "Provenance & Ownership Lineage", placeholder: "e.g. Institutional owner" },
      { key: "DI_Blueprint", label: "Original Permit & Blueprint Archive", placeholder: "e.g. Full digital BIM available" }
    ]
  },
  restaurants: {
    1: [
      { key: "DI_CAMS", label: "CAMS (CUSA)", placeholder: "e.g. ₱185 / sqm / mo" },
      { key: "DI_Fit_Out", label: "Fit-out Allowance", placeholder: "e.g. ₱8,000 / sqm" },
      { key: "DI_Kitchen_Ratio", label: "Kitchen-to-Dining Ratio", placeholder: "e.g. 30:70" },
      { key: "DI_Turnover_Proj", label: "Table Turnover Projections", placeholder: "e.g. 3x per night" },
      { key: "DI_Liquor_License", label: "Liquor License Status", placeholder: "e.g. Pre-approved for zone" }
    ],
    2: [
      { key: "DI_Solar", label: "Solar Orientation", placeholder: "e.g. Shade for al fresco" },
      { key: "DI_Pedestrian", label: "Pedestrian Flow Metrics", placeholder: "e.g. 12,400 avg daily" },
      { key: "DI_Visibility", label: "Signage & Visibility", placeholder: "e.g. High street frontage" },
      { key: "DI_Zoning", label: "Zoning Classification", placeholder: "e.g. C-2 Commercial" },
      { key: "DI_Parking", label: "Valet/Parking Logistics", placeholder: "e.g. Dedicated valet drop-off" }
    ],
    3: [
      { key: "DI_Acoustic", label: "Acoustic Baseline Score", placeholder: "e.g. NC-40 (Lively)" },
      { key: "DI_Light", label: "Ambient Light Temperature", placeholder: "e.g. Dimmable 2200K" },
      { key: "DI_Vent_Cap", label: "Ventilation Capacity", placeholder: "e.g. High exhaust volume" },
      { key: "DI_Privacy", label: "Table Privacy Rating", placeholder: "e.g. 7/10 (Booths)" },
      { key: "DI_Noise", label: "Noise Level Score", placeholder: "e.g. 8.7 / 10" }
    ],
    4: [
      { key: "DI_Delivery_Rad", label: "Delivery Radius Coverage", placeholder: "e.g. Core Grab/Foodpanda" },
      { key: "DI_Foot_Traffic", label: "Foot Traffic Peak Hours", placeholder: "e.g. 11am-2pm, 6pm-9pm" },
      { key: "DI_Comp_Prox", label: "Competitor Proximity", placeholder: "e.g. 5 cafes within 100m" },
      { key: "DI_Supply_Log", label: "Supply Delivery Logistics", placeholder: "e.g. Rear service alley" },
      { key: "DI_Walkability", label: "Walkability Score", placeholder: "e.g. 98/100" }
    ],
    5: [
      { key: "DI_Grease", label: "Grease Trap Specs", placeholder: "e.g. 100 GPM centralized" },
      { key: "DI_Exhaust", label: "Extraction Ducting", placeholder: "e.g. Pre-installed to roof" },
      { key: "DI_Gas", label: "Gas Line Specs", placeholder: "e.g. LPG piped-in" },
      { key: "DI_Elec_Load", label: "Electrical Load Capacity", placeholder: "e.g. 200 VA / sqm" },
      { key: "DI_Water", label: "Water & Drainage Routing", placeholder: "e.g. Multiple floor drains" }
    ],
    6: [
      { key: "DI_Room_Dims", label: "Precise Room Dimensions", placeholder: "e.g. FOH 120sqm, BOH 50sqm" },
      { key: "DI_Pipeline", label: "Development Pipeline", placeholder: "e.g. 2 new towers adding foot traffic" },
      { key: "DI_Hist_Tx", label: "Historical Transaction Records", placeholder: "e.g. Previous tenant 5 years" },
      { key: "DI_Ownership", label: "Provenance & Ownership Lineage", placeholder: "e.g. Mall operator" },
      { key: "DI_Blueprint", label: "Original Permit & Blueprint Archive", placeholder: "e.g. As-builts available" }
    ]
  },
  venues: {
    1: [
      { key: "DI_Hire_Fee", label: "Baseline Hire Fee", placeholder: "e.g. ₱150,000 / day" },
      { key: "DI_Cap_Pax", label: "Max Standing / Seated pax", placeholder: "e.g. 1000 standing, 400 seated" },
      { key: "DI_Overtime", label: "Overtime/Egress Rates", placeholder: "e.g. ₱10,000/hr past 12am" },
      { key: "DI_Corkage", label: "Catering/Corkage Buyouts", placeholder: "e.g. ₱50k outside caterer" },
      { key: "DI_Curfew", label: "Noise Curfew Constraints", placeholder: "e.g. 2AM strict cutoff" }
    ],
    2: [
      { key: "DI_Truck", label: "Truck/Rigging Logistics", placeholder: "e.g. 40ft truck access" },
      { key: "DI_Park_Events", label: "Event Parking Logistics", placeholder: "e.g. 200 slots nearby" },
      { key: "DI_Solar", label: "Solar Orientation", placeholder: "e.g. N/A (Blackbox)" },
      { key: "DI_Zoning", label: "Zoning Classification", placeholder: "e.g. Commercial/Entertainment" },
      { key: "DI_VIP", label: "VIP Ingress Routing", placeholder: "e.g. Private basement lift" }
    ],
    3: [
      { key: "DI_Acoustic_Treat", label: "Acoustic Treatment Grade", placeholder: "e.g. Studio-grade absorption" },
      { key: "DI_Isolation", label: "Sound Isolation Rating", placeholder: "e.g. STC 55" },
      { key: "DI_Light_Cap", label: "Lighting Rig Capability", placeholder: "e.g. 3-phase power drops" },
      { key: "DI_AC_Load", label: "Event AC Capacity", placeholder: "e.g. Designed for 1000 pax load" },
      { key: "DI_Noise", label: "External Noise Penetration", placeholder: "e.g. None (basement)" }
    ],
    4: [
      { key: "DI_Transport", label: "Transport Node Coverage", placeholder: "e.g. 5 min walk to MRT" },
      { key: "DI_Crowd", label: "Post-Event Crowd Routing", placeholder: "e.g. Dual street exits" },
      { key: "DI_Hotel_Prox", label: "Hotel Proximity", placeholder: "e.g. 3 hotels in 500m" },
      { key: "DI_Security", label: "Security Perimeter", placeholder: "e.g. Controlled plaza" },
      { key: "DI_Walkability", label: "Walkability Score", placeholder: "e.g. 90/100" }
    ],
    5: [
      { key: "DI_Rigging_Load", label: "Rigging Load Ratings", placeholder: "e.g. 2 tons per point" },
      { key: "DI_Floor_Load", label: "Floor Load Limit", placeholder: "e.g. 1000 kg/sqm" },
      { key: "DI_Power_Drop", label: "Power Drops & Distro", placeholder: "e.g. 2x 400A camlock" },
      { key: "DI_Data", label: "Data/Broadcast Lines", placeholder: "e.g. Dark fiber installed" },
      { key: "DI_Structural", label: "Structural Calculations", placeholder: "e.g. Heavy commercial" }
    ],
    6: [
      { key: "DI_Room_Dims", label: "Precise Room Dimensions", placeholder: "e.g. 40x50m clear span" },
      { key: "DI_Ceiling", label: "Clear Ceiling Height", placeholder: "e.g. 12m to bottom of steel" },
      { key: "DI_Hist_Tx", label: "Historical Event Roster", placeholder: "e.g. Hosted global brands" },
      { key: "DI_Ownership", label: "Provenance & Ownership Lineage", placeholder: "e.g. Developer owned" },
      { key: "DI_Blueprint", label: "Original Permit & Blueprint Archive", placeholder: "e.g. Vector rigging plots" }
    ]
  }
};

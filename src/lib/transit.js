import manilaStations from "@/data/manila_transit_stations.json";

export const TRANSIT_HUBS = [
  { keys: ["north avenue", "trinoma"],     coords: [14.6527, 121.0324] }, // North Ave (MRT-3)
  { keys: ["quezon avenue"],               coords: [14.6421, 121.0385] }, // Quezon Ave (MRT-3)
  { keys: ["cubao", "araneta"],            coords: [14.6190, 121.0530] }, // Cubao (MRT-3/LRT-2)
  { keys: ["ortigas"],                     coords: [14.5876, 121.0563] }, // Ortigas (MRT-3)
  { keys: ["shaw"],                        coords: [14.5810, 121.0537] }, // Shaw Blvd (MRT-3)
  { keys: ["ayala"],                       coords: [14.5494, 121.0280] }, // Ayala (MRT-3)
  { keys: ["taft", "edsa"],                coords: [14.5378, 120.9947] }, // Taft/EDSA (MRT-3/LRT-1)
  { keys: ["recto"],                       coords: [14.6038, 120.9822] }, // Recto (LRT-2)
  { keys: ["katipunan"],                   coords: [14.6306, 121.0730] }, // Katipunan (LRT-2)
];

export const CITY_HUB = {
  "quezon city": [14.6527, 121.0324],           // North Avenue
  "bonifacio global city": [14.5494, 121.0280], // Ayala (nearest rail to BGC)
  "makati": [14.5494, 121.0280],                // Ayala
  "pasig": [14.5876, 121.0563],                 // Ortigas
  "mandaluyong": [14.5810, 121.0537],           // Shaw
  "manila": [14.6038, 120.9822],                // Recto
};

// Flatten all exact stations for accurate lookup
export const ALL_STATIONS = [
  ...(manilaStations.lrt1 || []),
  ...(manilaStations.lrt2 || []),
  ...(manilaStations.mrt3 || [])
];

export function resolveTransitHub(transitLabel, city, allowFallback = false) {
  const name = (transitLabel || "").toLowerCase();
  
  // 1. Try exact match from the full database
  const exactStation = ALL_STATIONS.find(s => name.includes(s.name.toLowerCase()));
  if (exactStation) return [exactStation.lat, exactStation.lon];

  // 2. Try the legacy aliases (like "trinoma", "edsa")
  const byName = TRANSIT_HUBS.find(h => h.keys.some(k => name.includes(k)));
  if (byName) return byName.coords;
  
  // 3. Optional fallback to city-center hub (only if requested, to allow Geocoding otherwise)
  if (allowFallback) {
    return CITY_HUB[(city || "").toLowerCase()] || null;
  }
  return null;
}

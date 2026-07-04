import { useState, useEffect } from 'react';
import { ALL_STATIONS } from '@/lib/transit';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export function useTrueClosestTransit(whereTo, propertyLat, propertyLng, city, mapboxToken) {
  const [closestTransit, setClosestTransit] = useState(null);

  useEffect(() => {
    if (!propertyLat || !propertyLng || !mapboxToken) return;

    let isMounted = true;

    async function evaluateTravelTimes() {
      try {
        // 1. Calculate straight line distance to ALL stations in Manila
        const stationsWithDist = ALL_STATIONS.map(s => ({
          ...s,
          distKm: getDistanceFromLatLonInKm(propertyLat, propertyLng, s.lat, s.lon)
        }));

        // 2. Sort by straight line distance and take the closest 15
        stationsWithDist.sort((a, b) => a.distKm - b.distKm);
        const topCandidates = stationsWithDist.slice(0, 15);

        // 3. Format for Mapbox Matrix API (limit 25)
        // Origin is first coordinate [longitude, latitude]
        const allPoints = [
          [propertyLng, propertyLat],
          ...topCandidates.map(s => [s.lon, s.lat])
        ];

        const coordinatesString = allPoints.map(p => `${p[0]},${p[1]}`).join(';');
        const destIndices = topCandidates.map((_, i) => i + 1).join(';');
        const matrixUrl = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinatesString}?sources=0&destinations=${destIndices}&annotations=duration,distance&access_token=${mapboxToken}`;
        
        const matrixRes = await fetch(matrixUrl);
        const matrixData = await matrixRes.json();

        if (matrixData.code === 'Ok' && matrixData.distances && matrixData.distances[0] && matrixData.durations && matrixData.durations[0]) {
          const distances = matrixData.distances[0]; // array of meters
          const durations = matrixData.durations[0]; // array of seconds
          
          let minDistance = Infinity;
          let bestStation = topCandidates[0];
          let bestDuration = 0;

          distances.forEach((distanceMeters, idx) => {
            if (distanceMeters !== null && distanceMeters < minDistance) {
              minDistance = distanceMeters;
              bestStation = topCandidates[idx];
              bestDuration = durations[idx];
            }
          });

          // Fallback if matrix fails entirely for some reason (e.g. no roads)
          if (minDistance === Infinity) {
            bestStation = topCandidates[0];
            bestDuration = (bestStation.distKm / 30) * 3600; // rough 30km/h guess
          }

          if (isMounted) {
            const lineLabel = bestStation.lineName ? ` (${bestStation.lineName.replace('Line ', '')})` : '';
            // Synthesize the object exactly as CommercialFlow expects it
            setClosestTransit({
              name: `${bestStation.name} Station${lineLabel}`,
              category: "transit",
              distance: `${Math.ceil(bestDuration / 60)} min drive`,
              trueCoords: [bestStation.lat, bestStation.lon],
              isAutomated: true
            });
          }
        }
      } catch (err) {
        console.error("[TrueClosestTransit] Error in automated travel times:", err);
      }
    }

    evaluateTravelTimes();

    return () => { isMounted = false; };
  }, [propertyLat, propertyLng, mapboxToken]);

  return closestTransit;
}

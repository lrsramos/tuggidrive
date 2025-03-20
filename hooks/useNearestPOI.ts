import { useState, useEffect } from 'react';
import type { POI } from '@/types';

export function useNearestPOI(pois: POI[]) {
  const [nearestPOI, setNearestPOI] = useState<POI | null>(null);

  useEffect(() => {
    if (!pois.length) {
      setNearestPOI(null);
      return;
    }

    // Sort POIs by distance and get the nearest one
    const sorted = [...pois].sort((a, b) => {
      if (a.distance_km === undefined || b.distance_km === undefined) return 0;
      return a.distance_km - b.distance_km;
    });

    setNearestPOI(sorted[0]);
  }, [pois]);

  return nearestPOI;
}
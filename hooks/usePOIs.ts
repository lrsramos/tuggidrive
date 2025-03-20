import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { POI } from '@/types';
import type { LocationObject } from 'expo-location';

// Fixed search radius for all users
const SEARCH_RADIUS = 5; // 5km

export function usePOIs(location: LocationObject | null) {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef(false);

  // Debounced fetch to prevent rapid updates
  const debouncedFetch = useCallback(async () => {
    if (!location || isFetching.current) return;

    const now = Date.now();
    // Throttle updates to once every 3 seconds
    if (now - lastFetchTime.current < 3000) return;

    try {
      isFetching.current = true;
      setError(null);

      const { data: nearbyAttractions, error: attractionsError } = await supabase
        .rpc('fetch_attractions_within_radius', {
          user_lat: location.coords.latitude,
          user_lon: location.coords.longitude,
          radius_km: SEARCH_RADIUS
        });

      if (attractionsError) {
        console.error('Error fetching POIs:', attractionsError);
        throw attractionsError;
      }

      // Transform the data
      const transformedPOIs: POI[] = (nearbyAttractions || [])
        .map((attraction: any) => ({
          id: attraction.id,
          attraction_id: attraction.id,
          latitude: parseFloat(attraction.latitude),
          longitude: parseFloat(attraction.longitude),
          name: attraction.name || 'Unknown Location',
          description: attraction.description || 'No description available',
          distance_km: parseFloat(attraction.distance_km),
          city: attraction.city,
          country: attraction.country,
          isPremium: attraction.is_premium || false,
          image_url: attraction.image_url
        }))
        .sort((a, b) => {
          if (a.distance_km === undefined || b.distance_km === undefined) return 0;
          return a.distance_km - b.distance_km;
        });

      // Only update state if POIs have actually changed
      setPois(prevPOIs => {
        const hasChanged = JSON.stringify(prevPOIs) !== JSON.stringify(transformedPOIs);
        return hasChanged ? transformedPOIs : prevPOIs;
      });

      lastFetchTime.current = now;
    } catch (err) {
      console.error('Error in fetchPOIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch POIs');
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }, [location]);

  // Initial fetch
  useEffect(() => {
    debouncedFetch();
  }, [debouncedFetch]);

  // Update POIs periodically while moving
  useEffect(() => {
    if (!location?.coords.speed) return;

    const updateInterval = setInterval(() => {
      debouncedFetch();
    }, 3000); // Update every 3 seconds while moving

    return () => clearInterval(updateInterval);
  }, [location, debouncedFetch]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await debouncedFetch();
  }, [debouncedFetch]);

  return { 
    pois,
    loading,
    error,
    searchRadius: SEARCH_RADIUS,
    refetch
  };
}
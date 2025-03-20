import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        setLocation(initialLocation);

        // Start watching location
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      } catch (err) {
        setErrorMsg('Error getting location');
        console.error('Location error:', err);
      }
    })();

    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  return {
    location,
    errorMsg,
    coordinates: location ? {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    } : null,
    accuracy: location?.coords.accuracy ?? null,
    speed: location?.coords.speed ?? null,
    timestamp: location?.timestamp ?? null,
  };
}
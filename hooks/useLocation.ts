import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (Platform.OS === 'ios') {
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        status = backgroundStatus.status;
      }
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        setLocation(initialLocation);

        // Start watching location with background capability
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 3000, // Reduced frequency for better battery life
            distanceInterval: 10,
            foregroundService: Platform.OS === 'android' ? {
              notificationTitle: "Tuggi is tracking your location",
              notificationBody: "This is required for background location updates",
              notificationColor: "#11bd86"
            } : undefined
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
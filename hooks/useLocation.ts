import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const handleLocationPermission = async () => {
      try {
        const foregroundStatus = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(foregroundStatus.status);

        if (foregroundStatus.status !== 'granted') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setPermissionStatus(status);
            setErrorMsg('Permission to access location was denied');
            return;
          }
          setPermissionStatus(status);

          // Request background permission for both iOS and Android
          const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus.status !== 'granted') {
            setErrorMsg('Background location permission was denied - some features may be limited');
            // Continue with foreground only
          } else {
            setPermissionStatus(backgroundStatus.status);
          }
        }

        // Start location tracking after permissions are confirmed
        // Get initial location with retries
        let retryCount = 0;
        const maxRetries = 3;
        let initialLocation = null;
        
        while (retryCount < maxRetries && !initialLocation) {
          try {
            initialLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.BestForNavigation,
              timeout: 10000 // 10 second timeout
            });
            setLocation(initialLocation);
          } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
              console.error('Failed to get initial location after retries:', error);
              setErrorMsg('Unable to get your initial location. Please check your device settings.');
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }

        // Start watching location with background capability and error handling
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
            setErrorMsg(null); // Clear any previous errors when we get a successful update
            setLocation(newLocation);
          }
        );
      } catch (error) {
        console.error('Error in location handling:', error);
        setErrorMsg('Error accessing location services');
        
        // Try to get at least a single location update as fallback
        try {
          const singleLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation
          });
          setLocation(singleLocation);
        } catch (fallbackError) {
          console.error('Fallback location failed:', fallbackError);
          setErrorMsg('Unable to get your location. Please check your device settings.');
        }
      }
    };

    handleLocationPermission();

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
import { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { useLocation } from '@/hooks/useLocation';
import { usePOIs } from '@/hooks/usePOIs';
import { POIMarker } from '@/components/POIMarker';
import { useTranslation } from '@/hooks/useTranslation';

// Only import MapView when not on web
let MapView: any;
let PROVIDER_DEFAULT: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const DEFAULT_LOCATION = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const ZOOM_LEVEL = {
  INITIAL: {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  DEFAULT: {
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};

export default function MapScreen() {
  const { location } = useLocation();
  const { pois, loading, error } = usePOIs(location);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const { t } = useTranslation();
  const initialLocationSet = useRef(false);
  const poisLoaded = useRef(false);

  // Update map when location changes
  useEffect(() => {
    if (!mapReady || !location || !mapRef.current || Platform.OS === 'web') return;

    // Only set initial location once
    if (!initialLocationSet.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        ...ZOOM_LEVEL.INITIAL,
      }, 1000);
      initialLocationSet.current = true;
    }
  }, [location, mapReady]);

  // Fetch POIs on mount
  useEffect(() => {
    if (!poisLoaded.current) {
      poisLoaded.current = true;
    }
  }, []);

  // Handle POIs loading
  useEffect(() => {
    if (!loading && pois.length > 0) {
      poisLoaded.current = true;
    }
  }, [pois, loading]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.webMessage}>
          Map view is not available on web platform
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading && !poisLoaded.current) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#11bd86" />
        <Text style={styles.loadingText}>{t('common', 'loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.select({
          ios: PROVIDER_DEFAULT,
          android: PROVIDER_GOOGLE,
          default: PROVIDER_GOOGLE
        })}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        onMapReady={() => setMapReady(true)}
        initialRegion={{
          latitude: location?.coords.latitude || DEFAULT_LOCATION.latitude,
          longitude: location?.coords.longitude || DEFAULT_LOCATION.longitude,
          ...ZOOM_LEVEL.DEFAULT,
        }}
      >
        {mapReady && pois.map((poi) => (
          <POIMarker 
            key={poi.id} 
            poi={poi}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  webMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
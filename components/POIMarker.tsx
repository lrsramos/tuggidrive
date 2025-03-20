import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';
import type { POI } from '@/types';

interface POIMarkerProps {
  poi: POI;
  onPress?: () => void;
}

export function POIMarker({ poi, onPress }: POIMarkerProps) {
  return (
    <Marker
      identifier={poi.id}
      coordinate={{
        latitude: poi.latitude,
        longitude: poi.longitude,
      }}
      onPress={onPress}
    >
      <View style={styles.markerContainer}>
        <View style={styles.marker}>
          <MapPin size={24} color="#fff" />
        </View>
      </View>
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.title}>{poi.name}</Text>
          {(poi.city || poi.country) && (
            <Text style={styles.location}>
              {[poi.city, poi.country].filter(Boolean).join(', ')}
            </Text>
          )}
          {poi.distance_km !== undefined && (
            <Text style={styles.distance}>
              {poi.distance_km.toFixed(1)} km away
            </Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#11bd86',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  callout: {
    padding: 12,
    minWidth: 200,
    maxWidth: 300,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#11bd86',
    fontWeight: '500',
  },
});
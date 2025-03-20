import { View, StyleSheet } from 'react-native';
import { useLocation } from '@/hooks/useLocation';
import { usePOIs } from '@/hooks/usePOIs';
import { POIList } from '@/components/POIList';
import { NearestPOICard } from '@/components/NearestPOICard';
import { useCallback } from 'react';
import { useNearestPOI } from '@/hooks/useNearestPOI';
import { useAudioDescription } from '@/hooks/useAudioDescription';

export default function POIsScreen() {
  const { location } = useLocation();
  const { pois, loading, error, refetch } = usePOIs(location);
  const nearestPOI = useNearestPOI(pois);
  const { isSpeaking, ttsError, handleAudioPress } = useAudioDescription();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <View style={styles.container}>
      {nearestPOI && (
        <NearestPOICard
          poi={nearestPOI}
          onPress={() => handleAudioPress(nearestPOI)}
          isSpeaking={isSpeaking}
          error={ttsError}
        />
      )}
      <POIList 
        pois={pois.slice(1)}
        loading={loading}
        error={error}
        searchRadius={5}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { MapPin, Lock } from 'lucide-react-native';
import type { POI } from '@/types';
import { DirectionIndicator } from './DirectionIndicator';
import { useLocation } from '@/hooks/useLocation';
import { calculateDirection } from '@/hooks/useDirections';
import { usePremium } from '@/hooks/usePremium';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface POIListProps {
  pois: POI[];
  loading?: boolean;
  error?: string | null;
  searchRadius: number;
  onRefresh?: () => Promise<void>;
}

export function POIList({ pois, loading, error, searchRadius, onRefresh }: POIListProps) {
  const { location } = useLocation();
  const { isPremium } = usePremium();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const handlePremiumPOIPress = () => {
    router.push('/premium');
  };

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>{t('common', 'loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (pois.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MapPin size={48} color="#666" />
        <Text style={styles.emptyText}>
          {t('attractions', 'noAttractionsFound')}
        </Text>
        {!isPremium && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.push('/premium')}
          >
            <Text style={styles.upgradeText}>
              {t('premium', 'upgrade')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={pois}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#4CAF50']}
          tintColor="#4CAF50"
          title={t('common', 'loading')}
          titleColor="#666"
        />
      }
      renderItem={({ item }) => {
        const isPremiumLocked = item.isPremium && !isPremium;

        return (
          <TouchableOpacity
            style={[
              styles.poiItem,
              isPremiumLocked && styles.poiItemLocked
            ]}
            onPress={isPremiumLocked ? handlePremiumPOIPress : undefined}
          >
            <View style={styles.poiContent}>
              <View style={styles.poiInfo}>
                <Text style={styles.poiName}>
                  {item.name}
                  {isPremiumLocked && (
                    <Lock size={16} color="#666" style={styles.lockIcon} />
                  )}
                </Text>
                <Text style={styles.location}>
                  {[item.city, item.country].filter(Boolean).join(', ')}
                </Text>
              </View>
              <View style={styles.directionInfo}>
                {location && (
                  <DirectionIndicator 
                    direction={calculateDirection(location, item)}
                  />
                )}
                {item.distance_km !== undefined && (
                  <Text style={styles.distance}>
                    {item.distance_km.toFixed(1)} {t('attractions', 'kmAway')}
                  </Text>
                )}
              </View>
            </View>
            {isPremiumLocked && (
              <View style={styles.premiumOverlay}>
                <Lock size={24} color="#fff" />
                <Text style={styles.premiumText}>
                  {t('premium', 'upgrade')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  poiItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  poiItemLocked: {
    opacity: 0.8,
  },
  poiContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poiInfo: {
    flex: 0.7, // 70% of the space
    paddingRight: 12,
  },
  directionInfo: {
    flex: 0.3, // 30% of the space
    alignItems: 'center',
  },
  poiName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  distance: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  upgradeButton: {
    marginTop: 16,
    backgroundColor: '#11bd86',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lockIcon: {
    marginLeft: 8,
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Play, Pause, CircleAlert as AlertCircle } from 'lucide-react-native';
import type { POI } from '@/types';
import { useLocation } from '@/hooks/useLocation';
import { calculateDirection } from '@/hooks/useDirections';
import { DirectionIndicator } from './DirectionIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useRef } from 'react';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence,
  withTiming,
  interpolateColor,
  useSharedValue,
  Easing,
  interpolate
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NearestPOICardProps {
  poi: POI;
  onPress: () => void;
  isSpeaking: boolean;
  error?: string | null;
}

export function NearestPOICard({ poi, onPress, isSpeaking, error }: NearestPOICardProps) {
  const { location } = useLocation();
  const { t } = useTranslation();
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  const gradientPosition = useSharedValue(0);
  const backgroundColorAnim = useSharedValue(0);

  useEffect(() => {
    fadeAnim.value = withSpring(1);
    scaleAnim.value = withSpring(1, {
      damping: 10,
      stiffness: 100,
    });

    // Animate gradient
    gradientPosition.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Pulse animation when speaking
    if (isSpeaking) {
      backgroundColorAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      backgroundColorAnim.value = withTiming(0);
    }
  }, [poi.id, isSpeaking]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      backgroundColorAnim.value,
      [0, 1],
      ['rgba(0, 0, 0, 0.7)', 'rgba(17, 189, 134, 0.7)']
    );

    return {
      opacity: fadeAnim.value,
      transform: [{ scale: scaleAnim.value }],
      backgroundColor,
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      gradientPosition.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );

    return {
      transform: [{ translateX }],
      opacity: 0.1,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={[styles.gradient, gradientStyle]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.nearestText}>
              {t('attractions', 'nearestAttraction')}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {poi.name}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {location && (
              <DirectionIndicator 
                direction={calculateDirection(location, poi)}
                variant="dark"
              />
            )}
            {poi.distance_km !== undefined && (
              <Text style={styles.distance}>
                {poi.distance_km.toFixed(1)} {t('attractions', 'kmAway')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.locationContainer}>
          {poi.city && poi.country && (
            <Text style={styles.location}>
              {[poi.city, poi.country].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {poi.description}
        </Text>
        
        <View style={styles.footer}>
          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#ff3b30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.playButton,
                isSpeaking && styles.playButtonActive
              ]} 
              onPress={onPress}
            >
              {isSpeaking ? (
                <>
                  <Pause size={20} color="#fff" />
                  <Text style={styles.playButtonText}>
                    {t('attractions', 'stopAudio')}
                  </Text>
                </>
              ) : (
                <>
                  <Play size={20} color="#fff" />
                  <Text style={styles.playButtonText}>
                    {t('attractions', 'playAudio')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#11bd86',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerRight: {
    alignItems: 'center',
  },
  nearestText: {
    color: '#11bd86',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  distance: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  locationContainer: {
    marginBottom: 8,
  },
  location: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 160,
    justifyContent: 'center',
  },
  playButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 160,
    justifyContent: 'center',
  },
  errorText: {
    color: '#ff3b30',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});
import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { getDistance } from 'geolib';
import type { POI } from '@/types';
import { calculateDirection, getDirectionText } from '@/hooks/useDirections';
import { AppConfig } from '@/config/app';

export function useProximityAlert(location: Location.LocationObject | null, pois: POI[]) {
  const announcedPOIs = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!location) return;

    pois.forEach((poi) => {
      if (announcedPOIs.current.has(poi.id)) return;

      const distance = getDistance(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        { latitude: poi.latitude, longitude: poi.longitude }
      );

      if (distance <= AppConfig.DIRECTIONS.DISTANCE.PROXIMITY_ALERT) {
        const direction = calculateDirection(location, poi);
        const directionText = `This attraction is ${getDirectionText(direction)}. `;
        const locationText = "";
        
        Speech.speak(`You are near ${poi.name}. ${directionText}${locationText}${poi.description}`, {
          language: AppConfig.TTS.LANGUAGE.DEFAULT,
          pitch: AppConfig.TTS.SPEECH.PITCH,
          rate: AppConfig.TTS.SPEECH.RATE,
        });
        announcedPOIs.current.add(poi.id);
      }
    });
  }, [location, pois]);
}
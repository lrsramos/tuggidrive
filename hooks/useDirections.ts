import { LocationObject } from 'expo-location';
import type { POI } from '@/types';
import { AppConfig } from '@/config/app';

type Direction = 'front' | 'back' | 'left' | 'right';

export function calculateDirection(
  userLocation: LocationObject,
  poi: POI
): Direction {
  if (!userLocation.coords.heading) {
    return 'front';
  }

  // Calculate the bearing between user and POI
  const bearing = getBearing(
    userLocation.coords.latitude,
    userLocation.coords.longitude,
    poi.latitude,
    poi.longitude
  );

  // Get the relative angle between user's heading and POI
  let angle = bearing - userLocation.coords.heading;
  
  // Normalize the angle to be between -180 and 180 degrees
  angle = ((angle + 180) % 360) - 180;

  // Determine direction based on angle ranges from config
  if (angle > AppConfig.DIRECTIONS.ANGLES.FRONT.MIN && angle <= AppConfig.DIRECTIONS.ANGLES.FRONT.MAX) {
    return 'front';
  } else if (angle > AppConfig.DIRECTIONS.ANGLES.RIGHT.MIN && angle <= AppConfig.DIRECTIONS.ANGLES.RIGHT.MAX) {
    return 'right';
  } else if (angle > AppConfig.DIRECTIONS.ANGLES.LEFT.MIN && angle <= AppConfig.DIRECTIONS.ANGLES.LEFT.MAX) {
    return 'left';
  } else {
    return 'back';
  }
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  let bearing = toDeg(Math.atan2(y, x));

  // Normalize to 0-360
  return (bearing + 360) % 360;
}

export function getDirectionText(direction: Direction, short: boolean = false): string {
  return short 
    ? AppConfig.DIRECTIONS.NAMES[direction].SHORT
    : AppConfig.DIRECTIONS.NAMES[direction].FULL;
}
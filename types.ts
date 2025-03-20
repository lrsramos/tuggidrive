export interface POI {
  id: string;
  attraction_id: string;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
  distance_km?: number;
  city?: string;
  country?: string;
  isPremium?: boolean;
  image_url?: string;
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  audio_guides_count?: number;
  is_premium?: boolean;
}
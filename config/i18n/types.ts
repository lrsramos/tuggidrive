import { AppConfig } from '../app';

// Define available languages
export const AVAILABLE_LANGUAGES = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'pt-BR': 'Português (Brasil)',
  'es-ES': 'Español',
  'fr-FR': 'Français',
} as const;

// Define TTS languages
export const TTS_LANGUAGES = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'pt-BR': 'Português (Brasil)',
  'es-ES': 'Español',
  'fr-FR': 'Français',
} as const;

export type LanguageCode = keyof typeof AVAILABLE_LANGUAGES;

// Define translation structure type
export interface Translation {
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    forgotPassword: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
  };
  navigation: {
    explore: string;
    map: string;
    premium: string;
    settings: string;
  };
  attractions: {
    nearestAttraction: string;
    noAttractionsFound: string;
    searchRadius: string;
    playAudio: string;
    stopAudio: string;
    distance: string;
    kmAway: string;
    directions: {
      front: string;
      back: string;
      left: string;
      right: string;
      lookingAt: string;
    };
  };
  premium: {
    title: string;
    description: string;
    features: {
      audioGuides: string;
      offlineAccess: string;
      customVoices: string;
      extendedRange: string;
      prioritySupport: string;
    };
    subscribe: string;
    currentPlan: string;
    upgrade: string;
  };
  settings: {
    language: string;
    notifications: string;
    account: string;
    help: string;
    about: string;
    systemLanguage: string;
    premiumLanguage: string;
    appLanguage: string;
    ttsLanguage: string;
    systemTTSLanguage: string;
  };
  errors: {
    default: string;
    network: string;
    auth: string;
    location: string;
    tts: string;
  };
}
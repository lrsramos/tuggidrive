// App-wide configuration settings

// TTS (Text-to-Speech) Settings
export const TTS_CONFIG = {
  // Default speech settings
  SPEECH: {
    PITCH: 1,
    RATE: 0.9,
    DELAY_AFTER_STOP: 100, // ms
  },
  
  // Language preferences
  LANGUAGE: {
    DEFAULT: 'en-US',
    STORAGE_KEY: '@tts_language',
  },
  
  // Language variants mapping
  LANGUAGE_VARIANTS: {
    'en': ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IE', 'en-IN', 'en-NZ', 'en-ZA'],
    'es': ['es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE'],
    'fr': ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH'],
    'de': ['de-DE', 'de-AT', 'de-CH'],
    'it': ['it-IT', 'it-CH'],
    'pt': ['pt-PT', 'pt-BR'],
    'nl': ['nl-NL', 'nl-BE'],
    'zh': ['zh-CN', 'zh-TW', 'zh-HK'],
  } as const,
  
  // Primary language for each variant
  PRIMARY_LANGUAGE: {
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'en-AU': 'en-GB',
    'en-CA': 'en-US',
    'en-IE': 'en-GB',
    'en-IN': 'en-GB',
    'en-NZ': 'en-GB',
    'en-ZA': 'en-GB',
    'es-ES': 'es-ES',
    'es-MX': 'es-MX',
    'es-AR': 'es-ES',
    'es-CO': 'es-ES',
    'es-CL': 'es-ES',
    'es-PE': 'es-ES',
    'fr-FR': 'fr-FR',
    'fr-CA': 'fr-FR',
    'fr-BE': 'fr-FR',
    'fr-CH': 'fr-FR',
    'de-DE': 'de-DE',
    'de-AT': 'de-DE',
    'de-CH': 'de-DE',
    'it-IT': 'it-IT',
    'it-CH': 'it-IT',
    'pt-PT': 'pt-PT',
    'pt-BR': 'pt-BR',
    'nl-NL': 'nl-NL',
    'nl-BE': 'nl-NL',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'zh-HK': 'zh-TW',
  } as const,
  
  // Supported languages with their display names
  LANGUAGES: {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    'fr-FR': 'French (France)',
    'de-DE': 'German (Germany)',
    'it-IT': 'Italian (Italy)',
    'pt-PT': 'Portuguese (Portugal)',
    'pt-BR': 'Portuguese (Brazil)',
    'nl-NL': 'Dutch (Netherlands)',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
  } as const,
} as const;

// OpenAI Configuration
export const OPENAI_CONFIG = {
  MODEL: 'gpt-3.5-turbo',
  
  // Generation parameters
  PARAMS: {
    TEMPERATURE: 0.7,
    MAX_TOKENS: 250,
    PRESENCE_PENALTY: 0.3,
    FREQUENCY_PENALTY: 0.3,
  },
  
  // Prompt templates
  PROMPTS: {
    SYSTEM_MESSAGE: (languageName: string) => 
      `You are a professional tour guide and translator guinding tourist through a city historical points. Your task is to:
1. Generate a concise, trully and engaging description with historical and important date facts of tourist attractions
2. Translate the content to ${languageName}
3. Ensure the language is natural and culturally appropriate
4. Donn't repete the location and attraction name
5. Only mention real facts
6. Keep descriptions between 3-4 sentences`,

    USER_MESSAGE: (name: string, location: string, languageName: string) => 
      `Create a tourist attraction description for "${name}"${location ? ` in ${location}` : ''}.

Requirements:
- Write in ${languageName} language
- Include historical and date significance facts if relevant
- Mention key features and points of interest
- Only mention real facts
- Keep it engaging and informative
- Use natural, conversational language
- Do not repete the locatio and attaction name
- Length: 3-4 sentences

Response language: ${languageName}`,
  },
} as const;

// Navigation & Directions
export const DIRECTIONS_CONFIG = {
  // Angle ranges for determining direction (in degrees)
  ANGLES: {
    FRONT: { MIN: -45, MAX: 45 },
    RIGHT: { MIN: 45, MAX: 135 },
    LEFT: { MIN: -135, MAX: -45 },
    // BACK is implied as everything else
  },
  
  // Direction display names
  NAMES: {
    FRONT: {
      SHORT: 'ahead',
      FULL: 'ahead of you',
    },
    BACK: {
      SHORT: 'behind',
      FULL: 'behind you',
    },
    LEFT: {
      SHORT: 'left',
      FULL: 'to your left',
    },
    RIGHT: {
      SHORT: 'right',
      FULL: 'to your right',
    },
  },
  
  // Distance settings
  DISTANCE: {
    PROXIMITY_ALERT: 100, // meters
    DEFAULT_SEARCH_RADIUS: 5, // kilometers
    UPDATE_INTERVAL: 3000, // milliseconds
  },
} as const;

// Cache settings
export const CACHE_CONFIG = {
  DESCRIPTION: {
    MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    MAX_PLAYS: 50,
  },
} as const;

// Helper functions for language handling
export const LanguageUtils = {
  // Get the base language code (e.g., 'en' from 'en-US')
  getBaseLanguage: (language: string): string => {
    return language.split('-')[0];
  },

  // Get the primary language variant for a given language code
  getPrimaryLanguage: (language: string): string => {
    const primaryLang = TTS_CONFIG.PRIMARY_LANGUAGE[language as keyof typeof TTS_CONFIG.PRIMARY_LANGUAGE];
    return primaryLang || TTS_CONFIG.LANGUAGE.DEFAULT;
  },

  // Check if two language codes are variants of the same base language
  areSameLanguage: (lang1: string, lang2: string): boolean => {
    const base1 = LanguageUtils.getBaseLanguage(lang1);
    const base2 = LanguageUtils.getBaseLanguage(lang2);
    return base1 === base2;
  },

  // Get all variants for a base language
  getLanguageVariants: (baseLanguage: string): string[] => {
    return TTS_CONFIG.LANGUAGE_VARIANTS[baseLanguage as keyof typeof TTS_CONFIG.LANGUAGE_VARIANTS] || [];
  },
} as const;

// Export all configurations
export const AppConfig = {
  TTS: TTS_CONFIG,
  OPENAI: OPENAI_CONFIG,
  DIRECTIONS: DIRECTIONS_CONFIG,
  CACHE: CACHE_CONFIG,
  LanguageUtils,
} as const;
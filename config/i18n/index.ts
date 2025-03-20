import { AppConfig } from '../app';
import { AVAILABLE_LANGUAGES, type Translation, type LanguageCode } from './types';
import { en_US } from './en';
import { pt_BR } from './pt';
import { es_ES } from './es';
import { fr_FR } from './fr';

// Create translations map
export const translations: Record<LanguageCode, Translation> = {
  'en-US': en_US,
  'en-GB': en_US, // Use US English for UK
  'pt-BR': pt_BR,
  'es-ES': es_ES,
  'fr-FR': fr_FR,
};

// Helper function to get translation based on language code
export function getTranslation(languageCode: string): Translation {
  // Get base language code
  const baseCode = AppConfig.LanguageUtils.getBaseLanguage(languageCode);
  
  // Find matching language code
  const matchingCode = Object.keys(translations).find(code => 
    code.startsWith(baseCode)
  ) as LanguageCode;

  // Return matching translation or default to US English
  return translations[matchingCode] || translations['en-US'];
}

export { AVAILABLE_LANGUAGES };
export type { Translation, LanguageCode };
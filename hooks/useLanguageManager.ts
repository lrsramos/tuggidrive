// hooks/useLanguageManager.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { AVAILABLE_LANGUAGES, type LanguageCode } from '@/config/i18n/types';
import { useTTS } from './useTTS';
import { useProfile } from './useProfile';

const LANGUAGE_STORAGE_KEY = '@app_language';

export function useLanguageManager() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    Localization.locale as LanguageCode
  );
  const [isLoading, setIsLoading] = useState(true);
  const { setLanguage } = useTTS();
  const { profile, updateProfile } = useProfile();

  // Validate language code
  const isValidLanguage = (code: string): code is LanguageCode => {
    return code in AVAILABLE_LANGUAGES;
  };

  // Get default language based on system locale
  const getDefaultLanguage = (): LanguageCode => {
    const locale = Localization.locale;
    return isValidLanguage(locale) ? locale : 'en-US';
  };

  // Load saved language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        console.log('🔍 Loading saved language preference...');
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        console.log('💾 Saved language:', saved);

        if (saved && isValidLanguage(saved)) {
          console.log('✅ Using saved language:', saved);
          setCurrentLanguage(saved);
          await setLanguage(saved);
        } else {
          const defaultLang = getDefaultLanguage();
          console.log('⚠️ No saved language, using default:', defaultLang);
          setCurrentLanguage(defaultLang);
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, defaultLang);
          await setLanguage(defaultLang);
        }

        // Sync with profile if needed
        if (profile && profile.voice_preference !== saved) {
          console.log('🔄 Syncing language with profile...');
          await updateProfile({ voice_preference: saved || getDefaultLanguage() });
        }
      } catch (error) {
        console.error('❌ Error loading language:', error);
        const defaultLang = getDefaultLanguage();
        setCurrentLanguage(defaultLang);
        await setLanguage(defaultLang);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, [profile]);

  // Change language
  const changeLanguage = useCallback(async (language: LanguageCode) => {
    try {
      console.log('🔄 Changing language to:', language);

      if (!isValidLanguage(language)) {
        throw new Error('Invalid language code');
      }

      // Save to storage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      console.log('💾 Language saved to storage');
      
      // Update TTS language
      await setLanguage(language);
      console.log('🗣️ TTS language updated');

      // Update profile
      if (profile) {
        await updateProfile({ voice_preference: language });
        console.log('👤 Profile language preference updated');
      }
      
      // Update state
      setCurrentLanguage(language);
      console.log('✅ Language change completed');

      return true;
    } catch (error) {
      console.error('❌ Error changing language:', error);
      return false;
    }
  }, [setLanguage, profile, updateProfile]);

  return {
    currentLanguage,
    isLoading,
    changeLanguage,
    availableLanguages: AVAILABLE_LANGUAGES,
  };
}

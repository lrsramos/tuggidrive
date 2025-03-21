import { useState, useCallback, useEffect, useRef } from 'react';
import { useProfile } from './useProfile';
import { usePremium } from './usePremium';
import { useSystemLanguage } from './useSystemLanguage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '@/config/app';
import { elevenLabs } from '@/lib/elevenlabs';

const TTS_LANGUAGE_KEY = '@selected_language';

export function useTTS() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en-US');
  const { profile, updateProfile } = useProfile();
  const { isPremium } = usePremium();
  const { systemLanguage } = useSystemLanguage();
  const isMounted = useRef(true);
  const speakingRef = useRef(false);
  const initializingRef = useRef(false);
  
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      if (initializingRef.current) return;
      
      try {
        initializingRef.current = true;
        
        let initialLanguage = systemLanguage;
        
        if (isPremium) {
          try {
            const savedLanguage = await AsyncStorage.getItem(TTS_LANGUAGE_KEY);
            console.log('[TTS] Stored language preference:', savedLanguage);
            if (savedLanguage) {
              initialLanguage = savedLanguage;
            } else if (profile?.voice_preference) {
              initialLanguage = profile.voice_preference;
            }
          } catch (error) {
            console.error('Error loading language preference:', error);
          }
        }

        // Get base language code (e.g., 'en' from 'en-BR')
        const baseLanguage = initialLanguage.split('-')[0];

        // If not supported, fall back to default language
        if (!Object.keys(AppConfig.TTS.LANGUAGES).includes(initialLanguage)) {
          initialLanguage = AppConfig.TTS.LANGUAGE.DEFAULT;
          console.log(`Language ${baseLanguage} not supported, falling back to ${AppConfig.TTS.LANGUAGE.DEFAULT}`);
        }

        // Stop any ongoing speech
        await elevenLabs.stop();
        speakingRef.current = false;

        if (mounted) {
          setIsInitialized(true);
          setCurrentLanguage(initialLanguage);
        }

        if (isPremium && profile && profile.voice_preference !== initialLanguage) {
          await updateProfile({ voice_preference: initialLanguage });
        }
      } catch (error) {
        console.error('TTS initialization error:', error);
        if (mounted) {
          setCurrentLanguage(AppConfig.TTS.LANGUAGE.DEFAULT);
          setIsInitialized(true);
        }
      } finally {
        initializingRef.current = false;
      }
    };

    initialize();

    return () => {
      mounted = false;
      elevenLabs.stop();
    };
  }, [isPremium, profile, systemLanguage, updateProfile, currentLanguage]);

  const setLanguage = useCallback(async (language: string) => {
    if (!isInitialized || !isPremium) return;

    try {
      // Get base language code
      const baseLanguage = language.split('-')[0];
      
      // Check if the language is supported
      if (!Object.keys(AppConfig.TTS.LANGUAGES).includes(language)) {
        throw new Error(`Language ${baseLanguage} is not supported`);
      }

      // Stop any ongoing speech
      await elevenLabs.stop();
      speakingRef.current = false;

      // Update AsyncStorage first
      await AsyncStorage.setItem(TTS_LANGUAGE_KEY, language);
      console.log('[TTS] Updated language preference:', language);

      // Then update the state and profile
      setCurrentLanguage(language);
      
      if (profile) {
        await updateProfile({ voice_preference: language });
      }
    } catch (error) {
      console.error('Error setting language:', error);
      throw new Error('Failed to change language');
    }
  }, [isInitialized, isPremium, profile, updateProfile]);

  const speak = useCallback(async (text: string, options?: {
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: any) => void;
  }) => {
    if (!isInitialized) return;

    try {
      speakingRef.current = true;
      
      await elevenLabs.speak(text.trim(), currentLanguage, {
        onStart: () => {
          if (isMounted.current) {
            options?.onStart?.();
          }
        },
        onComplete: () => {
          if (isMounted.current) {
            speakingRef.current = false;
            options?.onDone?.();
          }
        },
        onError: (error) => {
          if (isMounted.current) {
            speakingRef.current = false;
            options?.onError?.(error);
          }
        }
      });
    } catch (error) {
      speakingRef.current = false;
      throw error;
    }
  }, [isInitialized, currentLanguage]);

  const stop = useCallback(async () => {
    try {
      await elevenLabs.stop();
      speakingRef.current = false;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }, []);

  return {
    speak,
    stop,
    isInitialized,
    currentLanguage,
    setLanguage,
    isLanguageSelectionEnabled: isPremium,
    isSpeaking: speakingRef.current
  };
}
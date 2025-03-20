import { useState, useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { useProfile } from './useProfile';
import { usePremium } from './usePremium';
import { useSystemLanguage } from './useSystemLanguage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '@/config/app';

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
        const voices = await Speech.getAvailableVoicesAsync();
        
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
        
        // Check if the language is supported
        const isLanguageSupported = voices.some(voice => 
          voice.language.startsWith(baseLanguage)
        );

        // If not supported, fall back to default language
        if (!isLanguageSupported) {
          initialLanguage = AppConfig.TTS.LANGUAGE.DEFAULT;
          console.log(`Language ${baseLanguage} not supported, falling back to ${AppConfig.TTS.LANGUAGE.DEFAULT}`);
        }

        // Ensure any ongoing speech is stopped
        await Speech.stop();
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
      Speech.stop();
    };
  }, [isPremium, profile, systemLanguage, updateProfile, currentLanguage]);

  const setLanguage = useCallback(async (language: string) => {
    if (!isInitialized || !isPremium) return;

    try {
      // Get base language code
      const baseLanguage = language.split('-')[0];
      
      // Get available voices
      const voices = await Speech.getAvailableVoicesAsync();
      
      // Check if the language is supported
      const isLanguageSupported = voices.some(voice => 
        voice.language.startsWith(baseLanguage)
      );

      // If not supported, throw error
      if (!isLanguageSupported) {
        throw new Error(`Language ${baseLanguage} is not supported`);
      }

      // Ensure any ongoing speech is stopped
      await Speech.stop();
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

  const speak = useCallback(async (text: string, options?: Speech.SpeechOptions) => {
    if (!isInitialized) return;

    try {
      // Always stop any ongoing speech first
      await Speech.stop();
      await new Promise(resolve => setTimeout(resolve, AppConfig.TTS.SPEECH.DELAY_AFTER_STOP));
      // Use the current language which is already synchronized with saved preferences
      const language = currentLanguage;
      // If no saved preference or error occurred, fallback to current language
      
      speakingRef.current = true;
      //console.log('[TTS] Playing audio with language:', language);

      await new Promise<void>((resolve, reject) => {
        Speech.speak(text.trim(), {
          ...options,
          language: language, // Use full language code
          pitch: AppConfig.TTS.SPEECH.PITCH,
          rate: AppConfig.TTS.SPEECH.RATE,
          onStart: () => {
            if (isMounted.current) {
              options?.onStart?.();
            }
          },
          onDone: () => {
            if (isMounted.current) {
              speakingRef.current = false;
              options?.onDone?.();
              resolve();
            }
          },
          onStopped: () => {
            if (isMounted.current) {
              speakingRef.current = false;
              options?.onStopped?.();
              resolve();
            }
          },
          onError: (error) => {
            if (isMounted.current) {
              speakingRef.current = false;
              options?.onError?.(error);
              reject(error);
            }
          }
        });
      });
    } catch (error) {
      speakingRef.current = false;
      throw error;
    }
  }, [isInitialized, currentLanguage, isPremium, systemLanguage]);

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
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
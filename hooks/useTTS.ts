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
        
        // Stop any ongoing speech before initializing
        if (speakingRef.current) {
          await elevenLabs.stop();
          speakingRef.current = false;
        }
        
        let initialLanguage = systemLanguage;
        
        if (isPremium) {
          try {
            const savedLanguage = await AsyncStorage.getItem(TTS_LANGUAGE_KEY);
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
        const baseLanguage = initialLanguage;

        // If not supported, fall back to default language
        if (!Object.keys(AppConfig.TTS.LANGUAGES).includes(initialLanguage)) {
          initialLanguage = AppConfig.TTS.LANGUAGE.DEFAULT;
          //console.log(`Language ${baseLanguage} not supported, falling back to ${AppConfig.TTS.LANGUAGE.DEFAULT}`);
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

      // Stop any ongoing speech and wait for it to complete
      if (speakingRef.current) {
        await elevenLabs.stop();
        speakingRef.current = false;
      }

      // Update state first to ensure immediate language change
      setCurrentLanguage(language);
      
      // Then update storage and profile
      await Promise.all([
        AsyncStorage.setItem(TTS_LANGUAGE_KEY, language),
        profile ? updateProfile({ voice_preference: language }) : Promise.resolve()
      ]);
      
      // Wait for state update to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('[TTS] Language changed to:', language);

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
      // Wait for any pending language changes to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the current language at the time of speaking
      const speakLanguage = currentLanguage;
      console.log('[TTS] Preparing to speak with language:', speakLanguage);
      
      // Ensure we're not speaking before starting new speech
      if (speakingRef.current) {
        await stop();
      }
      speakingRef.current = true;
      
      await elevenLabs.speak(text.trim(), speakLanguage, {
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
      // First ensure we have a valid elevenLabs instance
      if (!elevenLabs) {
        console.warn('TTS: Attempted to stop with no elevenLabs instance');
        speakingRef.current = false;
        return;
      }
      
      // Only attempt to stop if we're currently speaking
      if (speakingRef.current) {
        try {
          // Ensure any existing audio is properly cleaned up
          await Promise.race([
            elevenLabs.stop(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Stop timeout')), 3000)
            )
          ]);
        } catch (error) {
          // Log but don't rethrow to ensure we always reset speaking state
          console.warn('TTS: Error during stop operation:', error);
          // Force reset speaking state on error
          speakingRef.current = false;
        }
      }
    } catch (error) {
      console.error('TTS: Unexpected error in stop function:', error);
    } finally {
      // Always reset speaking state regardless of errors
      speakingRef.current = false;
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
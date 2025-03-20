import { useState, useEffect } from 'react';
import * as Speech from 'expo-speech';

export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Check if speech synthesis is available
        const available = await Speech.isSpeakingAsync();
        // Initialize with a silent speech to trigger permissions
        if (!available) {
          await Speech.speak('', { 
            pitch: 1,
            rate: 0.1,
            volume: 0
          });
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      Speech.stop();
    };
  }, []);

  const speak = async (text: string, options?: Speech.SpeechOptions) => {
    if (!isInitialized) {
      console.warn('Audio not initialized yet');
      return;
    }

    try {
      // Stop any current speech
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
      }

      // Start new speech
      await Speech.speak(text, {
        pitch: 1,
        rate: 0.9,
        ...options
      });
    } catch (error) {
      console.error('Speech error:', error);
      throw error;
    }
  };

  return {
    speak,
    isInitialized,
    stop: Speech.stop
  };
}
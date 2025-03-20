import { useState } from 'react';
import { useDescription } from './useDescription';
import { useTTS } from './useTTS';
import { calculateDirection } from './useDirections';
import { useLocation } from './useLocation';
import { useTranslation } from './useTranslation';
import type { POI } from '@/types';

export function useAudioDescription() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const { getDescription } = useDescription();
  const { speak, stop, isInitialized, currentLanguage } = useTTS();
  const { location } = useLocation();
  const { t } = useTranslation();
  const [currentDescription, setCurrentDescription] = useState<{
    text: string;
    language: string;
  } | null>(null);

  const handleAudioPress = async (poi: POI) => {
    try {
      setTtsError(null);

      // If already speaking, stop the audio
      if (isSpeaking) {
        await stop();
        setIsSpeaking(false);
        return;
      }

      if (!isInitialized) {
        setTtsError(t('errors', 'tts'));
        return;
      }

      setIsSpeaking(true);

      // Check if we need to fetch a new description
      const needsNewDescription = !currentDescription || 
        currentDescription.language !== currentLanguage;

      let description = currentDescription?.text;

      if (needsNewDescription) {
        description = await getDescription(
          poi.attraction_id,
          poi.name,
          poi.city,
          poi.country
        );

        if (!description) {
          throw new Error(t('errors', 'default'));
        }

        // Save the new description and its language
        setCurrentDescription({
          text: description,
          language: currentLanguage
        });
      }

      // Construct the speech text using translations
      const lookingAtText = location ? `${t('attractions', 'directions', 'lookingAt')} ${calculateDirection(location, poi)} ` : '';
      const fullDescription = `${lookingAtText}${poi.name}. ${description}`;
      
      await speak(fullDescription, {
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('TTS Error:', error);
          setTtsError(t('errors', 'tts'));
          setIsSpeaking(false);
        }
      });
    } catch (err) {
      console.error('Error playing audio:', err);
      setTtsError(err instanceof Error ? err.message : t('errors', 'tts'));
      setIsSpeaking(false);
    }
  };

  return {
    isSpeaking,
    ttsError,
    handleAudioPress,
  };
}
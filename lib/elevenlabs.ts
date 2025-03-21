import { Audio } from 'expo-av';
import { storage } from './secureStore';

const CACHE_PREFIX = '@elevenlabs_cache_';
const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

const config = {
  apiKey: API_KEY || '',
  defaultVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
  defaultSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0,
    use_speaker_boost: true,
  } as VoiceSettings,
};

class ElevenLabsService {
  private voiceId: string;
  private settings: VoiceSettings;
  private soundObject: Audio.Sound | null = null;
  private isSpeaking = false;

  constructor() {
    this.voiceId = config.defaultVoiceId;
    this.settings = config.defaultSettings;
  }

  private async getCachedAudio(text: string, language: string): Promise<string | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${language}_${text}`;
      return await storage.getItem(cacheKey);
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  private async cacheAudio(text: string, language: string, audioBase64: string) {
    try {
      const cacheKey = `${CACHE_PREFIX}${language}_${text}`;
      await storage.setItem(cacheKey, audioBase64);
    } catch (error) {
      console.error('Error caching audio:', error);
    }
  }

  private async textToSpeech(text: string): Promise<ArrayBuffer> {
    const response = await fetch(`${API_URL}/text-to-speech/${this.voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': config.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: this.settings,
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async speak(text: string, language: string, options?: {
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: any) => void;
  }) {
    try {
      // Stop any current playback
      await this.stop();

      // Check cache first
      let audioBase64 = await this.getCachedAudio(text, language);

      if (!audioBase64) {
        // Generate new audio if not cached
        const audioBuffer = await this.textToSpeech(text);
        audioBase64 = this.arrayBufferToBase64(audioBuffer);
        
        // Cache the new audio
        await this.cacheAudio(text, language, audioBase64);
      }

      // Create audio URI with proper MIME type and encoding
      const audioUri = `data:audio/mp3;base64,${audioBase64}`;

      // Create and load audio with proper error handling
      this.soundObject = new Audio.Sound();
      
      const { sound: loadedSound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      
      if (!status.isLoaded) {
        throw new Error('Audio failed to load properly');
      }
      
      this.soundObject = loadedSound;

      // Set up event handlers only after successful loading
      if (this.soundObject) {
        this.soundObject.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              this.isSpeaking = false;
              options?.onComplete?.();
            }
          }
        });

        this.isSpeaking = true;
        options?.onStart?.();
        await this.soundObject.playAsync();
      } else {
        throw new Error('Failed to initialize audio object');
      }

    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      this.isSpeaking = false;
      options?.onError?.(error);
    }
  }

  async stop() {
    try {
      if (this.soundObject) {
        const status = await this.soundObject.getStatusAsync();
        if (status.isLoaded) {
          await this.soundObject.stopAsync();
          await this.soundObject.unloadAsync();
        }
        this.soundObject = null;
      }
      this.isSpeaking = false;
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  async setVoice(voiceId: string) {
    this.voiceId = voiceId;
  }

  async setSettings(settings: Partial<VoiceSettings>) {
    this.settings = {
      ...this.settings,
      ...settings
    };
  }
}

export const elevenLabs = new ElevenLabsService();
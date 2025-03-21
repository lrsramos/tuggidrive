import { Audio } from 'expo-av';
import { storage } from './secureStore';
import * as FileSystem from 'expo-file-system';

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

      // Initialize audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Check cache first
      let audioBase64 = await this.getCachedAudio(text, language);

      if (!audioBase64) {
        // Generate new audio if not cached
        const audioBuffer = await this.textToSpeech(text);
        audioBase64 = this.arrayBufferToBase64(audioBuffer);
        
        // Cache the new audio
        await this.cacheAudio(text, language, audioBase64);
      }

      // Save base64 audio to a temporary file
      const tempFile = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(tempFile, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create and load audio with proper error handling
      this.soundObject = new Audio.Sound();
      
      const { sound: loadedSound, status } = await Audio.Sound.createAsync(
        { uri: tempFile },
        { 
          shouldPlay: false,
          progressUpdateIntervalMillis: 50,
          positionMillis: 0,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.isSpeaking = false;
            options?.onComplete?.();
            // Clean up temp file
            FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(console.error);
          }
        }
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

  private async cleanup() {
    try {
      if (this.soundObject) {
        const status = await this.soundObject.getStatusAsync();
        if (status.isLoaded) {
          await this.soundObject.stopAsync();
          await this.soundObject.unloadAsync();
        }
        this.soundObject = null;
      }
    } catch (error) {
      console.warn('Error during audio cleanup:', error);
    }
    this.isSpeaking = false;
  }

  async stop() {
    try {
      await this.cleanup();
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
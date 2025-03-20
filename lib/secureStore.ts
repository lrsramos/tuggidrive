import * as ExpoSecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Maximum size for SecureStore (2048 bytes)
const MAX_SECURE_STORE_SIZE = 2000; // Leave some buffer

class NativeStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      // Try SecureStore first
      const value = await ExpoSecureStore.getItemAsync(key);
      if (value !== null) return value;

      // If not in SecureStore, check AsyncStorage
      return await AsyncStorage.getItem(key);
    } catch (error) {
      // Fallback to AsyncStorage
      return AsyncStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      // If value is small enough, use SecureStore
      if (value.length <= MAX_SECURE_STORE_SIZE) {
        await ExpoSecureStore.setItemAsync(key, value);
      } else {
        // For larger values, use AsyncStorage
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // Remove from both storages to ensure cleanup
      await Promise.all([
        ExpoSecureStore.deleteItemAsync(key),
        AsyncStorage.removeItem(key)
      ]);
    } catch (error) {
      // Ensure at least AsyncStorage is cleaned
      await AsyncStorage.removeItem(key);
    }
  }
}

// Export storage instance
export const storage = new NativeStorage();
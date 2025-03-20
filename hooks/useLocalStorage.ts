import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setItem(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving to local storage:', error);
  }
}

export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error reading from local storage:', error);
    return null;
  }
}

export async function removeItem(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from local storage:', error);
  }
}
import { useState, useEffect } from 'react';
import { Platform, NativeModules } from 'react-native';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_LANGUAGE_KEY = '@app_language';

export function useSystemLanguage() {
  const [appLanguage, setAppLanguage] = useState(Localization.locale);

  useEffect(() => {
    // Load saved app language preference
    const loadAppLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
        if (savedLanguage) {
          setAppLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading app language:', error);
      }
    };

    loadAppLanguage();
  }, []);

  const changeAppLanguage = async (newLanguage: string) => {
    try {
      await AsyncStorage.setItem(APP_LANGUAGE_KEY, newLanguage);
      setAppLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving app language:', error);
    }
  };

  return {
    systemLanguage: appLanguage,
    languageCode: appLanguage.split('-')[0],
    countryCode: appLanguage.split('-')[1],
    changeAppLanguage,
  };
}
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Language groups for better organization
const LANGUAGE_GROUPS = [
  {
    name: 'Popular',
    languages: [
      { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
      { code: 'en-US', name: 'English (US)', nativeName: 'English (US)' },
      { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)' },
      { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)' },
    ]
  },
  {
    name: 'Others',
    languages: [
      { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)' },
      { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)' },
      { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano (Italia)' },
      { code: 'nl-NL', name: 'Dutch (Netherlands)', nativeName: 'Nederlands (Nederland)' },
      { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)' },
    ]
  },
];

const LANGUAGES = LANGUAGE_GROUPS.flatMap(group => group.languages);

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  isEnabled?: boolean;
  onPremiumPress?: () => void;
}

export function LanguageSelector({ 
  value, 
  onChange, 
  isEnabled = true,
  onPremiumPress 
}: LanguageSelectorProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {LANGUAGE_GROUPS.map((group) => (
        <View key={group.name} style={styles.groupContainer}>
          <Text style={styles.groupTitle}>{group.name}</Text>
          <View style={styles.languageGrid}>
            {group.languages.map((lang) => {
              const isSelected = value === lang.code;
              const isSystemLanguage = lang.code === value && !isEnabled;

              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    isSelected && styles.selectedItem,
                    !isEnabled && !isSystemLanguage && styles.disabledItem
                  ]}
                  onPress={() => {
                    if (!isEnabled && !isSystemLanguage) {
                      onPremiumPress?.();
                      return;
                    }
                    onChange(lang.code);
                    //console.log('Language seleted by user',lang.code)
                    AsyncStorage.setItem('@selected_language', lang.code).catch(error => {
                      console.error('Error saving language preference:', error);
                    });
                  }}
                  disabled={!isEnabled && !isSystemLanguage}
                >
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      isSelected && styles.selectedText,
                      !isEnabled && !isSystemLanguage && styles.disabledText
                    ]}>
                      {lang.name}
                    </Text>
                    <Text style={[
                      styles.nativeName,
                      isSelected && styles.selectedSubtext,
                      !isEnabled && !isSystemLanguage && styles.disabledText
                    ]}>
                    </Text>
                  </View>

                  <View style={styles.iconContainer}>
                    {isSelected ? (
                      <Check size={20} color="#11bd86" />
                    ) : (!isEnabled && !isSystemLanguage) ? (
                      <Lock size={20} color="#666" />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    maxHeight: 400,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    width: '48%',
  },
  selectedItem: {
    backgroundColor: '#f0f9f6',
    borderColor: '#11bd86',
  },
  disabledItem: {
    opacity: 0.7,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  selectedText: {
    color: '#11bd86',
    fontWeight: '500',
  },
  disabledText: {
    color: '#999',
  },
  nativeName: {
    fontSize: 14,
    color: '#666',
  },
  selectedSubtext: {
    color: '#11bd86',
  },
  nativeName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
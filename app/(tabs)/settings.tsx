import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Bell, Globe, User, Pencil, LogOut, Camera, Lock, Crown, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useSystemLanguage } from '@/hooks/useSystemLanguage';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTTS } from '@/hooks/useTTS';
import { usePremium } from '@/hooks/usePremium';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsScreen() {
  const { profile, loading, error } = useProfile();
  const router = useRouter();
  const { systemLanguage, changeAppLanguage } = useSystemLanguage();
  const { currentLanguage, setLanguage, isLanguageSelectionEnabled } = useTTS();
  const { currentTier, isLoading: isPremiumLoading } = usePremium();
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  const handleLogout = async () => {
    Alert.alert(
      t('auth', 'signOut'),
      'Are you sure you want to sign out?',
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        { 
          text: t('auth', 'signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/login');
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert(t('errors', 'default'));
            }
          }
        },
      ]
    );
  };

  const handleAppLanguageChange = async (language: string) => {
    try {
      console.log('[Language Selection] Language selection triggered');
      console.log('[Language Selection] Current language:', systemLanguage);
      console.log('[Language Selection] Changing app language to:', language);
      setIsSaving(true);
      await changeAppLanguage(language);
      console.log('[Language Selection] App language successfully changed to:', language);
    } catch (err) {
      console.error('Error changing app language:', err);
      Alert.alert(t('errors', 'default'));
    } finally {
      setIsSaving(false);
      console.log('[Language Selection] Language change process completed');
    }
  };

  const handleTTSLanguageChange = async (language: string) => {
    try {
      console.log('[TTS Language] Language selection triggered');
      console.log('[TTS Language] Current language:', currentLanguage);
      console.log('[TTS Language] Changing TTS language to:', language);
      setIsSaving(true);
      await setLanguage(language);
      console.log('[TTS Language] TTS language successfully changed to:', language);
    } catch (err) {
      console.error('Error changing language:', err);
      Alert.alert(t('errors', 'default'));
    } finally {
      setIsSaving(false);
      console.log('[TTS Language] Language change process completed');
    }
  };

  const handlePremiumPress = () => {
    Alert.alert(
      t('premium', 'title'),
      t('premium', 'description'),
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        { 
          text: t('premium', 'upgrade'),
          onPress: () => router.push('/settings/premium')
        }
      ]
    );
  };

  if (loading || isPremiumLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#11bd86" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || t('errors', 'default')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile.full_name?.[0] || profile.username?.[0] || '?'}
              </Text>
              <View style={styles.cameraButton}>
                <Camera size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.full_name || t('settings', 'noName')}</Text>
            <Text style={styles.username}>@{profile.nickname || profile.username || 'anonymous'}</Text>
            <TouchableOpacity 
              style={styles.planBadgeContainer}
              onPress={() => router.push('/settings/premium')}
            >
              {currentTier?.price ? (
                <View style={styles.planBadge}>
                  <Crown size={14} color="#FFD700" />
                  <Text style={styles.planBadgeText}>{currentTier.name}</Text>
                </View>
              ) : (
                <View style={styles.freePlanBadge}>
                  <Text style={styles.freePlanText}>Free Plan</Text>
                  <ChevronRight size={16} color="#666" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/profile-editor')}
          >
            <Pencil size={20} color="#11bd86" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={20} color="#666" />
          <Text style={styles.sectionTitle}>{t('settings', 'language')}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('settings', 'appLanguage')}</Text>
          <LanguageSelector
            value={systemLanguage}
            onChange={changeAppLanguage}
            isEnabled={true}
          />
        </View>

        <View style={[styles.field, { borderBottomWidth: 0 }]}>
          <Text style={styles.label}>
            {isLanguageSelectionEnabled 
              ? t('settings', 'ttsLanguage')
              : t('settings', 'systemTTSLanguage')
            }
          </Text>
          <LanguageSelector
            value={currentLanguage}
            onChange={handleTTSLanguageChange}
            isEnabled={isLanguageSelectionEnabled}
            onPremiumPress={handlePremiumPress}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <LogOut size={20} color="#666" />
        <Text style={styles.logoutText}>{t('auth', 'signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#11bd86',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  cameraButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  planBadgeContainer: {
    alignSelf: 'flex-start',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  planBadgeText: {
    color: '#b8860b',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  freePlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  freePlanText: {
    color: '#666',
    fontSize: 14,
    marginRight: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  logoutText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#11bd86',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  cameraButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#333',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  planCard: {
    padding: 16,
    backgroundColor: '#fff',
  },
  planInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  planBadgeText: {
    fontSize: 12,
    color: '#ffa000',
    fontWeight: '600',
  },
  planDetails: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 16,
    color: '#11bd86',
    fontWeight: '600',
  },
  planStatus: {
    fontSize: 12,
    color: '#11bd86',
    marginTop: 2,
  },
  upgradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeText: {
    fontSize: 16,
    color: '#11bd86',
    fontWeight: '600',
  },
  planFeatures: {
    marginTop: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  upgradeBannerText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'transparent',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { usePremium } from '@/hooks/usePremium';
import { Crown, Check, X, Loader, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';

export default function PremiumScreen() {
  const { isLoading, error, isPremium, currentTier, availableTiers } = usePremium();
  const router = useRouter();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Loader size={32} color="#11bd86" />
        <Text style={styles.loadingText}>{t('common', 'loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee' }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay}>
          <Crown size={48} color="#FFD700" />
          <Text style={styles.headerTitle}>{t('premium', 'title')}</Text>
          <Text style={styles.headerSubtitle}>
            {isPremium 
              ? `${t('premium', 'currentPlan')}: ${currentTier?.name}`
              : t('premium', 'description')}
          </Text>
        </View>
      </View>

      <View style={styles.tiersContainer}>
        {availableTiers.map((tier) => (
          <View 
            key={tier.id} 
            style={[
              styles.tierCard,
              currentTier?.id === tier.id && styles.currentTierCard
            ]}
          >
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierPrice}>
                ${tier.price}
                <Text style={styles.tierDuration}>/{tier.duration_days} days</Text>
              </Text>
            </View>

            <Text style={styles.tierDescription}>{tier.description}</Text>

            <View style={styles.featuresContainer}>
              {Object.entries(tier.features).map(([key, enabled]) => (
                <View key={key} style={styles.featureItem}>
                  {enabled ? (
                    <Check size={20} color="#11bd86" />
                  ) : (
                    <X size={20} color="#ff3b30" />
                  )}
                  <Text style={[
                    styles.featureText,
                    !enabled && styles.featureTextDisabled
                  ]}>
                    {t('premium', 'features', key as keyof typeof tier.features)}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.subscribeButton,
                currentTier?.id === tier.id && styles.currentTierButton
              ]}
              disabled={currentTier?.id === tier.id}
            >
              <Text style={[
                styles.subscribeButtonText,
                currentTier?.id === tier.id && styles.currentTierButtonText
              ]}>
                {currentTier?.id === tier.id 
                  ? t('premium', 'currentPlan')
                  : t('premium', 'subscribe')
                }
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  tiersContainer: {
    padding: 16,
  },
  tierCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentTierCard: {
    borderColor: '#11bd86',
    borderWidth: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#11bd86',
  },
  tierDuration: {
    fontSize: 14,
    color: '#666',
  },
  tierDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  featureTextDisabled: {
    color: '#999',
  },
  subscribeButton: {
    backgroundColor: '#11bd86',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  currentTierButton: {
    backgroundColor: '#f5f5f5',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentTierButtonText: {
    color: '#11bd86',
  },
});
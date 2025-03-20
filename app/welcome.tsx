import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Check, ChevronRight, MapPin, Mic, Globe as Globe2, Wifi, Headphones as HeadphonesIcon } from 'lucide-react-native';
import { usePremium } from '@/hooks/usePremium';
import { useTranslation } from '@/hooks/useTranslation';

export default function WelcomePage() {
  const router = useRouter();
  const { availableTiers, isLoading } = usePremium();
  const { t } = useTranslation();

  const handleContinue = async () => {
    try {
      // Update user metadata to mark welcome page as seen
      const { error } = await supabase.auth.updateUser({
        data: { has_seen_welcome: true }
      });

      if (error) {
        console.error('Error updating user metadata:', error);
        Alert.alert(
          'Error',
          'Failed to update user preferences. Please try again.'
        );
        return;
      }
      
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error in handleContinue:', err);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#11bd86" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800' }}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome to Tuggi</Text>
            <Text style={styles.subtitle}>
              Choose the plan that best fits your travel style
            </Text>
          </View>

          <View style={styles.plansContainer}>
            {availableTiers.map((tier, index) => (
              <View 
                key={tier.id}
                style={[
                  styles.planCard,
                  tier.price > 0 && styles.premiumCard
                ]}
              >
                {tier.price > 0 && (
                  <View style={styles.premiumBadge}>
                    <Crown size={16} color="#FFD700" />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                )}

                <Text style={[
                  styles.planName,
                  tier.price > 0 && styles.premiumPlanName
                ]}>
                  {tier.name}
                </Text>

                <Text style={styles.planDescription}>
                  {tier.description}
                </Text>

                {tier.price > 0 ? (
                  <View style={styles.priceContainer}>
                    <Text style={styles.currency}>R$</Text>
                    <Text style={styles.price}>{tier.price.toFixed(2)}</Text>
                    <Text style={styles.period}>/month</Text>
                  </View>
                ) : (
                  <Text style={styles.freeText}>Free Forever</Text>
                )}

                <View style={styles.featuresContainer}>
                  {Object.entries(tier.features).map(([key, enabled]) => (
                    <View key={key} style={styles.featureRow}>
                      {enabled ? (
                        <View style={styles.featureIconEnabled}>
                          <Check size={16} color="#11bd86" />
                        </View>
                      ) : (
                        <View style={styles.featureIconDisabled}>
                          <Check size={16} color="#999" />
                        </View>
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
              </View>
            ))}
          </View>

          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Why Go Premium?</Text>
            
            <View style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Mic size={24} color="#11bd86" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Unlimited Audio Guides</Text>
                <Text style={styles.benefitDescription}>
                  Access professional audio guides for all attractions in your preferred language
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Globe2 size={24} color="#11bd86" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Multiple Languages</Text>
                <Text style={styles.benefitDescription}>
                  Choose from a wide range of languages for your audio guides
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Wifi size={24} color="#11bd86" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Offline Access</Text>
                <Text style={styles.benefitDescription}>
                  Download guides for offline use while traveling
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <MapPin size={24} color="#11bd86" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Extended Range</Text>
                <Text style={styles.benefitDescription}>
                  Discover more attractions with an extended search radius
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue with Free Plan</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.footerText}>
            You can upgrade to Premium anytime
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  plansContainer: {
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
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
  premiumCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  premiumBadgeText: {
    color: '#FFD700',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  premiumPlanName: {
    color: '#fff',
  },
  planDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  currency: {
    fontSize: 20,
    color: '#11bd86',
    fontWeight: '600',
  },
  price: {
    fontSize: 36,
    color: '#11bd86',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  freeText: {
    fontSize: 24,
    color: '#11bd86',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconEnabled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 189, 134, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconDisabled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  featureTextDisabled: {
    color: '#999',
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(17, 189, 134, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  continueButton: {
    backgroundColor: '#11bd86',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});
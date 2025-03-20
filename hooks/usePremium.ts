import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PremiumFeatures {
  audioGuides: boolean;
  offlineAccess: boolean;
  customVoices: boolean;
  extendedRange: boolean;
  prioritySupport: boolean;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: PremiumFeatures;
}

interface FeatureLimit {
  feature_name: string;
  monthly_limit: number | null;
  is_enabled: boolean;
}

// Default free features with strict limits
const FREE_FEATURES: PremiumFeatures = {
  audioGuides: false,
  offlineAccess: false,
  customVoices: false,
  extendedRange: false,
  prioritySupport: false,
};

// Feature name mapping between database and UI
const FEATURE_NAME_MAP: Record<string, keyof PremiumFeatures> = {
  'audio_guides': 'audioGuides',
  'offline_access': 'offlineAccess',
  'custom_voices': 'customVoices',
  'extended_range': 'extendedRange',
  'priority_support': 'prioritySupport',
};

// Feature limits for free tier
const FREE_LIMITS: Record<keyof PremiumFeatures, number | null> = {
  audioGuides: 5,
  offlineAccess: 0,
  customVoices: 0,
  extendedRange: 0,
  prioritySupport: 0,
};

// Daily usage reset time (midnight UTC)
const USAGE_RESET_TIME = {
  HOURS: 0,
  MINUTES: 0,
  SECONDS: 0,
  MILLISECONDS: 0,
};

export function usePremium() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [availableTiers, setAvailableTiers] = useState<SubscriptionTier[]>([]);
  const [featureLimits, setFeatureLimits] = useState<Record<string, number | null>>(FREE_LIMITS);

  // Convert feature limits from database to PremiumFeatures object
  const mapFeatureLimits = (limits: FeatureLimit[]): PremiumFeatures => {
    const features = { ...FREE_FEATURES };

    limits.forEach(limit => {
      const featureKey = FEATURE_NAME_MAP[limit.feature_name];
      if (featureKey) {
        features[featureKey] = limit.is_enabled;
      }
    });

    return features;
  };

  useEffect(() => {
    let mounted = true;

    const fetchSubscriptionData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          // Set free tier for unauthenticated users
          const { data: freeTier } = await supabase
            .from('subscription_tiers')
            .select(`
              id,
              name,
              description,
              price,
              duration_days,
              feature_limits (
                feature_name,
                monthly_limit,
                is_enabled
              )
            `)
            .eq('name', 'Free')
            .single();

          if (mounted) {
            if (freeTier) {
              setCurrentTier({
                id: freeTier.id,
                name: freeTier.name,
                description: freeTier.description,
                price: freeTier.price,
                duration_days: freeTier.duration_days,
                features: mapFeatureLimits(freeTier.feature_limits)
              });
            }
            setFeatureLimits(FREE_LIMITS);
          }
          return;
        }

        // Get active subscription with feature limits
        const { data: userSubscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            tier:tier_id (
              id,
              name,
              description,
              price,
              duration_days,
              feature_limits (
                feature_name,
                monthly_limit,
                is_enabled
              )
            )
          `)
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .lte('starts_at', 'now()')
          .gte('expires_at', 'now()')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get all available tiers with feature limits
        const { data: tiers, error: tiersError } = await supabase
          .from('subscription_tiers')
          .select(`
            id,
            name,
            description,
            price,
            duration_days,
            feature_limits (
              feature_name,
              monthly_limit,
              is_enabled
            )
          `)
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (tiersError) throw tiersError;

        if (mounted) {
          // Transform tiers data
          const transformedTiers = tiers.map(tier => ({
            id: tier.id,
            name: tier.name,
            description: tier.description,
            price: tier.price,
            duration_days: tier.duration_days,
            features: mapFeatureLimits(tier.feature_limits),
          }));

          setAvailableTiers(transformedTiers);

          // Set current tier and limits
          if (userSubscription?.tier) {
            const currentTierData = {
              id: userSubscription.tier.id,
              name: userSubscription.tier.name,
              description: userSubscription.tier.description,
              price: userSubscription.tier.price,
              duration_days: userSubscription.tier.duration_days,
              features: mapFeatureLimits(userSubscription.tier.feature_limits),
            };
            setCurrentTier(currentTierData);

            // Set feature limits from subscription
            const limits: Record<string, number | null> = {};
            userSubscription.tier.feature_limits.forEach(limit => {
              const featureKey = FEATURE_NAME_MAP[limit.feature_name];
              if (featureKey) {
                limits[featureKey] = limit.monthly_limit;
              }
            });
            setFeatureLimits(limits);
          } else {
            // Set free tier
            const freeTier = transformedTiers.find(t => t.price === 0);
            setCurrentTier(freeTier || null);
            setFeatureLimits(FREE_LIMITS);
          }
        }
      } catch (err) {
        console.error('Subscription error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
          // Set to free tier on error
          const freeTier = availableTiers.find(t => t.price === 0);
          setCurrentTier(freeTier || null);
          setFeatureLimits(FREE_LIMITS);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSubscriptionData();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchSubscriptionData();
      }
    });

    // Set up realtime subscription changes listener
    const realtimeSub = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        () => {
          fetchSubscriptionData();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      realtimeSub.unsubscribe();
    };
  }, []);

  // Check if user has premium access (any paid tier)
  const isPremium = Boolean(currentTier && currentTier.price > 0);
  
  // Check if a specific feature is available
  const hasFeature = (featureName: keyof PremiumFeatures): boolean => {
    // If user has no tier, use free features
    if (!currentTier) return FREE_FEATURES[featureName];

    // For premium users, check tier features
    if (isPremium) return currentTier.features[featureName];

    // For free users, check free features
    return FREE_FEATURES[featureName];
  };

  // Get feature usage limit
  const getFeatureLimit = (featureName: keyof PremiumFeatures): number | null => {
    // Premium users get limits from their tier
    if (isPremium && currentTier) {
      return featureLimits[featureName] ?? null;
    }

    // Free users get limits from FREE_LIMITS
    return FREE_LIMITS[featureName];
  };

  // Get the start of the current usage period
  const getCurrentPeriodStart = (): Date => {
    const now = new Date();
    const start = new Date(now);
    
    start.setUTCHours(USAGE_RESET_TIME.HOURS);
    start.setUTCMinutes(USAGE_RESET_TIME.MINUTES);
    start.setUTCSeconds(USAGE_RESET_TIME.SECONDS);
    start.setUTCMilliseconds(USAGE_RESET_TIME.MILLISECONDS);

    // If current time is before reset time, use previous day
    if (now < start) {
      start.setUTCDate(start.getUTCDate() - 1);
    }

    return start;
  };

  // Check if user has remaining usage for a feature
  const checkFeatureUsage = async (featureName: keyof PremiumFeatures): Promise<boolean> => {
    try {
      // Get feature limit
      const limit = getFeatureLimit(featureName);

      // No limit means unlimited usage
      if (limit === null) return true;

      // Zero limit means feature is disabled
      if (limit === 0) return false;

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      // Get usage since period start
      const periodStart = getCurrentPeriodStart();

      const { data: usage, error } = await supabase
        .from('feature_usage')
        .select('usage_count')
        .eq('user_id', session.user.id)
        .eq('feature_name', FEATURE_NAME_MAP[featureName])
        .gte('created_at', periodStart.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Return true if usage is under limit
      return !usage || usage.usage_count < limit;
    } catch (err) {
      console.error('Error checking feature usage:', err);
      return false;
    }
  };

  // Increment feature usage count
  const incrementFeatureUsage = async (featureName: keyof PremiumFeatures): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const dbFeatureName = FEATURE_NAME_MAP[featureName];
      if (!dbFeatureName) return;

      const periodStart = getCurrentPeriodStart();

      // Get current usage for this period
      const { data: existing, error: existingError } = await supabase
        .from('feature_usage')
        .select('id, usage_count')
        .eq('user_id', session.user.id)
        .eq('feature_name', dbFeatureName)
        .gte('created_at', periodStart.toISOString())
        .single();

      if (existingError && existingError.code !== 'PGRST116') throw existingError;

      if (existing) {
        // Update existing usage record
        await supabase
          .from('feature_usage')
          .update({ 
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new usage record
        await supabase
          .from('feature_usage')
          .insert({
            user_id: session.user.id,
            feature_name: dbFeatureName,
            usage_count: 1,
            last_used_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error('Error incrementing feature usage:', err);
    }
  };

  return {
    isLoading,
    error,
    isPremium,
    currentTier,
    availableTiers,
    hasFeature,
    getFeatureLimit,
    checkFeatureUsage,
    incrementFeatureUsage,
  };
}
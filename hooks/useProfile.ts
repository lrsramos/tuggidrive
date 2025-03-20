import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  nickname?: string;
  country?: string;
  language: string;
  notifications_enabled: boolean;
  notification_types: {
    tour_updates: boolean;
    new_places: boolean;
    special_offers: boolean;
  };
  voice_preference: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      // Get current user without throwing error
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // No user is signed in - this is a valid state
        setProfile(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      // Get user's email from auth
      const email = session.user.email;

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it with defaults
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email,
              username: session.user.user_metadata.username,
              language: 'en',
              notifications_enabled: true,
              notification_types: {
                tour_updates: true,
                new_places: true,
                special_offers: true
              },
              voice_preference: 'en-US'
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile({ ...newProfile, email });
        } else {
          throw profileError;
        }
      } else {
        // Profile exists, update it with email if needed
        setProfile({ ...profileData, email });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profile on mount and auth state changes
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN') {
        fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setError(null);
      }
    });

    // Initial fetch only if there's an active session
    supabase.auth.getSession().then(({ data: { session }}) => {
      if (mounted && session) {
        fetchProfile();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Set up realtime subscription for profile changes only when authenticated
  useEffect(() => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.id, fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update profile'
      };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile
  };
}
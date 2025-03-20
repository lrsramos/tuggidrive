import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const segments = useSegments();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check session on mount
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setSession(currentSession);
        
        const inAuthGroup = segments[0] === '(auth)';
        const isIndexPage = segments.length === 0;
        
        if (!currentSession) {
          if (isIndexPage || !inAuthGroup) {
            router.replace('/login');
          }
        } else {
          // Check if this is first login
          const isFirstLogin = !currentSession.user.user_metadata.has_seen_welcome;
          
          if (isFirstLogin) {
            router.replace('/welcome');
          } else if (inAuthGroup) {
            router.replace('/(tabs)/pois');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          router.replace('/login');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);
      const inAuthGroup = segments[0] === '(auth)';
      const isIndexPage = segments.length === 0;
      
      if (!session) {
        if (isIndexPage || !inAuthGroup) {
          router.replace('/login');
        }
      } else {
        // Check if this is first login
        const isFirstLogin = !session.user.user_metadata.has_seen_welcome;
        
        if (isFirstLogin) {
          router.replace('/welcome');
        } else if (inAuthGroup) {
          router.replace('/(tabs)/pois');
        }
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [segments]);

  return { isLoading, session };
}
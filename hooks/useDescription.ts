import { useState, useCallback } from 'react';
import { generateDescription } from '@/lib/openai';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { useTTS } from '@/hooks/useTTS';
import { usePremium } from '@/hooks/usePremium';

export function useDescription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();
  const { currentLanguage } = useTTS();
  const { isPremium } = usePremium();

  const incrementPlayCount = useCallback(async (descriptionId: string) => {
    // Only increment play count for premium users
    if (!isPremium) return;

    try {
      const { data: description, error: fetchError } = await supabase
        .from('attraction_descriptions')
        .select('play_count')
        .eq('id', descriptionId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('attraction_descriptions')
        .update({ 
          play_count: (description?.play_count || 0) + 1,
          last_played_at: new Date().toISOString()
        })
        .eq('id', descriptionId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error incrementing play count:', err);
    }
  }, [isPremium]);

  const getDescription = useCallback(async (
    attractionId: string, 
    name: string, 
    city?: string, 
    country?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Get language code without region (e.g., 'en' from 'en-US')
      const languageCode = currentLanguage;

      // Check for existing description in the current language
      const { data: existingDescription, error: fetchError } = await supabase
        .from('attraction_descriptions')
        .select('*')
        .eq('attraction_id', attractionId)
        .eq('language', languageCode)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Return existing description if found
      if (existingDescription?.description) {
        // Only increment play count for premium users
        if (isPremium) {
          incrementPlayCount(existingDescription.id);
        }
        return existingDescription.description;
      }

      // For free users, if no description exists, try to find one in English
      if (!isPremium) {
        const { data: englishDescription, error: englishError } = await supabase
          .from('attraction_descriptions')
          .select('*')
          .eq('attraction_id', attractionId)
          .eq('language', 'en')
          .single();

        if (!englishError && englishDescription?.description) {
          return englishDescription.description;
        }

        // If no description exists, get the default description from attractions table
        const { data: attraction, error: attractionError } = await supabase
          .from('attractions')
          .select('description')
          .eq('id', attractionId)
          .single();

        if (!attractionError && attraction?.description) {
          return attraction.description;
        }

        // If no description exists at all, return a generic message
        return `${name} is a tourist attraction${city ? ` in ${city}`: ''}.`;
      }

      // Generate new description for premium users only
      const description = await generateDescription({
        name,
        city,
        country,
        targetLanguage: languageCode
      });

      if (!description) {
        throw new Error('Failed to generate description');
      }

      // Cache the new description
      const { data: newDescription, error: insertError } = await supabase
        .from('attraction_descriptions')
        .insert({
          attraction_id: attractionId,
          language: languageCode,
          description,
          play_count: 1,
          last_played_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error caching description:', insertError);
      }

      return description;
    } catch (err) {
      console.error('Error in getDescription:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate description');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentLanguage, incrementPlayCount, isPremium]);

  return {
    getDescription,
    loading,
    error
  };
}
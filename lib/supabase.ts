// Polyfill URL for web
if (typeof URL === 'undefined') {
  require('react-native-url-polyfill/auto');
}

import { createClient } from '@supabase/supabase-js';
import { storage } from './secureStore';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
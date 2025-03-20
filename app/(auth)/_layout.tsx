import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuth();

  // If user is authenticated, redirect to the welcome page on first login
  if (session) {
    // Check if this is the first login
    const isFirstLogin = !session.user.user_metadata.has_seen_welcome;
    
    if (isFirstLogin) {
      return <Redirect href="/welcome" />;
    }
    
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      gestureEnabled: false,
    }} />
  );
}
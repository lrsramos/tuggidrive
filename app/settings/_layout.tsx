import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: {
        backgroundColor: '#f5f5f5',
      },
    }}>
      <Stack.Screen name="premium" />
    </Stack>
  );
}
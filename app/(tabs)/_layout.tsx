import { Tabs } from 'expo-router';
import { List, Settings, Map } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTitleStyle: {
          color: '#fff',
        },
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#11bd86',
        tabBarInactiveTintColor: '#888',
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation', 'explore'),
          tabBarIcon: ({ size, color }) => (
            <List size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('navigation', 'map'),
          tabBarIcon: ({ size, color }) => (
            <Map size={size} color={color} />
          ),
          href: Platform.OS !== 'web' ? undefined : null, // Hide on web
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation', 'settings'),
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
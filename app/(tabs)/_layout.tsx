import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 22, fontWeight: '800' }}>J</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Presencas',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20, fontWeight: '800' }}>P</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="contents"
        options={{
          title: 'Conteudos',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20, fontWeight: '800' }}>C</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Comunicados',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20, fontWeight: '800' }}>M</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20, fontWeight: '800' }}>U</Text>
          ),
        }}
      />
    </Tabs>
  );
}

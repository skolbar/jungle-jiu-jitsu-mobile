import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarStyle: {
          height: 70,
          borderTopColor: '#242424',
          backgroundColor: '#151515',
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarItemStyle: {
          minWidth: 0,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Painel' : 'Inicio',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{isAdmin ? 'D' : 'J'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: isAdmin ? 'Alunos' : 'Presencas',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{isAdmin ? 'A' : 'P'}</Text>
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
          title: 'Avisos',
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

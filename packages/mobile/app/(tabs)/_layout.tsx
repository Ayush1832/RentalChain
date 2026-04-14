import { Tabs, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/colors';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <TouchableOpacity style={{ opacity: focused ? 1 : 0.5 }}>
      {/* Using text emoji as icon — replace with expo/vector-icons in production */}
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <TouchableOpacity style={{ fontSize: focused ? 26 : 22 } as any}>
        {/* React Native doesn't support fontSize on View; use Text */}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { user } = useAuthStore();
  const isLandlord = user?.role === 'LANDLORD' || user?.role === 'BOTH';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: { borderTopColor: Colors.gray[200], paddingBottom: 4 },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="properties/index"
        options={{
          title: 'Properties',
          tabBarLabel: 'Properties',
          tabBarIcon: ({ color }) => <TabBarIcon name="🏢" color={color} />,
        }}
      />
      <Tabs.Screen
        name="agreements/index"
        options={{
          title: 'Agreements',
          tabBarLabel: 'Agreements',
          tabBarIcon: ({ color }) => <TabBarIcon name="📄" color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments/index"
        options={{
          title: 'Payments',
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color }) => <TabBarIcon name="💳" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="👤" color={color} />,
        }}
      />

      {/* Hidden screens (accessible via navigation, not tabs) */}
      <Tabs.Screen name="properties/[id]" options={{ href: null, title: 'Property' }} />
      <Tabs.Screen name="properties/new" options={{ href: null, title: 'New Property' }} />
      <Tabs.Screen name="agreements/[id]" options={{ href: null, title: 'Agreement' }} />
      <Tabs.Screen name="agreements/new" options={{ href: null, title: 'New Agreement' }} />
      <Tabs.Screen name="payments/new" options={{ href: null, title: 'Record Payment' }} />
      <Tabs.Screen name="evidence/upload" options={{ href: null, title: 'Upload Evidence' }} />
      <Tabs.Screen name="evidence/[id]" options={{ href: null, title: 'Evidence' }} />
      <Tabs.Screen name="maintenance/index" options={{ href: null, title: 'Maintenance' }} />
      <Tabs.Screen name="disputes/index" options={{ href: null, title: 'Disputes' }} />
      <Tabs.Screen name="disputes/[id]" options={{ href: null, title: 'Dispute' }} />
      <Tabs.Screen name="disputes/new" options={{ href: null, title: 'Raise Dispute' }} />
      <Tabs.Screen name="profile/kyc" options={{ href: null, title: 'KYC Verification' }} />
    </Tabs>
  );
}

function TabBarIcon({ name, color }: { name: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, color }}>{name}</Text>;
}

import { Pressable, Text } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0d1219' },
          headerTintColor: '#f3f5f8',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#0d1219' },
          headerLeft: () => (
            <Pressable
              testID="mobile-route-back"
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={10}
              onPress={() => router.back()}
              style={{ paddingVertical: 6, paddingRight: 12 }}
            >
              <Text style={{ color: '#aeb8ff', fontSize: 15, fontWeight: '800' }}>Back</Text>
            </Pressable>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="intake" options={{ title: 'Device check-in' }} />
        <Stack.Screen name="scan" options={{ title: 'Scan device label' }} />
        <Stack.Screen name="case/[id]" options={{ title: 'Repair case' }} />
        <Stack.Screen name="case/[id]/evidence" options={{ title: 'Capture evidence' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

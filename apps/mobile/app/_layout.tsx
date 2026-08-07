import { Stack } from 'expo-router';
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

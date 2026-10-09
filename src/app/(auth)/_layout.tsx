import { Stack } from 'expo-router';

import { C } from '@/constants/theme';

// Open on the login page when you land in this group.
export const unstable_settings = { initialRouteName: 'login' };

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" options={{ animation: 'fade' }} />
    </Stack>
  );
}

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { C } from '@/constants/theme';
import { useReminderSync } from '@/hooks/use-reminder-sync';
import { configureNotifications } from '@/lib/reminders';
import { useApp } from '@/stores/app-store';

SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, text: C.text, border: C.border, primary: C.accent },
};

export default function RootLayout() {
  const hydrated = useApp((s) => s.hydrated);
  const onboarded = useApp((s) => s.profile.onboarded);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;
  return <AppStack onboarded={onboarded} />;
}

function AppStack({ onboarded }: { onboarded: boolean }) {
  useReminderSync();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
            headerStyle: { backgroundColor: C.bg },
            headerTintColor: C.text,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
          }}>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="exercise/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="exercise/edit" options={{ headerShown: true }} />
            <Stack.Screen name="workout/active" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="workout/add" options={{ presentation: 'modal' }} />
            <Stack.Screen name="body" options={{ headerShown: true }} />
            <Stack.Screen
              name="workout/summary"
              options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
            />
          </Stack.Protected>
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

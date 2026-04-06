import { useEffect, useState, Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initDatabase } from '../lib/database';
import { colors } from '../theme/colors';

const DB_NAME = 'devgrowth.db';

function useOnboardingGuard() {
  const db = useSQLiteContext();
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  // Re-check DB whenever navigation changes (catches post-onboarding state)
  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<{ onboarding_complete: number }>(
          'SELECT onboarding_complete FROM user_profile WHERE id = 1'
        );
        setOnboarded(row?.onboarding_complete === 1);
      } catch {
        setOnboarded(false);
      }
      setChecked(true);
    })();
  }, [db, segments]);

  useEffect(() => {
    if (!checked) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboarded && inOnboarding) {
      router.replace('/(tabs)/today');
    }
  }, [checked, onboarded, segments]);

  return checked;
}

function AppLayout() {
  useOnboardingGuard();

  return (
    <Stack
      initialRouteName="(tabs)"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="entry" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="onboarding"
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Suspense
        fallback={
          <View style={styles.loading}>
            <ActivityIndicator color={colors.teal} />
          </View>
        }
      >
        <SQLiteProvider databaseName={DB_NAME} onInit={initDatabase}>
          <AppLayout />
        </SQLiteProvider>
      </Suspense>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

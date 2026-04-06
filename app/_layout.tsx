import { Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { initDatabase } from '../lib/database';
import { colors } from '../theme/colors';

const DB_NAME = 'devgrowth.db';

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
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="entry" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="onboarding"
              options={{ gestureEnabled: false, animation: 'fade' }}
            />
          </Stack>
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

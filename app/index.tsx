import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../theme/colors';

export default function Index() {
  const db = useSQLiteContext();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<{ onboarding_complete: number }>(
          'SELECT onboarding_complete FROM user_profile WHERE id = 1'
        );
        if (row?.onboarding_complete === 1) {
          router.replace('/(tabs)/today');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
    })();
  }, [db, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.teal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

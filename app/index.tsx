import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Index() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      const row = await db.getFirstAsync<{ onboarding_complete: number }>(
        'SELECT onboarding_complete FROM user_profile WHERE id = 1'
      );
      setOnboarded(row?.onboarding_complete === 1);
      setLoading(false);
    })();
  }, [db]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

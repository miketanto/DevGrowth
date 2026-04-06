import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DevGrowth</Text>
      <Text style={styles.subtitle}>Ready to build.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B11',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#2DD4BF',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 8,
  },
});

import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Journey" subtitle="Your growth timeline" />
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    color: colors.textDim,
  },
});

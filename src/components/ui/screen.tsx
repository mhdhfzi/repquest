import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui/text';
import { C, S } from '@/constants/theme';

/** Tab screen scaffold: large title, safe-area padding, room for the tab bar. */
export function Screen({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + S.lg, paddingBottom: insets.bottom + 120, paddingHorizontal: S.page }}>
      {title ? (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerText}>
            {subtitle ? <Txt variant="caption">{subtitle}</Txt> : null}
            <Txt variant="display">{title}</Txt>
          </View>
          {right}
        </Animated.View>
      ) : null}
      {children}
    </ScrollView>
  );
}

/** Staggered entrance used for list items and cards. */
export function Appear({ index = 0, children }: { index?: number; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 50).duration(420).springify().damping(18)}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: S.xl },
  headerText: { flex: 1, gap: 2 },
});

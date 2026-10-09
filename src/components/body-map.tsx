import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Body, { type ExtendedBodyPart } from 'react-native-body-highlighter';

import { Txt } from '@/components/ui/text';
import { C, S } from '@/constants/theme';
import { useT } from '@/i18n';

export const PRIMARY_SECONDARY = [C.accentDim, C.accent];

// Head and hair blend into the silhouette so only muscles draw the eye.
const NEUTRAL: ExtendedBodyPart[] = [
  { slug: 'head', styles: { fill: C.bodyBase } },
  { slug: 'hair', styles: { fill: '#1E2127' } },
];

/** Front and back body side by side. `colors[intensity - 1]` fills each part. */
export const BodyMap = memo(function BodyMap({
  data,
  colors = PRIMARY_SECONDARY,
  scale = 0.62,
  onPress,
  labels = true,
}: {
  data: ExtendedBodyPart[];
  colors?: string[];
  scale?: number;
  onPress?: (part: ExtendedBodyPart) => void;
  labels?: boolean;
}) {
  const { t } = useT();
  return (
    <View style={styles.row}>
      {(['front', 'back'] as const).map((side) => (
        <View key={side} style={styles.side}>
          <Body
            data={[...NEUTRAL, ...data]}
            side={side}
            scale={scale}
            colors={colors}
            defaultFill={C.bodyBase}
            defaultStroke={C.bg}
            defaultStrokeWidth={1}
            border={C.borderStrong}
            onBodyPartPress={onPress ? (p) => onPress(p) : undefined}
          />
          {labels ? <Txt variant="label" color={C.textFaint}>{t(side === 'front' ? 'map.front' : 'map.back')}</Txt> : null}
        </View>
      ))}
    </View>
  );
});

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((i) => (
        <View key={i.label} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: i.color }]} />
          <Txt variant="caption">{i.label}</Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: S.lg },
  side: { alignItems: 'center', gap: S.xs },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: S.lg, marginTop: S.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

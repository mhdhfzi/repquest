import { StyleSheet, View } from 'react-native';

import { ExerciseThumb } from '@/components/exercise-media';
import { Icon, I } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { equipLabel, muscleLabel } from '@/i18n/labels';
import type { Exercise } from '@/types';

export function ExerciseRow({
  exercise,
  onPress,
  favorite,
  trailing,
  meta,
}: {
  exercise: Exercise;
  onPress?: () => void;
  favorite?: boolean;
  trailing?: 'chevron' | 'add';
  meta?: string;
}) {
  const { t } = useT();
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={styles.row} accessibilityRole="button">
      <ExerciseThumb id={exercise.id} />
      <View style={styles.text}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {exercise.name}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {meta ??
            [muscleLabel(t, exercise.group), equipLabel(t, exercise.equipment), exercise.custom ? t('library.custom') : null]
              .filter(Boolean)
              .join(' · ')}
        </Txt>
      </View>
      {favorite ? <Icon name={I.starFill} size={14} color={C.flame} /> : null}
      {trailing === 'add' ? (
        <View style={styles.add}>
          <Icon name={I.plus} size={16} color={C.onAccent} />
        </View>
      ) : (
        <Icon name={I.chevronRight} size={14} color={C.textFaint} />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.sm,
    paddingRight: S.md,
    borderRadius: R.md,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  text: { flex: 1, gap: 2 },
  add: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
});

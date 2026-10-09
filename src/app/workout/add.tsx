import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ExerciseBrowser } from '@/components/exercise-browser';
import { I } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/primitives';
import { tap } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { useT } from '@/i18n';
import { getExercise } from '@/lib/exercises';
import { useApp } from '@/stores/app-store';

/**
 * Exercise picker. Adds to the running workout by default; with `plan` it edits
 * a saved split-day list instead, appending or (with `replace`) swapping one exercise.
 */
export default function AddExercise() {
  const { t } = useT();
  const { plan, replace } = useLocalSearchParams<{ plan?: string; replace?: string }>();
  const addExercise = useApp((s) => s.addExercise);
  const setCustomPlan = useApp((s) => s.setCustomPlan);
  const planIds = useApp((s) => (plan ? s.customPlans[plan] : undefined));
  const active = useApp((s) => s.active);
  const activeIds = active?.exercises.map((e) => e.exerciseId);

  const select = (id: string) => {
    tap();
    if (plan) {
      const current = planIds ?? [];
      const next = replace ? current.map((x) => (x === replace ? id : x)) : [...current, id];
      setCustomPlan(plan, next);
    } else {
      addExercise(id);
    }
    router.back();
  };

  return (
    <ExerciseBrowser
      pickMode
      topInset={false}
      initialGroup={replace ? getExercise(replace)?.group : undefined}
      exclude={plan ? planIds : activeIds}
      header={
        <View style={styles.head}>
          <Txt variant="title">{replace ? t('today.swapTitle') : t('library.add')}</Txt>
          <IconButton icon={I.close} label={t('common.close')} size={34} onPress={() => router.back()} />
        </View>
      }
      onSelect={select}
    />
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

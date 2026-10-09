import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BodyMap } from '@/components/body-map';
import { ExerciseRow } from '@/components/exercise-row';
import { Icon, I } from '@/components/ui/icon';
import { Button, Chip } from '@/components/ui/primitives';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { ALL_EQUIPMENT, MUSCLE_GROUPS, SLUG_TO_GROUP } from '@/constants/muscles';
import { C, R, S } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useT } from '@/i18n';
import { equipLabel, muscleLabel } from '@/i18n/labels';
import { bodyDataForGroups } from '@/lib/exercises';
import { useApp } from '@/stores/app-store';
import type { MuscleGroupId } from '@/types';

export function ExerciseBrowser({
  header,
  onSelect,
  pickMode,
  topInset = true,
  initialGroup,
  exclude,
}: {
  header?: ReactNode;
  onSelect: (id: string) => void;
  pickMode?: boolean;
  topInset?: boolean;
  /** Start filtered to this muscle group (e.g. when swapping a chest exercise). */
  initialGroup?: MuscleGroupId;
  /** Hide these exercises (already in the list being edited). */
  exclude?: string[];
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const favorites = useApp((s) => s.favorites);
  const customExercises = useApp((s) => s.customExercises);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroupId | 'all' | 'fav' | 'custom'>(initialGroup ?? 'all');
  const [equip, setEquip] = useState<string | null>(null);
  const [showBody, setShowBody] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const yours = customExercises.filter((e) => !e.archived);
    return [...yours, ...EXERCISES].filter(
      (e) =>
        (group === 'all' ||
          (group === 'fav' ? favorites.includes(e.id) : group === 'custom' ? e.custom : e.group === group)) &&
        (!equip || e.equipment === equip) &&
        (!q || e.name.toLowerCase().includes(q)) &&
        !exclude?.includes(e.id),
    );
  }, [query, group, equip, favorites, exclude, customExercises]);
  const total = EXERCISES.length + customExercises.filter((e) => !e.archived).length;

  const listHeader = (
    <View style={styles.headerWrap}>
      {header}
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Icon name={I.search} size={16} color={C.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('library.search', { n: total })}
            placeholderTextColor={C.textFaint}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query ? (
            <PressableScale onPress={() => setQuery('')} hitSlop={8} accessibilityLabel={t('library.clear')}>
              <Icon name={I.close} size={14} color={C.textMuted} />
            </PressableScale>
          ) : null}
        </View>
        <PressableScale
          haptic
          onPress={() => setShowBody((v) => !v)}
          style={[styles.bodyToggle, showBody && styles.bodyToggleOn]}
          accessibilityLabel={t('library.bodyMap')}>
          <Icon name={I.body} size={18} color={showBody ? C.onAccent : C.text} />
        </PressableScale>
      </View>

      <Button title={t('library.new')} kind="secondary" small icon={I.plus} onPress={() => router.push('/exercise/edit')} />

      {showBody ? (
        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} style={styles.bodyCard}>
          <Txt variant="caption" center>
            {t('library.tapMuscle')}
          </Txt>
          <BodyMap
            data={group !== 'all' && group !== 'fav' && group !== 'custom' ? bodyDataForGroups([group]) : []}
            scale={0.52}
            onPress={(p) => {
              const g = p.slug ? SLUG_TO_GROUP[p.slug] : undefined;
              if (g) setGroup(g);
            }}
          />
        </Animated.View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
        <Chip label={t('library.all')} selected={group === 'all'} onPress={() => setGroup('all')} />
        <Chip label={t('library.favourites')} icon={I.starFill} selected={group === 'fav'} onPress={() => setGroup('fav')} />
        <Chip label={t('library.custom')} icon={I.pencil} selected={group === 'custom'} onPress={() => setGroup('custom')} />
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g.id} label={muscleLabel(t, g.id)} selected={group === g.id} onPress={() => setGroup(g.id)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
        {ALL_EQUIPMENT.map((e) => (
          <PressableScale key={e} haptic onPress={() => setEquip(equip === e ? null : e)} style={[styles.equip, equip === e && styles.equipOn]}>
            <Txt variant="caption" color={equip === e ? C.accent : C.textMuted} style={styles.equipText}>
              {equipLabel(t, e)}
            </Txt>
          </PressableScale>
        ))}
      </ScrollView>
      <Txt variant="label" style={styles.count}>
        {t('library.count', { n: results.length })}
      </Txt>
    </View>
  );

  return (
    <FlatList
      style={styles.root}
      data={results}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={listHeader}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: topInset ? insets.top + S.lg : S.lg,
        paddingBottom: insets.bottom + 120,
        paddingHorizontal: S.page,
      }}
      ItemSeparatorComponent={() => <View style={{ height: S.sm }} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Txt variant="heading" center>
            {t('library.empty')}
          </Txt>
          <Txt variant="caption" center>
            {group === 'fav' ? t('library.emptyFav') : group === 'custom' ? t('library.emptyCustom') : t('library.emptyFilter')}
          </Txt>
        </View>
      }
      renderItem={({ item, index }) => (
        <Animated.View entering={index < 10 ? FadeInDown.delay(index * 35).duration(320) : undefined} layout={LinearTransition.duration(220)}>
          <ExerciseRow
            exercise={item}
            favorite={favorites.includes(item.id)}
            trailing={pickMode ? 'add' : 'chevron'}
            onPress={() => onSelect(item.id)}
          />
        </Animated.View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerWrap: { gap: S.md, marginBottom: S.sm },
  searchRow: { flexDirection: 'row', gap: S.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    height: 46,
    paddingHorizontal: S.md,
    borderRadius: R.md,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 15, height: '100%' },
  bodyToggle: {
    width: 46,
    height: 46,
    borderRadius: R.md,
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyToggleOn: { backgroundColor: C.accent, borderColor: C.accent },
  bodyCard: { backgroundColor: C.surface, borderRadius: R.lg, paddingVertical: S.md, gap: S.sm },
  chipScroll: { marginHorizontal: -S.page },
  chips: { gap: S.sm, paddingHorizontal: S.page },
  equip: { paddingHorizontal: 10, height: 28, justifyContent: 'center', borderRadius: 8 },
  equipOn: { backgroundColor: C.accentSoft },
  equipText: { fontWeight: '600' },
  count: { marginTop: S.xs },
  empty: { paddingVertical: 48, gap: S.xs },
});

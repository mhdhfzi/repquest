import { StyleSheet, View } from 'react-native';

import { Icon, I } from '@/components/ui/icon';
import { Card, ProgressBar } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/text';
import { C, S } from '@/constants/theme';
import { useT, type TKey } from '@/i18n';
import { questStatus } from '@/lib/quests';
import { useApp } from '@/stores/app-store';

/** Today's daily quests plus this week's quest, with live progress. XP is paid when a workout finishes. */
export function QuestCard() {
  const { t } = useT();
  const profile = useApp((s) => s.profile);
  const workouts = useApp((s) => s.workouts);
  const claimed = useApp((s) => s.questsClaimed);
  // Cheap enough to compute every render, which also rolls quests over at midnight.
  const quests = questStatus(profile, workouts);
  const doneCount = quests.filter((q) => q.done).length;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.badge}>
          <Icon name={I.target} size={18} color={C.accent} />
        </View>
        <View style={styles.flex}>
          <Txt variant="heading">{t('quests.title')}</Txt>
          <Txt variant="caption">{t('quests.summary', { done: doneCount, total: quests.length })}</Txt>
        </View>
      </View>

      {quests.map(({ quest, key, progress, done }) => (
        <View key={key} style={styles.row}>
          <View style={[styles.icon, done && styles.iconDone]}>
            <Icon name={done ? I.check : quest.icon} size={14} color={done ? C.onAccent : C.textMuted} />
          </View>
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Txt variant="bodyStrong" numberOfLines={1} style={styles.flex} color={done ? C.textMuted : C.text}>
                {t(`quest.${quest.id}` as TKey)}
              </Txt>
              <Txt variant="caption" color={claimed[key] ? C.accent : C.textMuted} style={styles.xp}>
                {claimed[key] ? t('quests.claimed') : `+${quest.xp} XP`}
              </Txt>
            </View>
            <View style={styles.progressRow}>
              <View style={styles.flex}>
                <ProgressBar progress={progress / quest.target} height={4} />
              </View>
              <Txt variant="caption" style={styles.count}>
                {quest.scope === 'week' ? t('quests.week') : ''}
                {progress.toLocaleString()}/{quest.target.toLocaleString()}
              </Txt>
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: S.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.xs },
  badge: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  icon: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  iconDone: { backgroundColor: C.accent },
  body: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  xp: { fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  count: { minWidth: 64, textAlign: 'right', fontVariant: ['tabular-nums'] },
});

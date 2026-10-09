import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { LevelBadge } from '@/components/level';
import { Icon, I } from '@/components/ui/icon';
import { Button, Card, Chip, IconButton, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { Appear, Screen } from '@/components/ui/screen';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { ALL_EQUIPMENT } from '@/constants/muscles';
import { ACHIEVEMENTS, TITLES } from '@/constants/progression';
import { SPLITS } from '@/constants/splits';
import { C, R, S } from '@/constants/theme';
import { useT, type LangPref, type TFn, type TKey } from '@/i18n';
import { equipLabel, splitName, titleLabel } from '@/i18n/labels';
import { signOut } from '@/lib/auth';
import { BackupError, exportBackup, exportSetsCsv, pickBackup } from '@/lib/backup';
import { confirm, notify } from '@/lib/confirm';
import { formatShortDate, formatTime, weekdayShort } from '@/lib/date';
import { levelInfo } from '@/lib/progression';
import { deletePhoto, pickAvatar, type PhotoSource } from '@/lib/photos';
import { remindersSupported, requestReminderPermission } from '@/lib/reminders';
import { useApp } from '@/stores/app-store';
import { useAuth } from '@/stores/auth-store';
import type { Equipment, ReminderSettings } from '@/types';

const REST_OPTIONS = [60, 90, 120, 180];
const LANGS: { id: LangPref; label?: string }[] = [{ id: 'system' }, { id: 'en', label: 'English' }, { id: 'ms', label: 'Bahasa Melayu' }];
const TIME_STEP = 30;

export default function Profile() {
  const { t } = useT();
  const profile = useApp((s) => s.profile);
  const xpTotal = useApp((s) => s.xpTotal);
  const achievements = useApp((s) => s.achievements);
  const updateProfile = useApp((s) => s.updateProfile);
  const resetAll = useApp((s) => s.resetAll);
  const bodyStats = useApp((s) => s.bodyStats);
  const info = levelInfo(xpTotal);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);

  const setAvatar = async (source: PhotoSource) => {
    const res = await pickAvatar(source);
    if (!res) return;
    if ('denied' in res) return notify(t('profile.photo'), t('body.cameraDenied'));
    deletePhoto(profile.avatarUri);
    updateProfile({ avatarUri: res.uri });
  };
  const removeAvatar = () => {
    deletePhoto(profile.avatarUri);
    updateProfile({ avatarUri: null });
  };
  const changeAvatar = () => {
    if (Platform.OS === 'web') return setAvatar('library');
    Alert.alert(t('profile.photo'), undefined, [
      { text: t('body.takePhoto'), onPress: () => setAvatar('camera') },
      { text: t('body.pickPhoto'), onPress: () => setAvatar('library') },
      ...(profile.avatarUri ? [{ text: t('profile.removePhoto'), style: 'destructive' as const, onPress: removeAvatar }] : []),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };
  const saveName = () => {
    const name = nameDraft.trim();
    if (name) updateProfile({ name });
    else setNameDraft(profile.name);
    setEditingName(false);
  };
  const reset = () =>
    confirm(t('profile.resetTitle'), t('profile.resetBody'), t('profile.resetConfirm'), () => {
      // Photos live as files outside the store, so remove them too.
      deletePhoto(profile.avatarUri);
      bodyStats.forEach((b) => deletePhoto(b.photoUri));
      resetAll();
    });

  const toggleEquip = (e: Equipment) =>
    updateProfile({
      equipment: profile.equipment.includes(e) ? profile.equipment.filter((x) => x !== e) : [...profile.equipment, e],
    });

  return (
    <Screen>
      <Appear>
        <View style={styles.hero}>
          <PressableScale haptic onPress={changeAvatar} accessibilityRole="button" accessibilityLabel={t('profile.changePhoto')}>
            <LevelBadge xp={xpTotal} size={96} avatarUri={profile.avatarUri} />
            <View style={styles.cameraBadge}>
              <Icon name={I.camera} size={13} color={C.text} />
            </View>
          </PressableScale>
          {editingName ? (
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onSubmitEditing={saveName}
              onBlur={saveName}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              maxLength={24}
              placeholder={t('profile.namePlaceholder')}
              placeholderTextColor={C.textFaint}
              style={styles.nameInput}
              accessibilityLabel={t('profile.editName')}
            />
          ) : (
            <PressableScale
              onPress={() => {
                setNameDraft(profile.name);
                setEditingName(true);
              }}
              style={styles.nameRow}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('profile.editName')}>
              <Txt variant="title">{profile.name || t('common.athlete')}</Txt>
              <Icon name={I.pencil} size={14} color={C.textMuted} />
            </PressableScale>
          )}
          <View style={styles.titlePill}>
            <Icon name={I.sparkles} size={12} color={C.accent} />
            <Txt variant="caption" color={C.accent} style={styles.bold}>
              {titleLabel(t, info.title)}
            </Txt>
          </View>
        </View>
      </Appear>

      <Appear index={1}>
        <Card style={styles.xp}>
          <View style={styles.xpRow}>
            <Txt variant="label">{t('profile.levelRange', { a: info.level, b: info.level + 1 })}</Txt>
            <Txt variant="caption">
              {info.current} / {info.needed} XP
            </Txt>
          </View>
          <ProgressBar progress={info.progress} />
          <Txt variant="caption">
            {t('profile.xpTotal', { n: xpTotal.toLocaleString() })}
            {info.nextTitle ? t('profile.nextTitle', { title: titleLabel(t, info.nextTitle.name), n: info.nextTitle.level }) : ''}
          </Txt>
        </Card>
      </Appear>

      <SectionHeader title={t('profile.titles')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.titles}>
        {TITLES.map((title) => {
          const unlocked = info.level >= title.level;
          const current = title.name === info.title;
          return (
            <View key={title.name} style={[styles.titleCard, unlocked && styles.titleUnlocked, current && styles.titleCurrent]}>
              <Icon name={unlocked ? I.sparkles : I.lock} size={14} color={current ? C.onAccent : unlocked ? C.accent : C.textFaint} />
              <Txt variant="bodyStrong" color={current ? C.onAccent : unlocked ? C.text : C.textFaint} numberOfLines={1}>
                {titleLabel(t, title.name)}
              </Txt>
              <Txt variant="caption" color={current ? C.onAccent : C.textFaint}>
                {t('common.level', { n: title.level })}
              </Txt>
            </View>
          );
        })}
      </ScrollView>

      <SectionHeader title={t('profile.achievements', { a: Object.keys(achievements).length, b: ACHIEVEMENTS.length })} />
      <View style={styles.grid}>
        {ACHIEVEMENTS.map((a, i) => {
          const got = !!achievements[a.id];
          return (
            <View key={a.id} style={styles.gridItem}>
              <Appear index={i}>
                <Card style={[styles.ach, !got && styles.achLocked]}>
                  <View style={[styles.achIcon, got && styles.achIconOn]}>
                    <Icon name={got ? a.icon : I.lock} size={18} color={got ? C.flame : C.textFaint} />
                  </View>
                  <Txt variant="bodyStrong" color={got ? C.text : C.textMuted} numberOfLines={1}>
                    {t(`ach.${a.id}.name` as TKey)}
                  </Txt>
                  <Txt variant="caption" numberOfLines={2}>
                    {t(`ach.${a.id}.desc` as TKey)}
                  </Txt>
                  <Txt variant="caption" color={got ? C.accent : C.textFaint} style={styles.bold}>
                    +{a.xp} XP
                  </Txt>
                </Card>
              </Appear>
            </View>
          );
        })}
      </View>

      <SectionHeader title={t('schedule.section')} />
      <Schedule t={t} days={profile.trainingDays} onChange={(trainingDays) => updateProfile({ trainingDays })} />

      <SectionHeader title={t('reminder.section')} />
      <Reminders
        t={t}
        reminder={profile.reminder}
        trainingDays={profile.trainingDays}
        onChange={(r) => updateProfile({ reminder: { ...profile.reminder, ...r } })}
      />

      <SectionHeader title={t('profile.split')} />
      <View style={styles.chips}>
        {SPLITS.map((s) => (
          <Chip key={s.id} label={splitName(t, s.id)} selected={profile.splitId === s.id} onPress={() => updateProfile({ splitId: s.id })} />
        ))}
      </View>

      <SectionHeader title={t('profile.equipment')} />
      <View style={styles.chips}>
        {ALL_EQUIPMENT.map((e) => (
          <Chip
            key={e}
            label={equipLabel(t, e)}
            selected={e === 'bodyweight' || profile.equipment.includes(e)}
            onPress={e === 'bodyweight' ? undefined : () => toggleEquip(e)}
          />
        ))}
      </View>

      <SectionHeader title={t('profile.restTimer')} />
      <View style={styles.chips}>
        {REST_OPTIONS.map((r) => (
          <Chip key={r} label={`${r}s`} selected={profile.restSeconds === r} onPress={() => updateProfile({ restSeconds: r })} />
        ))}
      </View>

      <SectionHeader title={t('profile.language')} />
      <View style={styles.chips}>
        {LANGS.map((l) => (
          <Chip
            key={l.id}
            label={l.label ?? t('profile.langSystem')}
            icon={l.id === 'system' ? I.globe : undefined}
            selected={profile.language === l.id}
            onPress={() => updateProfile({ language: l.id })}
          />
        ))}
      </View>

      <SectionHeader title={t('account.section')} />
      <Account t={t} />

      <SectionHeader title={t('data.section')} />
      <DataActions t={t} />

      <Button
        title={t('profile.reset')}
        kind="danger"
        icon={I.trash}
        style={styles.reset}
        onPress={reset}
      />
    </Screen>
  );
}

function Schedule({ t, days, onChange }: { t: TFn; days: number[]; onChange: (days: number[]) => void }) {
  const toggle = (d: number) => {
    if (days.includes(d)) {
      if (days.length === 1) return notify(t('schedule.section'), t('schedule.minOne'));
      onChange(days.filter((x) => x !== d));
    } else onChange([...days, d].sort());
  };
  return (
    <Card style={styles.reminders}>
      <View style={styles.days}>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => {
          const on = days.includes(d);
          return (
            <Chip key={d} label={weekdayShort(d)} icon={on ? I.dumbbell : I.bed} selected={on} onPress={() => toggle(d)} />
          );
        })}
      </View>
      <Txt variant="bodyStrong">
        {days.length === 7 ? t('schedule.everyDay') : t('schedule.summary', { train: days.length, rest: 7 - days.length })}
      </Txt>
      <Txt variant="caption">{t('schedule.hint')}</Txt>
    </Card>
  );
}

function Reminders({
  t,
  reminder,
  trainingDays,
  onChange,
}: {
  t: TFn;
  reminder: ReminderSettings;
  trainingDays: number[];
  onChange: (r: Partial<ReminderSettings>) => void;
}) {
  if (!remindersSupported) {
    return (
      <Card>
        <Txt variant="caption">{t('reminder.webOnly')}</Txt>
      </Card>
    );
  }

  const enable = async (on: boolean) => {
    if (!on) return onChange({ enabled: false });
    if (await requestReminderPermission()) onChange({ enabled: true });
    else notify(t('reminder.section'), t('reminder.denied'));
  };
  const enableStreak = async (on: boolean) => {
    if (!on) return onChange({ streakWarning: false });
    if (await requestReminderPermission()) onChange({ streakWarning: true });
    else notify(t('reminder.section'), t('reminder.denied'));
  };

  const shiftTime = (delta: number) => {
    const total = (reminder.hour * 60 + reminder.minute + delta + 24 * 60) % (24 * 60);
    onChange({ hour: Math.floor(total / 60), minute: total % 60 });
  };
  const at = new Date();
  at.setHours(reminder.hour, reminder.minute, 0, 0);
  const sameAsSchedule = reminder.days.length === trainingDays.length && reminder.days.every((d) => trainingDays.includes(d));

  return (
    <Card style={styles.reminders}>
      <ToggleRow icon={I.bell} title={t('reminder.toggle')} sub={t('reminder.toggleSub')} value={reminder.enabled} onChange={enable} />

      {reminder.enabled ? (
        <>
          <View style={styles.timeRow}>
            <Txt variant="label">{t('reminder.time')}</Txt>
            <View style={styles.stepper}>
              <IconButton icon={I.minus} label="−30" size={34} onPress={() => shiftTime(-TIME_STEP)} />
              <Txt variant="number" style={styles.time}>
                {formatTime(at.getTime())}
              </Txt>
              <IconButton icon={I.plus} label="+30" size={34} onPress={() => shiftTime(TIME_STEP)} />
            </View>
          </View>
          <View style={styles.days}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => {
              const on = reminder.days.includes(d);
              return (
                <Chip
                  key={d}
                  label={weekdayShort(d)}
                  selected={on}
                  onPress={() => onChange({ days: on ? reminder.days.filter((x) => x !== d) : [...reminder.days, d].sort() })}
                />
              );
            })}
          </View>
          {!sameAsSchedule ? (
            <Button title={t('reminder.matchSchedule')} kind="ghost" small icon={I.calendar} onPress={() => onChange({ days: [...trainingDays] })} />
          ) : null}
        </>
      ) : null}

      <View style={styles.divider} />
      <ToggleRow icon={I.flame} title={t('reminder.streak')} sub={t('reminder.streakSub')} value={reminder.streakWarning} onChange={enableStreak} />
    </Card>
  );
}

function ToggleRow({
  icon,
  title,
  sub,
  value,
  onChange,
}: {
  icon: typeof I.bell;
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Icon name={icon} size={18} color={value ? C.accent : C.textMuted} />
      <View style={styles.flex}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="caption">{sub}</Txt>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: C.accent, false: C.surfaceRaised }}
        thumbColor={C.text}
        ios_backgroundColor={C.surfaceRaised}
        accessibilityLabel={title}
      />
    </View>
  );
}

function Account({ t }: { t: TFn }) {
  const email = useAuth((s) => s.session?.user.email);
  const setGuest = useApp((s) => s.setGuest);

  if (!email) {
    return (
      <Card style={styles.data}>
        <Txt variant="caption">{t('account.guest')}</Txt>
        <Button title={t('account.signIn')} kind="secondary" icon={I.profile} onPress={() => setGuest(false)} />
      </Card>
    );
  }
  return (
    <Card style={styles.data}>
      <Txt variant="bodyStrong" numberOfLines={1}>
        {t('account.signedInAs', { email })}
      </Txt>
      <Txt variant="caption">{t('account.syncNote')}</Txt>
      <Button
        title={t('account.signOut')}
        kind="secondary"
        icon={I.logout}
        onPress={() =>
          confirm(t('account.signOutTitle'), t('account.signOutBody'), t('account.signOut'), () => {
            setGuest(false);
            signOut();
          })
        }
      />
    </Card>
  );
}

function DataActions({ t }: { t: TFn }) {
  const restoreBackup = useApp((s) => s.restoreBackup);

  const run = async (task: () => Promise<void>) => {
    try {
      await task();
    } catch (e) {
      if (e instanceof BackupError) notify(e.message === 'share-unavailable' ? t('data.shareUnavailable') : t('data.invalid'));
      else notify(t('data.failed', { msg: e instanceof Error ? e.message : String(e) }));
    }
  };

  const restore = () =>
    run(async () => {
      const backup = await pickBackup();
      if (!backup) return;
      confirm(
        t('data.importTitle'),
        t('data.importBody', { date: formatShortDate(backup.exportedAt), n: backup.data.workouts.length }),
        t('data.importConfirm'),
        () => {
          restoreBackup(backup.data);
          notify(t('data.restored'));
        },
      );
    });

  return (
    <Card style={styles.data}>
      <Button title={t('data.exportJson')} kind="secondary" icon={I.upload} onPress={() => run(exportBackup)} />
      <Button title={t('data.exportCsv')} kind="secondary" icon={I.table} onPress={() => run(exportSetsCsv)} />
      <Button title={t('data.import')} kind="secondary" icon={I.download} onPress={restore} />
      <Txt variant="caption">{t('data.note')}</Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: S.sm, marginBottom: S.xl },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.surfaceRaised,
    borderWidth: 2,
    borderColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.xs },
  nameInput: {
    minWidth: 180,
    marginTop: S.xs,
    paddingVertical: 4,
    paddingHorizontal: S.md,
    borderRadius: R.sm,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.accentDim,
    color: C.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  titlePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 28, borderRadius: 14, backgroundColor: C.accentSoft },
  bold: { fontWeight: '700' },
  flex: { flex: 1 },
  xp: { gap: S.md },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bleed: { marginHorizontal: -S.page },
  titles: { gap: S.sm, paddingHorizontal: S.page },
  titleCard: { width: 132, gap: 4, padding: S.md, borderRadius: R.md, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  titleUnlocked: { borderColor: C.accentDim },
  titleCurrent: { backgroundColor: C.accent, borderColor: C.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -S.xs },
  gridItem: { width: '50%', padding: S.xs },
  ach: { gap: 4, padding: S.md, height: 172 },
  achLocked: { backgroundColor: C.bg },
  achIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  achIconOn: { backgroundColor: C.flameSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  reminders: { gap: S.lg },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  time: { minWidth: 92, textAlign: 'center' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  data: { gap: S.sm },
  reset: { marginTop: S.xxl * 1.5 },
});

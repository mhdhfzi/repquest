import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, I, type IconName } from '@/components/ui/icon';
import { Txt } from '@/components/ui/text';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/i18n';

/** Web preview tab bar (the phone app uses native tabs). */
export default function AppTabs() {
  const { t } = useT();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View style={styles.bar}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={I.home}>{t('tab.today')}</TabButton>
          </TabTrigger>
          <TabTrigger name="library" href="/library" asChild>
            <TabButton icon={I.library}>{t('tab.library')}</TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton icon={I.progress}>{t('tab.progress')}</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon={I.profile}>{t('tab.profile')}</TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: IconName }) {
  const color = isFocused ? C.accent : C.textMuted;
  return (
    <Pressable {...props} style={[styles.btn, isFocused && styles.btnOn]}>
      <Icon name={icon} size={20} color={color} />
      <Txt variant="caption" color={isFocused ? C.text : C.textMuted} style={styles.label}>
        {children}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: S.lg,
    right: S.lg,
    bottom: S.lg,
    flexDirection: 'row',
    padding: 6,
    borderRadius: R.xl,
    backgroundColor: 'rgba(20,22,27,0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderStrong,
  },
  btn: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: R.lg },
  btnOn: { backgroundColor: C.accentSoft },
  label: { fontSize: 11, fontWeight: '600' },
});

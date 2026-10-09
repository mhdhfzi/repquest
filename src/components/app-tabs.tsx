import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { C } from '@/constants/theme';
import { useT } from '@/i18n';

/** Native tab bar: Liquid Glass on iOS, Material 3 on Android. */
export default function AppTabs() {
  const { t } = useT();
  return (
    <NativeTabs
      backgroundColor={C.surface}
      indicatorColor={C.accentSoft}
      iconColor={{ default: C.textMuted, selected: C.accent }}
      labelStyle={{ default: { color: C.textMuted }, selected: { color: C.text } }}
      tintColor={C.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tab.today')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Label>{t('tab.library')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>{t('tab.progress')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('tab.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

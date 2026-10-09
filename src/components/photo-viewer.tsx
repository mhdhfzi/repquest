import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { I } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/text';
import { C, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { formatShortDate } from '@/lib/date';
import type { BodyStat } from '@/types';

/** Full-screen progress photos: swipe sideways between them, tap ✕ to close. */
export function PhotoViewer({ entries, startIndex, onClose }: { entries: BodyStat[]; startIndex: number | null; onClose: () => void }) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(startIndex ?? 0);
  const current = entries[index];

  return (
    <Modal visible={startIndex !== null} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startIndex ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.photoUri! }}
              style={{ width, height }}
              contentFit="contain"
              transition={150}
              accessibilityLabel={`${t('body.photo')}, ${formatShortDate(item.date)}`}
            />
          )}
        />

        <View style={[styles.top, { paddingTop: insets.top + S.sm }]}>
          <Txt variant="label" color={C.text}>
            {entries.length > 1 ? t('body.photoCount', { i: index + 1, n: entries.length }) : ''}
          </Txt>
          <IconButton icon={I.close} label={t('common.close')} size={40} style={styles.close} onPress={onClose} />
        </View>

        {current ? (
          <View style={[styles.bottom, { paddingBottom: insets.bottom + S.lg }]}>
            <Txt variant="heading">{current.weightKg !== null ? `${current.weightKg} kg` : t('body.photo')}</Txt>
            <Txt variant="caption" color={C.text}>
              {formatShortDate(current.date)}
            </Txt>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.page,
    zIndex: 2,
  },
  close: { backgroundColor: C.overlay },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: S.page,
    paddingTop: S.xl,
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 2,
  },
});

import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ExerciseBrowser } from '@/components/exercise-browser';
import { Txt } from '@/components/ui/text';
import { useT } from '@/i18n';

export default function Library() {
  const { t } = useT();
  return (
    <ExerciseBrowser
      header={
        <Animated.View entering={FadeInDown.duration(400)}>
          <Txt variant="caption">{t('library.caption')}</Txt>
          <Txt variant="display">{t('library.title')}</Txt>
        </Animated.View>
      }
      onSelect={(id) => router.push(`/exercise/${id}`)}
    />
  );
}

import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon, I } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Txt } from '@/components/ui/text';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/i18n';
import { exerciseFrames, getExercise } from '@/lib/exercises';

/** Custom exercises show your photo, or a dumbbell when there isn't one. */
function CustomMedia({ photoUri, iconSize }: { photoUri?: string | null; iconSize: number }) {
  return photoUri ? (
    <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
  ) : (
    <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
      <Icon name={I.dumbbell} size={iconSize} color={C.textFaint} />
    </View>
  );
}

export function ExerciseThumb({ id, size = 56, style }: { id: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const ex = getExercise(id);
  if (ex?.custom) {
    return (
      <View style={[styles.thumb, { width: size, height: size }, style]}>
        <CustomMedia photoUri={ex.photoUri} iconSize={size * 0.4} />
      </View>
    );
  }
  return (
    <View style={[styles.thumb, { width: size, height: size }, style]}>
      <Image
        source={exerciseFrames(id)[0]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        recyclingKey={id}
      />
    </View>
  );
}

/**
 * Looping form preview: cross-fades between the start and end positions
 * with a hold on each, like a slow-motion rep.
 */
export function ExercisePreview({ id }: { id: string }) {
  const ex = getExercise(id);
  if (ex?.custom) {
    return (
      <View style={styles.preview}>
        <CustomMedia photoUri={ex.photoUri} iconSize={48} />
      </View>
    );
  }
  return <LoopingPreview id={id} />;
}

function LoopingPreview({ id }: { id: string }) {
  const [a, b] = exerciseFrames(id);
  const [playing, setPlaying] = useState(true);
  const { t: tr } = useT();
  const t = useSharedValue(0);

  useEffect(() => {
    if (!playing) {
      cancelAnimation(t);
      return;
    }
    const ease = Easing.inOut(Easing.cubic);
    t.set(
      withRepeat(
        withSequence(withDelay(700, withTiming(1, { duration: 900, easing: ease })), withDelay(700, withTiming(0, { duration: 900, easing: ease }))),
        -1,
      ),
    );
    return () => cancelAnimation(t);
  }, [playing, t]);

  const top = useAnimatedStyle(() => ({ opacity: t.value }));

  return (
    <View style={styles.preview}>
      <Image source={a} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={300} />
      <Animated.View style={[StyleSheet.absoluteFill, top]}>
        <Image source={b} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
      </Animated.View>
      <PressableScale
        haptic
        onPress={() => setPlaying((p) => !p)}
        accessibilityLabel={playing ? tr('exercise.pausePreview') : tr('exercise.playPreview')}
        style={styles.playBtn}>
        <Icon name={playing ? I.pause : I.play} size={14} color={C.text} />
        <Txt variant="caption" color={C.text} style={styles.playText}>
          {playing ? tr('exercise.preview') : tr('exercise.paused')}
        </Txt>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { borderRadius: R.sm, overflow: 'hidden', backgroundColor: C.surfaceRaised },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceRaised },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: R.lg,
    overflow: 'hidden',
    backgroundColor: C.surfaceRaised,
  },
  playBtn: {
    position: 'absolute',
    left: S.md,
    bottom: S.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: R.pill,
    backgroundColor: 'rgba(11,12,15,0.72)',
  },
  playText: { fontWeight: '600' },
});

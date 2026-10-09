import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line, Rect } from 'react-native-svg';

import { Txt } from '@/components/ui/text';
import { C, F, S } from '@/constants/theme';
import { useT } from '@/i18n';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Figure geometry (viewBox 200 × 240). `lift` 0 = dumbbells at the shoulders, 1 = locked out overhead.
const SHOULDER_L = { x: 78, y: 74 };
const ELBOW = { down: { x: 60, y: 102 }, up: { x: 70, y: 46 } };
const HAND = { down: { x: 62, y: 72 }, up: { x: 74, y: 18 } };
const STROKE = 7;

// Timeline (ms): three heavy reps, then the logo, then fade into the login page (~6 s in total).
const REPS = 3;
const START = 300;
const UP = 650;
const HOLD = 250; // pause at lockout
const DOWN = 550;
const REP_MS = UP + HOLD + DOWN;
const LAST_TOP = START + (REPS - 1) * REP_MS + UP;
const LOGO_AT = LAST_TOP + 450;
const LOGO_HOLD = 1700;
/** How long the intro runs; the login page times its entrance after this. */
export const INTRO_MS = LOGO_AT + LOGO_HOLD;

function lerp(a: number, b: number, p: number) {
  'worklet';
  return a + (b - a) * p;
}

/** One arm plus its dumbbell. `side` -1 = left, 1 = right (mirrored around x = 100). */
function Arm({ lift, side }: { lift: SharedValue<number>; side: -1 | 1 }) {
  const mx = (x: number) => {
    'worklet';
    return side === -1 ? x : 200 - x;
  };
  const upper = useAnimatedProps(() => ({
    x1: mx(SHOULDER_L.x),
    y1: SHOULDER_L.y,
    x2: mx(lerp(ELBOW.down.x, ELBOW.up.x, lift.value)),
    y2: lerp(ELBOW.down.y, ELBOW.up.y, lift.value),
  }));
  const fore = useAnimatedProps(() => ({
    x1: mx(lerp(ELBOW.down.x, ELBOW.up.x, lift.value)),
    y1: lerp(ELBOW.down.y, ELBOW.up.y, lift.value),
    x2: mx(lerp(HAND.down.x, HAND.up.x, lift.value)),
    y2: lerp(HAND.down.y, HAND.up.y, lift.value),
  }));
  const handle = useAnimatedProps(() => {
    const hx = mx(lerp(HAND.down.x, HAND.up.x, lift.value));
    const hy = lerp(HAND.down.y, HAND.up.y, lift.value);
    return { x1: hx - 11, y1: hy, x2: hx + 11, y2: hy };
  });
  const plateA = useAnimatedProps(() => {
    const hx = mx(lerp(HAND.down.x, HAND.up.x, lift.value));
    const hy = lerp(HAND.down.y, HAND.up.y, lift.value);
    return { x: hx - 18, y: hy - 9 };
  });
  const plateB = useAnimatedProps(() => {
    const hx = mx(lerp(HAND.down.x, HAND.up.x, lift.value));
    const hy = lerp(HAND.down.y, HAND.up.y, lift.value);
    return { x: hx + 11, y: hy - 9 };
  });

  return (
    <>
      <AnimatedLine animatedProps={upper} stroke={C.text} strokeWidth={STROKE} strokeLinecap="round" />
      <AnimatedLine animatedProps={fore} stroke={C.text} strokeWidth={STROKE} strokeLinecap="round" />
      <AnimatedLine animatedProps={handle} stroke={C.accent} strokeWidth={4} strokeLinecap="round" />
      <AnimatedRect animatedProps={plateA} width={7} height={18} rx={2} fill={C.accent} />
      <AnimatedRect animatedProps={plateB} width={7} height={18} rx={2} fill={C.accent} />
    </>
  );
}

/**
 * Splash before the login page: a lifter presses two dumbbells overhead for two reps,
 * then the RepQuest logo lands. Tap anywhere to skip. Skipped entirely with Reduce Motion.
 */
export function IntroLift({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);
  const fade = useSharedValue(1);
  const [rep, setRep] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      onDone();
      return;
    }
    const ease = Easing.inOut(Easing.cubic);
    const press = withTiming(1, { duration: UP, easing: ease });
    const lower = withDelay(HOLD, withTiming(0, { duration: DOWN, easing: ease }));
    // Every rep presses and lowers, except the last, which stays locked out for the logo.
    const steps = Array.from({ length: REPS }, (_, i) => (i < REPS - 1 ? [press, lower] : [press])).flat();
    lift.set(withDelay(START, withSequence(...steps)));

    const timers = [
      ...Array.from({ length: REPS }, (_, i) => setTimeout(() => setRep(i + 1), START + i * REP_MS + UP)),
      setTimeout(() => setShowLogo(true), LOGO_AT),
      setTimeout(() => fade.set(withTiming(0, { duration: 450 })), INTRO_MS - 450),
      setTimeout(onDone, INTRO_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion, onDone, lift, fade]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  // A quick upward "pop" through the shoulders at lockout sells the effort.
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -4 * lift.value }] }));
  const sparkProps = useAnimatedProps(() => ({ opacity: Math.max(0, (lift.value - 0.85) / 0.15) }));

  if (reduceMotion) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDone} accessibilityRole="button" accessibilityLabel={t('intro.skip')}>
        <View style={styles.center}>
          {!showLogo ? (
            <Animated.View exiting={FadeOut.duration(200)} style={styles.stage}>
              <Animated.View style={bodyStyle}>
                <Svg width={200} height={240} viewBox="0 0 200 240">
                  {/* Floor shadow */}
                  <Ellipse cx={100} cy={222} rx={52} ry={6} fill="rgba(198,243,94,0.12)" />
                  {/* Effort sparks above the dumbbells at lockout */}
                  <AnimatedLine animatedProps={sparkProps} x1={58} y1={8} x2={51} y2={1} stroke={C.accent} strokeWidth={3} strokeLinecap="round" />
                  <AnimatedLine animatedProps={sparkProps} x1={142} y1={8} x2={149} y2={1} stroke={C.accent} strokeWidth={3} strokeLinecap="round" />
                  {/* Head, torso, shoulders, legs */}
                  <Circle cx={100} cy={46} r={14} fill={C.text} />
                  <Line x1={100} y1={64} x2={100} y2={138} stroke={C.text} strokeWidth={STROKE + 3} strokeLinecap="round" />
                  <Line x1={SHOULDER_L.x} y1={SHOULDER_L.y} x2={200 - SHOULDER_L.x} y2={SHOULDER_L.y} stroke={C.text} strokeWidth={STROKE} strokeLinecap="round" />
                  <Line x1={100} y1={138} x2={80} y2={214} stroke={C.text} strokeWidth={STROKE + 1} strokeLinecap="round" />
                  <Line x1={100} y1={138} x2={120} y2={214} stroke={C.text} strokeWidth={STROKE + 1} strokeLinecap="round" />
                  <Arm lift={lift} side={-1} />
                  <Arm lift={lift} side={1} />
                </Svg>
              </Animated.View>
              <View style={styles.repRow}>
                {Array.from({ length: REPS }, (_, i) => i + 1).map((n) => (
                  <View key={n} style={[styles.repDot, rep >= n && styles.repDotOn]} />
                ))}
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn.springify().damping(11).stiffness(180)} style={styles.logoWrap}>
              <Txt style={styles.logo}>
                REP<Txt style={[styles.logo, styles.logoAccent]}>QUEST</Txt>
              </Txt>
              <Animated.View entering={FadeIn.delay(250).duration(300)}>
                <Txt variant="label" color={C.textMuted} center>
                  {t('intro.tagline')}
                </Txt>
              </Animated.View>
            </Animated.View>
          )}
        </View>
        <Txt variant="caption" center color={C.textFaint} style={styles.skip}>
          {t('intro.skip')}
        </Txt>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: C.bg, zIndex: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stage: { alignItems: 'center', gap: S.lg },
  repRow: { flexDirection: 'row', gap: S.sm },
  repDot: { width: 28, height: 6, borderRadius: 3, backgroundColor: C.surfaceRaised },
  repDotOn: { backgroundColor: C.accent },
  logoWrap: { alignItems: 'center', gap: S.sm },
  logo: { fontFamily: F.poster, fontSize: 76, lineHeight: 80, color: C.text, letterSpacing: 2 },
  logoAccent: { color: C.accent },
  skip: { position: 'absolute', bottom: 48, left: 0, right: 0 },
});

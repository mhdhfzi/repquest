import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { C } from '@/constants/theme';

const COLORS = [C.accent, C.flame, C.info, '#FFFFFF', C.accentDim];
const PIECES = 36;
const DURATION = 1800;

interface Piece {
  vx: number;
  vy: number;
  spin: number;
  color: string;
  w: number;
  h: number;
  delay: number;
}

// Generated once at load, outside render, so the burst is stable across re-renders.
const pieces: Piece[] = Array.from({ length: PIECES }, (_, i) => {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
  const speed = 0.45 + Math.random() * 0.55;
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    spin: (Math.random() - 0.5) * 900,
    color: COLORS[i % COLORS.length],
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    delay: Math.random() * 120,
  };
});

/** Confetti burst for level-ups and unlocks. Purely decorative and ignores touches. */
export function Celebration({ delay = 0, originY = 0.3 }: { delay?: number; originY?: number }) {
  const { width, height } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} delay={delay + p.delay} originX={width / 2} originY={height * originY} scale={Math.min(width, 500)} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, delay, originX, originY, scale }: { piece: Piece; delay: number; originX: number; originY: number; scale: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) })));
  }, [t, delay]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    // Burst outwards, then gravity pulls everything down.
    const x = piece.vx * scale * p;
    const y = piece.vy * scale * p + 0.9 * scale * p * p;
    return {
      opacity: p === 0 ? 0 : 1 - Math.max(0, (p - 0.7) / 0.3),
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${piece.spin * p}deg` }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: originX, top: originY, width: piece.w, height: piece.h, backgroundColor: piece.color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', borderRadius: 2 },
});

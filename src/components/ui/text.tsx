import { StyleSheet, Text, type TextProps } from 'react-native';

import { C, F } from '@/constants/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'number';

export function Txt({
  variant = 'body',
  color,
  style,
  center,
  ...rest
}: TextProps & { variant?: Variant; color?: string; center?: boolean }) {
  return (
    <Text
      {...rest}
      style={[styles[variant], color ? { color } : null, center ? styles.center : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: F.display, fontSize: 32, lineHeight: 38, fontWeight: '800', color: C.text, letterSpacing: -0.6 },
  title: { fontFamily: F.display, fontSize: 22, lineHeight: 28, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: C.text, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, color: C.text },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: C.text },
  caption: { fontSize: 13, lineHeight: 18, color: C.textMuted },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700', color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  number: { fontFamily: F.display, fontSize: 22, fontWeight: '700', color: C.text, fontVariant: ['tabular-nums'] },
  center: { textAlign: 'center' },
});

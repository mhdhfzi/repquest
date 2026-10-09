import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Txt } from '@/components/ui/text';
import { C, S } from '@/constants/theme';

export interface Datum {
  /** Short axis label, e.g. "6 Oct". */
  label: string;
  /** Longer label for the readout, e.g. "Week of 6 Oct". */
  detail?: string;
  value: number;
}

const PAD_TOP = 8;
const PAD_BOTTOM = 22;

/** Round up to a tidy axis maximum (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(n: number): number {
  if (n <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  return ([1, 2, 2.5, 5, 10].find((m) => m * mag >= n) ?? 10) * mag;
}

/** Bar with a 4px rounded top, flat on the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/** Tappable columns over the plot, so the hit target is the whole slot, not the thin mark. */
function HitColumns({ count, selected, onSelect, labels }: { count: number; selected: number; onSelect: (i: number) => void; labels: string[] }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.hitRow}>
        {Array.from({ length: count }, (_, i) => (
          <Pressable
            key={i}
            style={styles.hit}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: i === selected }}
            accessibilityLabel={labels[i]}
          />
        ))}
      </View>
    </View>
  );
}

function Readout({ datum, format }: { datum?: Datum; format: (n: number) => string }) {
  return (
    <View style={styles.readout}>
      <Txt variant="number">{datum ? format(datum.value) : '—'}</Txt>
      <Txt variant="caption">{datum?.detail ?? datum?.label ?? ''}</Txt>
    </View>
  );
}

/** Single-series bar chart. Tap a bar to read its value; the latest bar is selected by default. */
export function BarChart({ data, format, height = 150 }: { data: Datum[]; format: (n: number) => string; height?: number }) {
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked ?? data.length - 1;

  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const slot = width / Math.max(1, data.length);
  const barW = Math.min(28, slot * 0.56);
  const baseY = PAD_TOP + plotH;

  return (
    <View>
      <Readout datum={data[selected]} format={format} />
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Line x1={0} x2={width} y1={PAD_TOP} y2={PAD_TOP} stroke={C.border} strokeDasharray="3 4" />
            <SvgText x={width} y={PAD_TOP - 2} fill={C.textFaint} fontSize={10} textAnchor="end">
              {format(max)}
            </SvgText>
            {data.map((d, i) => {
              const h = Math.max(0, (d.value / max) * plotH);
              const x = i * slot + (slot - barW) / 2;
              return h > 0 ? (
                <Path key={i} d={barPath(x, baseY - h, barW, h)} fill={i === selected ? C.accent : C.accentDim} />
              ) : null;
            })}
            <Line x1={0} x2={width} y1={baseY} y2={baseY} stroke={C.borderStrong} />
            {data.map((d, i) => (
              <SvgText
                key={i}
                x={i * slot + slot / 2}
                y={height - 6}
                fill={i === selected ? C.text : C.textFaint}
                fontSize={10}
                fontWeight={i === selected ? '700' : '400'}
                textAnchor="middle">
                {d.label}
              </SvgText>
            ))}
          </Svg>
        ) : null}
        <HitColumns count={data.length} selected={selected} onSelect={setPicked} labels={data.map((d) => `${d.detail ?? d.label}: ${format(d.value)}`)} />
      </View>
    </View>
  );
}

/** Single-series line chart over evenly spaced sessions. Tap anywhere along it to read a point. */
export function LineChart({ data, format, height = 150 }: { data: Datum[]; format: (n: number) => string; height?: number }) {
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const selected = Math.min(picked ?? data.length - 1, data.length - 1);

  const values = data.map((d) => d.value);
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  // Leave headroom so a flat series sits mid-plot instead of on an edge.
  const span = hi - lo || Math.max(1, hi * 0.2);
  const top = hi + span * 0.15;
  const bottom = Math.max(0, lo - span * 0.15);

  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const slot = width / Math.max(1, data.length);
  const xAt = (i: number) => i * slot + slot / 2;
  const yAt = (v: number) => PAD_TOP + (1 - (v - bottom) / (top - bottom || 1)) * plotH;
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${xAt(i)},${yAt(d.value)}`).join(' ');
  const showAllDots = data.length <= 12;
  // Label first, last and selected so the axis never crowds.
  const labelled = new Set([0, data.length - 1, selected]);

  return (
    <View>
      <Readout datum={data[selected]} format={format} />
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && data.length ? (
          <Svg width={width} height={height}>
            <Line x1={0} x2={width} y1={PAD_TOP + plotH} y2={PAD_TOP + plotH} stroke={C.borderStrong} />
            <Line x1={xAt(selected)} x2={xAt(selected)} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={C.border} />
            <Path d={path} stroke={C.accent} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {data.map((d, i) =>
              showAllDots || i === selected ? (
                <Circle
                  key={i}
                  cx={xAt(i)}
                  cy={yAt(d.value)}
                  r={i === selected ? 5 : 3}
                  fill={C.accent}
                  stroke={C.surface}
                  strokeWidth={2}
                />
              ) : null,
            )}
            {data.map((d, i) =>
              labelled.has(i) ? (
                <SvgText
                  key={i}
                  x={Math.min(width - 2, Math.max(2, xAt(i)))}
                  y={height - 6}
                  fill={i === selected ? C.text : C.textFaint}
                  fontSize={10}
                  fontWeight={i === selected ? '700' : '400'}
                  textAnchor={i === 0 && i !== selected ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>
                  {d.label}
                </SvgText>
              ) : null,
            )}
          </Svg>
        ) : null}
        <HitColumns count={data.length} selected={selected} onSelect={setPicked} labels={data.map((d) => `${d.detail ?? d.label}: ${format(d.value)}`)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { gap: 2, marginBottom: S.md },
  hitRow: { flex: 1, flexDirection: 'row' },
  hit: { flex: 1 },
});

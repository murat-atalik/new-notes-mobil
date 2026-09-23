import React, { useState } from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { tw } from '../lib/tw';
import { Text } from './primitives';

/**
 * Minimal react-native-svg replacements for the recharts charts used by the web app.
 * They mimic recharts' default geometry (angles, nice ticks, band gaps) so the charts
 * look the same; hover tooltips become tap tooltips.
 */

type TooltipFormatter = (value: number, name: string) => [string, string];

type TooltipRow = { color: string; name: string; value: string };

type TooltipState = { x: number; y: number; label?: string; rows: TooltipRow[] } | null;

const TOOLTIP_WIDTH = 170;

/** Recharts' default tooltip box (white, 1px border, padding 10) with `contentStyle` overrides. */
const ChartTooltip: React.FC<{ tip: NonNullable<TooltipState>; width: number; height: number }> = ({
  tip,
  width,
  height,
}) => {
  const left = Math.max(0, Math.min(width - TOOLTIP_WIDTH, tip.x + 10));
  const top = Math.max(0, Math.min(height - 70, tip.y - 60));
  return (
    <View
      pointerEvents="none"
      style={[
        tw`absolute bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 shadow-md`,
        { left, top, width: TOOLTIP_WIDTH },
      ]}
    >
      {tip.label ? (
        <Text className="text-xs font-bold text-slate-900 dark:text-white mb-1">{tip.label}</Text>
      ) : null}
      {tip.rows.map((row, index) => (
        <Text key={index} className="text-xs font-bold py-0.5" style={{ color: row.color }}>
          {row.name} : {row.value}
        </Text>
      ))}
    </View>
  );
};

const useSize = () => {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return { width, onLayout };
};

// ---------------------------------------------------------------------------
// Donut (recharts <PieChart><Pie innerRadius outerRadius paddingAngle /></PieChart>)
// ---------------------------------------------------------------------------

export type DonutDatum = { name: string; value: number; color: string };

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  // recharts: angles grow counter-clockwise starting at 3 o'clock
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
};

const sectorPath = (
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
) => {
  const sweep = Math.min(end - start, 359.999);
  const large = sweep > 180 ? 1 : 0;
  const o1 = polar(cx, cy, outer, start);
  const o2 = polar(cx, cy, outer, start + sweep);
  const i1 = polar(cx, cy, inner, start + sweep);
  const i2 = polar(cx, cy, inner, start);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outer} ${outer} 0 ${large} 0 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${inner} ${inner} 0 ${large} 1 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
};

export const DonutChart: React.FC<{
  data: DonutDatum[];
  height: number;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  formatter?: TooltipFormatter;
}> = ({ data, height, innerRadius = 60, outerRadius = 85, paddingAngle = 0, formatter }) => {
  const { isDark } = useTheme();
  const { width, onLayout } = useSize();
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState<TooltipState>(null);

  const cx = width / 2;
  const cy = height / 2;
  const items = data.filter((d) => d.value > 0);
  const sum = items.reduce((s, d) => s + d.value, 0);
  const totalAngle = 360 - (items.length > 1 ? paddingAngle * items.length : 0);

  let cursor = 0;
  const sectors = data.map((d) => {
    if (d.value <= 0 || sum <= 0) return null;
    const angle = (d.value / sum) * totalAngle;
    const start = cursor;
    cursor = start + angle + (items.length > 1 ? paddingAngle : 0);
    return { start, end: start + angle };
  });

  const handlePress = (index: number, e: GestureResponderEvent) => {
    if (active === index) {
      setActive(null);
      setTip(null);
      return;
    }
    const d = data[index];
    const [value, name] = formatter ? formatter(d.value, d.name) : [String(d.value), d.name];
    setActive(index);
    setTip({
      x: e.nativeEvent.locationX,
      y: e.nativeEvent.locationY,
      rows: [{ color: d.color, name, value }],
    });
  };

  return (
    <View style={{ height, width: '100%' }} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {sectors.map((s, index) =>
            s ? (
              <Path
                key={`cell-${index}`}
                d={sectorPath(cx, cy, innerRadius, outerRadius, s.start, s.end)}
                fill={data[index].color}
                stroke={isDark ? '#0f172a' : '#fff'}
                strokeWidth={1}
                onPressIn={(e) => handlePress(index, e)}
              />
            ) : null,
          )}
        </Svg>
      )}
      {tip ? <ChartTooltip tip={tip} width={width} height={height} /> : null}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Stacked bar chart (recharts <BarChart><CartesianGrid/><XAxis/><YAxis/><Bar stackId/>)
// ---------------------------------------------------------------------------

export type BarSeries = { dataKey: string; name: string; color: string; radius?: number };

/** recharts getNiceTickValues (tickCount=5, domain [0, auto]). */
const niceTicks = (max: number, count = 5): number[] => {
  if (max <= 0) return [0, 1, 2, 3, 4].slice(0, count);
  const rough = max / (count - 1);
  const digitCount = Math.floor(Math.log10(rough)) + 1;
  const digitValue = 10 ** digitCount;
  const ratio = rough / digitValue;
  const scale = digitCount !== 1 ? 0.05 : 0.1;
  const step = Number((Math.ceil(ratio / scale) * scale * digitValue).toPrecision(12));
  return Array.from({ length: count }, (_, i) => Number((step * i).toPrecision(12)));
};

const topRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h);
  if (rr <= 0) return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + rr}`,
    `Q ${x} ${y} ${x + rr} ${y}`,
    `L ${x + w - rr} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + rr}`,
    `L ${x + w} ${y + h}`,
    'Z',
  ].join(' ');
};

export const BarChart: React.FC<{
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: BarSeries[];
  height: number;
  margin?: { top: number; right: number; left: number; bottom: number };
  gridColor?: string;
  tickColor?: string;
  formatter?: TooltipFormatter;
}> = ({
  data,
  xKey,
  series,
  height,
  margin = { top: 5, right: 5, left: 5, bottom: 5 },
  gridColor,
  tickColor,
  formatter,
}) => {
  const { isDark } = useTheme();
  const { width, onLayout } = useSize();
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState<TooltipState>(null);

  const grid = gridColor ?? (isDark ? '#1e293b' : '#f1f5f9');
  const tick = tickColor ?? (isDark ? '#94a3b8' : '#64748b');

  const Y_AXIS_WIDTH = 60;
  const X_AXIS_HEIGHT = 30;
  const plotLeft = margin.left + Y_AXIS_WIDTH;
  const plotTop = margin.top;
  const plotWidth = Math.max(0, width - plotLeft - margin.right);
  const plotHeight = Math.max(0, height - margin.top - margin.bottom - X_AXIS_HEIGHT);

  const totals = data.map((d) => series.reduce((s, sr) => s + (Number(d[sr.dataKey]) || 0), 0));
  const ticks = niceTicks(Math.max(0, ...totals));
  const yMax = ticks[ticks.length - 1] || 1;
  const yScale = (v: number) => plotTop + plotHeight - (v / yMax) * plotHeight;

  const band = data.length > 0 ? plotWidth / data.length : 0;
  const barWidth = band * 0.8; // barCategoryGap = 10%

  // XAxis interval="preserveEnd": hide labels that would overlap.
  const labelWidth = (label: string) => label.length * 6 + 4;
  const visibleLabels = new Set<number>();
  let lastLeft = Infinity;
  for (let i = data.length - 1; i >= 0; i--) {
    const center = plotLeft + band * (i + 0.5);
    const w = labelWidth(String(data[i][xKey]));
    if (center + w / 2 <= lastLeft) {
      visibleLabels.add(i);
      lastLeft = center - w / 2;
    }
  }

  const handlePress = (index: number) => {
    if (active === index) {
      setActive(null);
      setTip(null);
      return;
    }
    const d = data[index];
    setActive(index);
    setTip({
      x: plotLeft + band * (index + 0.5),
      y: yScale(totals[index]),
      label: String(d[xKey]),
      rows: series.map((sr) => {
        const raw = Number(d[sr.dataKey]) || 0;
        const [value, name] = formatter ? formatter(raw, sr.name) : [String(raw), sr.name];
        return { color: sr.color, name, value };
      }),
    });
  };

  return (
    <View style={{ height, width: '100%' }} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* CartesianGrid strokeDasharray="3 3" vertical={false} */}
          {ticks.map((t) => (
            <Line
              key={`grid-${t}`}
              x1={plotLeft}
              x2={plotLeft + plotWidth}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke={grid}
              strokeDasharray="3 3"
            />
          ))}

          {/* YAxis ticks */}
          {ticks.map((t) => (
            <SvgText
              key={`y-${t}`}
              x={plotLeft - 8}
              y={yScale(t) + 4}
              fontSize={11}
              fill={tick}
              textAnchor="end"
            >
              {String(t)}
            </SvgText>
          ))}

          {/* Active cursor band */}
          {active !== null && (
            <Rect
              x={plotLeft + band * active}
              y={plotTop}
              width={band}
              height={plotHeight}
              fill={isDark ? '#334155' : '#ccc'}
              opacity={0.5}
            />
          )}

          {/* Stacked bars */}
          {data.map((d, index) => {
            const x = plotLeft + band * index + (band - barWidth) / 2;
            let acc = 0;
            return (
              <G key={`bar-${index}`}>
                {series.map((sr, sIndex) => {
                  const v = Number(d[sr.dataKey]) || 0;
                  if (v <= 0) return null;
                  const y0 = yScale(acc);
                  acc += v;
                  const y1 = yScale(acc);
                  const isTop = sIndex === series.length - 1;
                  return (
                    <Path
                      key={sr.dataKey}
                      d={topRoundedRect(x, y1, barWidth, y0 - y1, isTop ? (sr.radius ?? 0) : 0)}
                      fill={sr.color}
                    />
                  );
                })}
              </G>
            );
          })}

          {/* XAxis ticks */}
          {data.map((d, index) =>
            visibleLabels.has(index) ? (
              <SvgText
                key={`x-${index}`}
                x={plotLeft + band * (index + 0.5)}
                y={plotTop + plotHeight + 16}
                fontSize={11}
                fill={tick}
                textAnchor="middle"
              >
                {String(d[xKey])}
              </SvgText>
            ) : null,
          )}

          {/* Tap targets (whole category band, like recharts' tooltip trigger) */}
          {data.map((_, index) => (
            <Rect
              key={`hit-${index}`}
              x={plotLeft + band * index}
              y={plotTop}
              width={band}
              height={plotHeight}
              fill="transparent"
              onPressIn={() => handlePress(index)}
            />
          ))}
        </Svg>
      )}
      {tip ? <ChartTooltip tip={tip} width={width} height={height} /> : null}
    </View>
  );
};

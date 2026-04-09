import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface Props {
  /** Current value */
  value: number;
  /** Maximum value (100 % = value/max) */
  max: number;
  /** Label shown below the circle */
  label: string;
  /** Circle diameter in dp. Default 90 */
  size?: number;
  /** Stroke thickness. Default 9 */
  strokeWidth?: number;
}

/** Returns a color based on the completion percentage. */
function progressColor(pct: number): string {
  if (pct < 50) return '#22C55E'; // green
  if (pct < 80) return '#F97316'; // orange
  return  '#EF4444';              // red
}

/**
 * Reusable animated circular progress ring.
 *
 * Usage:
 *   <ProgressCircle value={7} max={10} label="Habits" />
 */
export default function ProgressCircle({
  value, max, label, size = 90, strokeWidth = 9,
}: Props) {
  const { theme } = useTheme();
  const pct  = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const color = progressColor(pct);

  // ── Animation ──────────────────────────────────────────────────
  const anim   = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circum = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:         pct / 100,
      duration:        900,
      useNativeDriver: false, // SVG props cannot use native driver
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  // Animate the stroke-dashoffset from 0% to pct%
  const AnimatedCircle   = Animated.createAnimatedComponent(Circle);
  const strokeDashoffset = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [circum, circum - (circum * pct) / 100],
  });

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.bgSubtle}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Filled arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circum}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {/* Centre text — absolute, over the SVG */}
      <View
        style={[styles.centre, { width: size, height: size }]}
        pointerEvents="none"
      >
        <Text style={[styles.pct, { color }]}>{pct}%</Text>
        <Text style={[styles.fraction, { color: theme.textMuted }]}>
          {value}/{max}
        </Text>
      </View>

      {/* Label */}
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  centre: {
    position:       'absolute',
    top:            0,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pct: {
    fontSize:   16,
    fontWeight: '800',
    lineHeight: 20,
  },
  fraction: {
    fontSize:   10,
    fontWeight: '500',
    marginTop:  1,
  },
  label: {
    marginTop:  8,
    fontSize:   12,
    fontWeight: '600',
    textAlign:  'center',
  },
});

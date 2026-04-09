import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  /** Stagger delay in ms before animation starts. Default 0. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps any content with a fade-in + slight slide-up animation on mount.
 * Use the `delay` prop to stagger multiple cards entering at once.
 *
 * Usage:
 *   <AnimatedCard delay={100}>
 *     <View style={styles.card}>...</View>
 *   </AnimatedCard>
 */
export default function AnimatedCard({ children, delay = 0, style }: Props) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue:         1,
        duration:        380,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue:         0,
        delay,
        friction:        9,
        tension:         60,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

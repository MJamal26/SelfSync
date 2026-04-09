import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';

interface Props {
  children:        React.ReactNode;
  onPress?:        (e: GestureResponderEvent) => void;
  onLongPress?:    (e: GestureResponderEvent) => void;
  style?:          StyleProp<ViewStyle>;
  /** Scale factor on press. Default 0.96 */
  scaleTo?:        number;
  activeOpacity?:  number; // kept for API compatibility — ignored
  disabled?:       boolean;
}

/**
 * Drop-in replacement for TouchableOpacity that adds a spring scale effect on press.
 *
 * Usage:
 *   <ScalePressable onPress={handlePress} style={styles.button}>
 *     <Text>Press me</Text>
 *   </ScalePressable>
 */
export default function ScalePressable({
  children, onPress, onLongPress, style, scaleTo = 0.96, disabled,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: scaleTo, friction: 10, tension: 300, useNativeDriver: true,
    }).start();

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1, friction: 6, tension: 150, useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

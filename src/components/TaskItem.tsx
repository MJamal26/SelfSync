import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Task } from '../types';
import { useTheme, Theme, shadow } from '../context/ThemeContext';
import ScalePressable from './ScalePressable';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
}

export default function TaskItem({ task, onToggle }: Props) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  return (
    <ScalePressable
      style={[s.container, task.completed && s.containerDone]}
      onPress={() => onToggle(task.id)}
      scaleTo={0.97}
    >
      {/* Time badge */}
      <View style={s.timeBadge}>
        <Ionicons name="time-outline" size={11} color={theme.accent} style={s.timeIcon} />
        <Text style={s.timeText}>{task.time}</Text>
      </View>

      {/* Title */}
      <Text style={[s.title, task.completed && s.titleDone]} numberOfLines={2}>
        {task.title}
      </Text>

      {/* Checkbox */}
      <View style={[s.checkbox, task.completed && s.checkboxDone]}>
        {task.completed && (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        )}
      </View>
    </ScalePressable>
  );
}

function makeStyles(theme: Theme) {
  const cardShadow = theme.dark ? {} : shadow.card;
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
      ...cardShadow,
    },
    containerDone: {
      opacity: 0.6,
      borderColor: theme.card,
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bg,
      borderRadius: 8,
      paddingVertical: 5,
      paddingHorizontal: 8,
      minWidth: 76,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    timeIcon: { lineHeight: 13 },
    timeText: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    title: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 22,
    },
    titleDone: {
      textDecorationLine: 'line-through',
      color: theme.textMuted,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: theme.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxDone: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
  });
}

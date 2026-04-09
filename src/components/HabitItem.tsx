import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Habit } from '../types';
import { useTheme, Theme, shadow } from '../context/ThemeContext';
import ScalePressable from './ScalePressable';

interface Props {
  habit: Habit;
  isCompletedToday: boolean;
  onToggle: (id: string) => void;
}

// Map each habit name to an Ionicons icon
const HABIT_ICONS: Record<string, string> = {
  'No Sugar':     'nutrition-outline',
  'Workout':      'barbell-outline',
  'Water Intake': 'water-outline',
};
const DEFAULT_ICON = 'checkmark-circle-outline';

export default function HabitItem({ habit, isCompletedToday, onToggle }: Props) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const iconName = HABIT_ICONS[habit.name] ?? DEFAULT_ICON;

  return (
    <ScalePressable
      style={[s.container, isCompletedToday && s.containerDone]}
      onPress={() => onToggle(habit.id)}
      scaleTo={0.97}
    >
      {/* Icon box */}
      <View style={[s.iconBox, isCompletedToday && s.iconBoxDone]}>
        <Ionicons
          name={iconName}
          size={24}
          color={isCompletedToday ? theme.accent : theme.textSecondary}
        />
      </View>

      {/* Name + streak */}
      <View style={s.info}>
        <Text style={[s.name, isCompletedToday && s.nameDone]}>
          {habit.name}
        </Text>
        <View style={s.streakRow}>
          <Ionicons name="flame-outline" size={13} color={isCompletedToday ? '#F97316' : theme.textMuted} />
          <Text style={[s.streakText, isCompletedToday && s.streakDone]}>
            {habit.streak} day{habit.streak !== 1 ? 's' : ''} streak
          </Text>
        </View>
      </View>

      {/* Switch */}
      <Switch
        value={isCompletedToday}
        onValueChange={() => onToggle(habit.id)}
        trackColor={{
          false: theme.dark ? '#334155' : '#E2E8F0',
          true:  theme.dark ? '#4F46E5' : '#A5B4FC',
        }}
        thumbColor={
          isCompletedToday
            ? (theme.dark ? '#FFFFFF' : '#6366F1')
            : (theme.dark ? '#94A3B8' : '#FFFFFF')
        }
        ios_backgroundColor={theme.dark ? '#334155' : '#E2E8F0'}
      />
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
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 14,
      ...cardShadow,
    },
    containerDone: {
      borderColor: theme.accent,
      backgroundColor: theme.cardAlt,
      borderLeftWidth: 4,
      borderLeftColor: theme.accent,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBoxDone: {
      backgroundColor: theme.accentSoft,
    },
    info: {
      flex: 1,
      gap: 4,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    nameDone: {
      color: theme.accent,
    },
    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    streakText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    streakDone: {
      color: '#F97316',
    },
  });
}

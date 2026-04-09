import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types';
import HabitItem from '../components/HabitItem';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme, Theme, spacing, shadow } from '../context/ThemeContext';

const STORAGE_KEY = '@selfsync_habits';
const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'No Sugar',     emoji: '🚫🍬', completedDates: [], streak: 0 },
  { id: '2', name: 'Workout',      emoji: '💪',    completedDates: [], streak: 0 },
  { id: '3', name: 'Water Intake', emoji: '💧',    completedDates: [], streak: 0 },
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort().reverse();
  const today = todayStr();
  if (sorted[0] !== today) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (sorted[0] !== y.toISOString().slice(0, 10)) return 0;
  }
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i-1]).getTime() - new Date(sorted[i]).getTime()) / 86400000;
    if (diff === 1) streak++; else break;
  }
  return streak;
}

export default function HabitTrackerScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: Habit[] = JSON.parse(raw);
          setHabits(saved.map(h => ({ ...h, streak: calcStreak(h.completedDates) })));
        } else setHabits(DEFAULT_HABITS);
      } catch { setHabits(DEFAULT_HABITS); }
      finally { setLoading(false); }
    })();
  }, []);

  const saveHabits = useCallback(async (updated: Habit[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  const toggleHabit = useCallback((id: string) => {
    setHabits(prev => {
      const today = todayStr();
      const updated = prev.map(h => {
        if (h.id !== id) return h;
        const done = h.completedDates.includes(today);
        const newDates = done ? h.completedDates.filter(d => d !== today) : [...h.completedDates, today];
        return { ...h, completedDates: newDates, streak: calcStreak(newDates) };
      });
      saveHabits(updated);
      return updated;
    });
  }, [saveHabits]);

  const today = todayStr();
  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const pct = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <ScreenHeader
        title="Habit Tracker"
        icon="barbell-outline"
        iconColor="#F97316"
        right={
          <View style={s.scoreBadge}>
            <Text style={s.scoreNum}>{completedToday}</Text>
            <Text style={s.scoreDen}>/{habits.length}</Text>
          </View>
        }
      />

      {/* Progress strip */}
      <View style={s.progressCard}>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={s.progressLabel}>{pct}% complete today</Text>
      </View>

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HabitItem habit={item} isCompletedToday={item.completedDates.includes(today)} onToggle={toggleHabit} />
        )}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  const cardShadow = theme.dark ? {} : shadow.card;
  return StyleSheet.create({
    container:     { flex: 1, backgroundColor: theme.bg },
    progressCard:  { marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: theme.card, borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4, borderWidth: 1, borderColor: theme.border, ...cardShadow },
    scoreBadge:    { flexDirection: 'row', alignItems: 'baseline', backgroundColor: theme.bgSubtle, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
    scoreNum:      { fontSize: 26, fontWeight: '800', color: theme.accent },
    scoreDen:      { fontSize: 16, fontWeight: '600', color: theme.textMuted },
    progressTrack: { height: 6, backgroundColor: theme.bgSubtle, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.xs },
    progressFill:  { height: '100%', backgroundColor: theme.accent, borderRadius: 3 },
    progressLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },
    list:          { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  });
}

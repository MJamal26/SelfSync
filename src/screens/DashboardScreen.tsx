import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Habit, FoodEntry, Expense, Task } from '../types';
import { useTheme, shadow } from '../context/ThemeContext';
import AnimatedCard from '../components/AnimatedCard';
import ScalePressable from '../components/ScalePressable';
import ProgressCircle from '../components/ProgressCircle';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function monthStr() { return new Date().toISOString().slice(0, 7); }
function fmtCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface Stats {
  habitsTotal:  number;
  habitsDone:   number;
  caloriesToday: number;
  expensesToday: number;
  expensesMonth: number;
  tasksTotal:   number;
  tasksDone:    number;
}

const CALORIE_LIMIT = 2000;

export default function DashboardScreen({ navigation }: Props) {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = makeStyles(theme);
  const scrollOpacity = useRef(new Animated.Value(1)).current;

  // ── Theme-switch fade ──────────────────────────────────────────
  const handleToggleTheme = () => {
    Animated.sequence([
      Animated.timing(scrollOpacity, { toValue: 0.55, duration: 120, useNativeDriver: true }),
      Animated.timing(scrollOpacity, { toValue: 1,    duration: 260, useNativeDriver: true }),
    ]).start();
    toggleTheme();
  };

  const [stats, setStats] = useState<Stats>({
    habitsTotal:   0,
    habitsDone:    0,
    caloriesToday: 0,
    expensesToday: 0,
    expensesMonth: 0,
    tasksTotal:    0,
    tasksDone:     0,
  });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const today = todayStr();
        const month = monthStr();
        try {
          const [habitsRaw, caloriesRaw, expensesRaw, tasksRaw] = await Promise.all([
            AsyncStorage.getItem('@selfsync_habits'),
            AsyncStorage.getItem('@selfsync_calories'),
            AsyncStorage.getItem('@selfsync_expenses'),
            AsyncStorage.getItem('@selfsync_tasks'),
          ]);
          const habits: Habit[]       = habitsRaw    ? JSON.parse(habitsRaw)   : [];
          const calories: FoodEntry[] = caloriesRaw  ? JSON.parse(caloriesRaw) : [];
          const expenses: Expense[]   = expensesRaw  ? JSON.parse(expensesRaw) : [];
          const tasks: Task[]         = tasksRaw     ? JSON.parse(tasksRaw)    : [];

          const caloriesToday = calories.filter(c => c.date === today).reduce((s, c) => s + c.calories, 0);

          // 🚨 Calorie limit alert
          if (caloriesToday > CALORIE_LIMIT) {
            Toast.show({
              type:           'error',
              text1:          'Calorie Limit Exceeded 🚨',
              text2:          'You crossed your daily intake!',
              position:       'top',
              visibilityTime: 4000,
            });
          }

          setStats({
            habitsTotal:   habits.length,
            habitsDone:    habits.filter(h => h.completedDates.includes(today)).length,
            caloriesToday,
            expensesToday: expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0),
            expensesMonth: expenses.filter(e => e.month === month).reduce((s, e) => s + e.amount, 0),
            tasksTotal:    tasks.length,
            tasksDone:     tasks.filter(t => t.completed).length,
          });
        } catch { /* silent */ }
      })();
    }, [])
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning ☀️';
    if (h < 17) return 'Good afternoon 🌤️';
    return 'Good evening 🌙';
  };

  const habitPercent   = stats.habitsTotal > 0
    ? Math.round((stats.habitsDone / stats.habitsTotal) * 100)
    : 0;
  const caloriePercent = Math.min(Math.round((stats.caloriesToday / 2000) * 100), 100);

  const NAV = [
    { label: 'Daily Planner',   icon: 'calendar-outline',  route: 'DailyPlanner'   as const, color: theme.accent },
    { label: 'Habit Tracker',   icon: 'barbell-outline',   route: 'HabitTracker'   as const, color: '#F97316' },
    { label: 'Calorie Tracker', icon: 'nutrition-outline', route: 'CalorieTracker' as const, color: theme.positive },
    { label: 'Expense Tracker', icon: 'wallet-outline',    route: 'ExpenseTracker' as const, color: theme.warning },
  ];

  return (
    <SafeAreaView style={s.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        style={{ opacity: scrollOpacity }}
      >

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting()}</Text>
            <Text style={s.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </Text>
          </View>

          <View style={s.toggleContainer}>
            <Text style={s.toggleLabel}>{isDark ? '🌙' : '☀️'}</Text>
            <Switch
              value={isDark}
              onValueChange={handleToggleTheme}
              thumbColor={isDark ? theme.accent : '#FFFFFF'}
              trackColor={{ false: '#CBD5E1', true: theme.accentSoft }}
              ios_backgroundColor="#CBD5E1"
            />
          </View>
        </View>

        {/* ── Progress Circles ─────────────────────────────────── */}
        <AnimatedCard delay={0}>
          <View style={s.progressSection}>
            <Text style={s.sectionTitle}>Today's Progress</Text>
            <View style={s.circleRow}>
              <ProgressCircle
                value={stats.tasksDone}
                max={stats.tasksTotal || 11}
                label="Planner"
                size={90}
              />
              <ProgressCircle
                value={stats.caloriesToday}
                max={CALORIE_LIMIT}
                label="Calories"
                size={110}
              />
              <ProgressCircle
                value={stats.habitsDone}
                max={stats.habitsTotal || 3}
                label="Habits"
                size={90}
              />
            </View>
          </View>
        </AnimatedCard>

        {/* ── At a Glance ───────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Today at a Glance</Text>

        {/* Habits Card — entry delay 0ms */}
        <AnimatedCard delay={0}>
          <View style={[s.card, s.cardAccent, { borderLeftColor: '#F97316' }]}>
            <View style={s.cardHeader}>
              <View style={[s.cardIconBox, { backgroundColor: '#F9731622' }]}>
                <Ionicons name="barbell-outline" size={22} color="#F97316" />
              </View>
              <View style={s.cardMeta}>
                <Text style={s.cardTitle}>Habits</Text>
                <Text style={s.cardSubtitle}>Daily completion</Text>
              </View>
              <View style={s.cardValueBox}>
                <Text style={[s.cardValue, { color: '#F97316' }]}>{stats.habitsDone}</Text>
                <Text style={s.cardValueSub}>/ {stats.habitsTotal}</Text>
              </View>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${habitPercent}%`, backgroundColor: '#F97316' }]} />
            </View>
            <Text style={s.progressLabel}>{habitPercent}% complete</Text>
          </View>
        </AnimatedCard>

        {/* Calories + Expenses — entry delay 80ms */}
        <AnimatedCard delay={80}>
          <View style={s.twoCol}>

            {/* Calories */}
            <View style={[s.card, s.cardHalf, s.cardAccent, { borderLeftColor: theme.positive }]}>
              <View style={[s.cardIconBox, { backgroundColor: theme.positive + '22' }]}>
                <Ionicons name="nutrition-outline" size={22} color={theme.positive} />
              </View>
              <Text style={s.cardTitle}>Calories</Text>
              <Text style={[s.cardValue, { color: theme.positive, fontSize: 26, marginTop: 4 }]}>
                {stats.caloriesToday}
              </Text>
              <Text style={s.cardValueSub}>kcal today</Text>
              <View style={[s.progressTrack, { marginTop: 10 }]}>
                <View style={[s.progressFill, { width: `${caloriePercent}%`, backgroundColor: theme.positive }]} />
              </View>
              <Text style={s.progressLabel}>{caloriePercent}% of goal</Text>
            </View>

            {/* Expenses */}
            <View style={[s.card, s.cardHalf, s.cardAccent, { borderLeftColor: theme.warning }]}>
              <View style={[s.cardIconBox, { backgroundColor: theme.warning + '22' }]}>
                <Ionicons name="wallet-outline" size={22} color={theme.warning} />
              </View>
              <Text style={s.cardTitle}>Expenses</Text>
              <Text style={[s.cardValue, { color: theme.warning, fontSize: 22, marginTop: 4 }]}>
                {fmtCurrency(stats.expensesToday)}
              </Text>
              <Text style={s.cardValueSub}>today</Text>
              <Text style={[s.cardValueSub, { marginTop: 6, fontSize: 11 }]}>
                {fmtCurrency(stats.expensesMonth)} this month
              </Text>
            </View>
          </View>
        </AnimatedCard>

        {/* ── Quick Access ──────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Quick Access</Text>
        <AnimatedCard delay={160}>
          <View style={s.navGrid}>
            {NAV.map(item => (
              <View key={item.route} style={s.navCardWrapper}>
                <ScalePressable
                  style={[s.navCard, { borderColor: item.color + '44' }]}
                  onPress={() => navigation.navigate(item.route)}
                >
                  <View style={[s.navIconBox, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={s.navLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={[s.navSub, { color: item.color }]} numberOfLines={1}>Open →</Text>
                </ScalePressable>
              </View>
            ))}
          </View>
        </AnimatedCard>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── Dynamic styles ───────────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const cardShadow = theme.dark ? {} : shadow.card;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    scroll:    { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },

    /* Header */
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 20,
      marginBottom: 20,
    },
    greeting:  { fontSize: 22, fontWeight: '800', color: theme.text },
    date:      { fontSize: 13, color: theme.textSecondary, marginTop: 3 },

    /* Toggle */
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.card,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      ...cardShadow,
    },
    toggleLabel: { fontSize: 16 },

    /* Section title */
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 10,
    },

    /* Cards */
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      ...cardShadow,
    },
    cardAccent: { borderLeftWidth: 4 },
    cardHalf:   { flex: 1 },
    twoCol:     { flexDirection: 'row', gap: 12, marginBottom: 0 },

    cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    cardIconBox:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardIcon:     { fontSize: 22 },
    cardMeta:     { flex: 1 },
    cardTitle:    { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 1 },
    cardSubtitle: { fontSize: 12, color: theme.textSecondary },
    cardValueBox: { alignItems: 'flex-end' },
    cardValue:    { fontSize: 30, fontWeight: '800', color: theme.text },
    cardValueSub: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },

    progressTrack: { height: 6, backgroundColor: theme.bgSubtle, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
    progressFill:  { height: '100%', borderRadius: 3 },
    progressLabel: { fontSize: 11, color: theme.textMuted, marginTop: 5 },

    /* Progress circles section */
    progressSection: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
      ...cardShadow,
    },
    circleRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginTop: 16,
    },

    /* Nav grid — 2-column rectangular tiles */
    navGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    navCardWrapper:{ width: '48%' },          // ← width here (correct % reference)
    navCard:       {                           // ← NO width here (fills wrapper via stretch)
      minHeight: 108,
      backgroundColor: theme.card,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 10,
      borderWidth: 1.5,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...cardShadow,
    },
    navIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    navLabel:   { fontSize: 12, fontWeight: '700', color: theme.text, textAlign: 'center' },
    navSub:     { fontSize: 10, fontWeight: '600', opacity: 0.75 },
    navEmoji:   { fontSize: 20 },
    navArrow:   { fontSize: 16, fontWeight: '700' },
  });
}

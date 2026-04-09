import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types';
import TaskItem from '../components/TaskItem';
import AddTaskModal from '../components/AddTaskModal';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme, Theme, spacing } from '../context/ThemeContext';

const INITIAL_TASKS: Task[] = [
  { id: '1',  title: 'Morning meditation',       time: '06:00 AM', completed: false },
  { id: '2',  title: 'Workout session',           time: '07:00 AM', completed: false },
  { id: '3',  title: 'Breakfast & journaling',    time: '08:00 AM', completed: false },
  { id: '4',  title: 'Deep work block',           time: '09:00 AM', completed: false },
  { id: '5',  title: 'Team standup meeting',      time: '10:30 AM', completed: false },
  { id: '6',  title: 'Lunch break',               time: '01:00 PM', completed: false },
  { id: '7',  title: 'Review & respond to emails',time: '02:00 PM', completed: false },
  { id: '8',  title: 'Creative / side project',   time: '04:00 PM', completed: false },
  { id: '9',  title: 'Evening walk',              time: '06:30 PM', completed: false },
  { id: '10', title: 'Read for 30 mins',          time: '09:00 PM', completed: false },
  { id: '11', title: 'Wind-down routine',          time: '10:00 PM', completed: false },
];

function parseTime(time: string): number {
  const [rawTime, period] = time.split(' ');
  const [hours, minutes] = rawTime.split(':').map(Number);
  let total = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) total += 720;
  if (period === 'AM' && hours === 12) total -= 720;
  return total;
}

const STORAGE_KEY = '@selfsync_tasks';

export default function DailyPlannerScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [modalVisible, setModalVisible] = useState(false);

  // Load from storage when screen focuses
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (raw) setTasks(JSON.parse(raw));
        } catch { /* use defaults */ }
      })();
    }, [])
  );

  // Persist whenever tasks change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch(() => {});
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (title: string, time: string) => {
    const newTask: Task = { id: Date.now().toString(), title, time, completed: false };
    setTasks(prev => [...prev, newTask].sort((a, b) => parseTime(a.time) - parseTime(b.time)));
    setModalVisible(false);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={s.container}>
      <ScreenHeader title="Daily Planner" icon="calendar-outline" />
      {/* Stats bar */}
      <View style={s.statsBar}>
        {[
          { label: 'Total', value: tasks.length },
          { label: 'Done', value: completedCount },
          { label: 'Left', value: tasks.length - completedCount },
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={s.divider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Progress bar */}
      <View style={s.progressContainer}>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={s.progressText}>{pct}% complete</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TaskItem task={item} onToggle={toggleTask} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>No tasks yet.</Text>
            <Text style={s.emptySubText}>Tap + to add your first task.</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <AddTaskModal visible={modalVisible} onAdd={addTask} onCancel={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container:         { flex: 1, backgroundColor: theme.bg },
    statsBar:          { flexDirection: 'row', backgroundColor: theme.card, marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: 16, paddingVertical: spacing.md, borderWidth: 1, borderColor: theme.border },
    statItem:          { flex: 1, alignItems: 'center' },
    divider:           { width: 1, backgroundColor: theme.border },
    statNumber:        { fontSize: 24, fontWeight: '800', color: theme.accent },
    statLabel:         { fontSize: 12, color: theme.textSecondary, marginTop: spacing.xs, fontWeight: '500' },
    progressContainer: { paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
    progressTrack:     { height: 6, backgroundColor: theme.card, borderRadius: 3, overflow: 'hidden' },
    progressFill:      { height: '100%', backgroundColor: theme.accent, borderRadius: 3 },
    progressText:      { color: theme.textSecondary, fontSize: 12, marginTop: spacing.sm, fontWeight: '500' },
    listContent:       { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 120 },
    emptyContainer:    { alignItems: 'center', marginTop: spacing.xl },
    emptyEmoji:        { fontSize: 48, marginBottom: spacing.md },
    emptyText:         { color: theme.textSecondary, fontSize: 18, fontWeight: '600', marginBottom: spacing.xs },
    emptySubText:      { color: theme.textMuted, fontSize: 14 },
    fab:               { position: 'absolute', bottom: spacing.lg + spacing.sm, right: spacing.lg, width: 58, height: 58, borderRadius: 29, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },
    fabText:           { color: '#FFFFFF', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  });
}

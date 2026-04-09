import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme, Theme } from '../context/ThemeContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
interface Props { navigation: HomeScreenNavigationProp; }

export default function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={s.iconContainer}>
          <Text style={s.iconEmoji}>🔄</Text>
        </View>
        <Text style={s.appName}>SelfSync</Text>
        <Text style={s.tagline}>Plan your day.{'\n'}Own your time.</Text>

        <View style={s.featuresContainer}>
          {[
            { icon: '📋', label: 'Organize daily tasks' },
            { icon: '✅', label: 'Track what you complete' },
            { icon: '🔥', label: 'Build lasting habits' },
          ].map((f) => (
            <View key={f.label} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.button} onPress={() => navigation.navigate('DailyPlanner')} activeOpacity={0.85}>
          <Text style={s.buttonText}>📋  Daily Planner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.outlineBtn, { borderColor: '#F97316' }]} onPress={() => navigation.navigate('HabitTracker')} activeOpacity={0.85}>
          <Text style={[s.outlineBtnText, { color: '#F97316' }]}>🔥  Habit Tracker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.outlineBtn, { borderColor: theme.positive }]} onPress={() => navigation.navigate('CalorieTracker')} activeOpacity={0.85}>
          <Text style={[s.outlineBtnText, { color: theme.positive }]}>🥗  Calorie Tracker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.outlineBtn, { borderColor: theme.warning }]} onPress={() => navigation.navigate('ExpenseTracker')} activeOpacity={0.85}>
          <Text style={[s.outlineBtnText, { color: theme.warning }]}>💸  Expense Tracker</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: theme.bg },
    content:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    iconContainer:    { width: 88, height: 88, borderRadius: 24, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: theme.border },
    iconEmoji:        { fontSize: 40 },
    appName:          { fontSize: 36, fontWeight: '800', color: theme.text, letterSpacing: 1, marginBottom: 12 },
    tagline:          { fontSize: 18, color: theme.textSecondary, textAlign: 'center', lineHeight: 28, marginBottom: 40 },
    featuresContainer:{ width: '100%', backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: theme.border, gap: 14 },
    featureRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon:      { fontSize: 20 },
    featureText:      { fontSize: 15, color: theme.textSecondary },
    button:           { backgroundColor: theme.accent, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
    buttonText:       { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
    outlineBtn:       { backgroundColor: 'transparent', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, marginBottom: 12 },
    outlineBtnText:   { fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
  });
}

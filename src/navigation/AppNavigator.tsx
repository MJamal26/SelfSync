import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DailyPlannerScreen from '../screens/DailyPlannerScreen';
import HabitTrackerScreen from '../screens/HabitTrackerScreen';
import CalorieTrackerScreen from '../screens/CalorieTrackerScreen';
import ExpenseTrackerScreen from '../screens/ExpenseTrackerScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  Home: undefined;
  DailyPlanner: undefined;
  HabitTracker: undefined;
  CalorieTracker: undefined;
  ExpenseTracker: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme } = useTheme();

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: theme.headerText,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'SelfSync' }}
        />
        <Stack.Screen
          name="DailyPlanner"
          component={DailyPlannerScreen}
          options={{ title: 'Daily Planner' }}
        />
        <Stack.Screen
          name="HabitTracker"
          component={HabitTrackerScreen}
          options={{ title: 'Habit Tracker' }}
        />
        <Stack.Screen
          name="CalorieTracker"
          component={CalorieTrackerScreen}
          options={{ title: 'Calorie Tracker' }}
        />
        <Stack.Screen
          name="ExpenseTracker"
          component={ExpenseTrackerScreen}
          options={{ title: 'Expense Tracker' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}


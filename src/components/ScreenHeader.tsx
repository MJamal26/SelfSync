import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

interface Props {
  /** Screen title shown in bold below the greeting */
  title:    string;
  /** Ionicons name for the small icon next to the title */
  icon:     string;
  /** Icon color. Defaults to theme.accent */
  iconColor?: string;
  /** Optional right-side element (e.g. a theme toggle) */
  right?:   React.ReactNode;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 🌤️';
  return 'Good evening 🌙';
}

/**
 * Consistent screen-level header for all screens.
 *
 * Usage:
 *   <ScreenHeader title="Daily Planner" icon="calendar-outline" />
 */
export default function ScreenHeader({ title, icon, iconColor, right }: Props) {
  const { theme } = useTheme();
  const color = iconColor ?? theme.accent;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting()}</Text>
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={22} color={color} style={styles.titleIcon} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    paddingHorizontal: 20,
    paddingTop:     20,
    paddingBottom:  12,
  },
  left: {
    flex: 1,
  },
  greeting: {
    fontSize:   13,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  titleIcon: {
    marginTop: 1, // optical alignment with text
  },
  title: {
    fontSize:      24,
    fontWeight:    '800',
    letterSpacing: -0.3,
    lineHeight:    30,
  },
  right: {
    marginTop: 4,
  },
});

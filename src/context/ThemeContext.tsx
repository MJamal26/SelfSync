import React, { createContext, useCallback, useContext, useState } from 'react';
import { spacing, radius, typography, shadow } from '../theme/designSystem';

// Re-export design system tokens so screens only need one import path
export { spacing, radius, typography, shadow };

// ─── Theme interface ──────────────────────────────────────────────────────────

export interface Theme {
  dark: boolean;
  // ── Semantic aliases (use these in new screens) ──
  primary:    string;  // = accent (indigo)
  background: string;  // = bg
  // ── Full palette ──
  bg:            string;
  bgSubtle:      string;
  card:          string;
  cardAlt:       string;
  border:        string;
  text:          string;
  textSecondary: string;
  textMuted:     string;
  accent:        string;
  accentSoft:    string;
  positive:      string;
  warning:       string;
  danger:        string;
  headerBg:      string;
  headerText:    string;
  shadow:        string;
  statusBar:     'light-content' | 'dark-content';
}

// ─── Color tokens ─────────────────────────────────────────────────────────────

export const LightTheme: Theme = {
  dark:          false,
  primary:       '#6366F1',
  background:    '#FFFFFF',
  bg:            '#FFFFFF',
  bgSubtle:      '#F1F5F9',
  card:          '#F8FAFC',
  cardAlt:       '#EEF2FF',
  border:        '#E2E8F0',
  text:          '#0F172A',
  textSecondary: '#64748B',
  textMuted:     '#94A3B8',
  accent:        '#6366F1',
  accentSoft:    '#EEF2FF',
  positive:      '#10B981',
  warning:       '#F59E0B',
  danger:        '#F43F5E',
  headerBg:      '#FFFFFF',
  headerText:    '#0F172A',
  shadow:        'rgba(0,0,0,0.07)',
  statusBar:     'dark-content',
};

export const DarkTheme: Theme = {
  dark:          true,
  primary:       '#818CF8',  // indigo-400 — pops on dark bg
  background:    '#13151A',
  bg:            '#13151A',  // warm dark gray, not pure black
  bgSubtle:      '#1C1F26',  // section/row alternates
  card:          '#1E2128',  // clearly above bg
  cardAlt:       '#242C3D',  // tinted for completed/active states
  border:        '#2E3240',  // visible but soft
  text:          '#EAECF0',  // bright off-white — max contrast
  textSecondary: '#9BA3AF',  // mid gray — clearly readable
  textMuted:     '#6B7280',  // muted but legible
  accent:        '#818CF8',  // indigo-400 — brighter on dark
  accentSoft:    '#1E2040',  // dark indigo tint
  positive:      '#34D399',  // emerald-400
  warning:       '#FBBF24',  // amber-400
  danger:        '#F87171',  // red-400
  headerBg:      '#13151A',
  headerText:    '#EAECF0',
  shadow:        'transparent',
  statusBar:     'light-content',
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DarkTheme,
  isDark: true,
  toggleTheme: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  return (
    <ThemeContext.Provider value={{ theme: isDark ? DarkTheme : LightTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

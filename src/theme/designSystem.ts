/**
 * SelfSync – Centralized Design System
 *
 * Import what you need:
 *   import { spacing, radius, typography } from '../theme/designSystem';
 *
 * For colors, use the theme context:
 *   import { useTheme } from '../context/ThemeContext';
 *   const { theme } = useTheme();
 *   // then: theme.primary  theme.background  theme.card  theme.text  theme.border
 */

// ─── Spacing ─────────────────────────────────────────────────────────────────
// Use these instead of magic numbers like `16` or `8`.
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const radius = {
  small:  8,
  medium: 14,
  large:  20,
  full:   9999, // pill / circle
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
// Pair these with theme.text / theme.textSecondary for color.
export const typography = {
  heading: {
    fontSize:   22,
    fontWeight: '800' as const,
    lineHeight: 30,
  },
  subheading: {
    fontSize:   17,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  body: {
    fontSize:   15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize:   12,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  label: {
    fontSize:   11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
// Use `shadow.card` in light mode; omit (or use `shadow.none`) in dark mode.
export const shadow = {
  card: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius:  8,
    elevation:     3,
  },
  modal: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius:  16,
    elevation:     8,
  },
  none: {},
} as const;

// ─── Usage Example ────────────────────────────────────────────────────────────
/*
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, typography, shadow } from '../theme/designSystem';

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,   // alias for theme.bg
      padding: spacing.md,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: radius.medium,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.md,
      ...shadow.card,
    },
    heading: {
      ...typography.heading,
      color: theme.text,
    },
    subheading: {
      ...typography.subheading,
      color: theme.textSecondary,
    },
    button: {
      backgroundColor: theme.primary,     // alias for theme.accent
      borderRadius: radius.medium,
      paddingVertical: spacing.sm + 4,
    },
  });
}
*/

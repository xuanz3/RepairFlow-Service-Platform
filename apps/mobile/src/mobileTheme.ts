import { StyleSheet } from 'react-native';
import { colour, radius, spacing } from '@repairflow/design-tokens';

export const mobileTheme = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colour.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 18,
    paddingBottom: 40,
    gap: spacing.md,
  },
  header: {
    gap: 6,
    marginBottom: 8,
  },
  eyebrow: {
    color: colour.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: colour.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colour.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colour.border,
    borderRadius: radius.md,
    backgroundColor: colour.surface,
    gap: 8,
  },
  cardRaised: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#252d4c',
    gap: 7,
  },
  cardTitle: {
    color: colour.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardCopy: {
    color: colour.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: colour.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colour.border,
    borderRadius: radius.md,
    backgroundColor: colour.surface,
    color: colour.text,
    fontSize: 14,
  },
  textarea: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colour.accent,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colour.border,
    borderRadius: radius.md,
    backgroundColor: colour.surfaceRaised,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: colour.text,
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colour.surfaceRaised,
    color: colour.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  success: {
    color: colour.success,
  },
  error: {
    color: '#ef9aa4',
  },
  divider: {
    height: 1,
    backgroundColor: colour.border,
  },
});

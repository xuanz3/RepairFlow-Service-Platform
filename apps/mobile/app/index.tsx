import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colour, radius, spacing } from '@repairflow/design-tokens';
import { queueItems } from '../src/demoQueue';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>TODAY</Text>
          <Text style={styles.title}>Workshop intake</Text>
          <Text style={styles.subtitle}>
            Capture devices and evidence even when the network is unavailable.
          </Text>
        </View>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>Offline ready</Text>
        </View>
      </View>

      <View style={styles.actionCard}>
        <View>
          <Text style={styles.cardLabel}>QUICK ACTION</Text>
          <Text style={styles.cardTitle}>Start device check-in</Text>
          <Text style={styles.cardCopy}>
            Customer, device condition, reported fault and intake evidence.
          </Text>
        </View>
        <View style={styles.actionButton}>
          <Text style={styles.actionButtonText}>＋</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Assigned queue</Text>
        <Text style={styles.sectionMeta}>{queueItems.length} cases</Text>
      </View>

      {queueItems.map((item) => (
        <View style={styles.queueCard} key={item.reference}>
          <View style={styles.deviceMark}>
            <Text style={styles.deviceMarkText}>{item.category[0]}</Text>
          </View>
          <View style={styles.queueBody}>
            <Text style={styles.queueTitle}>
              {item.manufacturer} {item.model}
            </Text>
            <Text style={styles.queueMeta}>
              {item.reference} · {item.status}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      ))}

      <View style={styles.syncCard}>
        <View style={styles.syncDot} />
        <View>
          <Text style={styles.syncTitle}>Local queue protected</Text>
          <Text style={styles.syncCopy}>
            No pending changes. SQLite and secure storage boundaries are configured.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colour.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: 68, paddingBottom: 40, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  eyebrow: { color: colour.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colour.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginTop: 6 },
  subtitle: { color: colour.textMuted, fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 260 },
  offlineBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1f3a35',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  offlineText: { color: colour.success, fontSize: 11, fontWeight: '800' },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#252d4c',
  },
  cardLabel: { color: '#aeb8ff', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  cardTitle: { color: colour.text, fontSize: 19, fontWeight: '800', marginTop: 7 },
  cardCopy: { color: '#b4bdd2', fontSize: 13, lineHeight: 18, marginTop: 5, maxWidth: 250 },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colour.accent,
  },
  actionButtonText: { color: 'white', fontSize: 26, lineHeight: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: 2,
  },
  sectionTitle: { color: colour.text, fontSize: 16, fontWeight: '800' },
  sectionMeta: { color: colour.textMuted, fontSize: 12 },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colour.border,
    borderRadius: radius.md,
    backgroundColor: colour.surface,
  },
  deviceMark: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colour.surfaceRaised,
  },
  deviceMarkText: { color: '#aeb8ff', fontWeight: '800' },
  queueBody: { flex: 1, gap: 4 },
  queueTitle: { color: colour.text, fontSize: 14, fontWeight: '700' },
  queueMeta: { color: colour.textMuted, fontSize: 12, textTransform: 'capitalize' },
  chevron: { color: colour.textMuted, fontSize: 26 },
  syncCard: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: '#16241f',
  },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colour.success, marginTop: 5 },
  syncTitle: { color: colour.text, fontSize: 13, fontWeight: '800' },
  syncCopy: { color: colour.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3, maxWidth: 300 },
});

import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';
import { fetchStudentAttendances } from '@/lib/data';
import { daysSince, formatDateTime } from '@/lib/format';
import type { Attendance } from '@/lib/types';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAttendances = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const rows = await fetchStudentAttendances(user.id, 60);
      setAttendances(rows);
    } catch {
      setError('Nao foi possivel carregar suas presencas.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAttendances();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAttendances]);

  const latest = attendances[0] ?? null;
  const days = daysSince(latest?.date);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Presencas</Text>
        <Text style={styles.subtitle}>{attendances.length} registro(s) recentes</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Ultima presenca</Text>
        <Text style={styles.summaryValue}>{formatDateTime(latest?.date)}</Text>
        <Text style={styles.summaryHint}>
          {days === null ? 'Sem presencas localizadas.' : days === 0 ? 'Hoje' : `${days} dia(s) atras`}
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable accessibilityRole="button" onPress={loadAttendances} style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>Atualizar</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color="#D7262E" />
      ) : (
        <View style={styles.list}>
          {attendances.map((attendance, index) => (
            <View key={attendance.id} style={styles.item}>
              <View style={styles.itemMarker}>
                <Text style={styles.itemMarkerText}>{index + 1}</Text>
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>Aula registrada</Text>
                <Text style={styles.itemMeta}>{formatDateTime(attendance.date)}</Text>
              </View>
            </View>
          ))}

          {attendances.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhuma presenca encontrada</Text>
              <Text style={styles.emptyText}>As presencas importadas pelo professor aparecerao aqui.</Text>
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 18,
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
  },
  summaryCard: {
    gap: 6,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#151515',
  },
  summaryLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryHint: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  refreshButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#D7262E',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  refreshButtonText: {
    color: '#D7262E',
    fontSize: 16,
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  itemMarker: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemMarkerText: {
    color: '#151515',
    fontWeight: '800',
  },
  itemBody: {
    flex: 1,
    gap: 3,
    backgroundColor: '#FFFFFF',
  },
  itemTitle: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '800',
  },
  itemMeta: {
    color: '#6B7280',
    fontSize: 14,
  },
  emptyCard: {
    gap: 6,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
});

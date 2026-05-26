import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';
import { computeGraduationProgress, getBeltName } from '@/lib/graduation';
import { fetchStudentAttendances } from '@/lib/data';
import { daysSince, formatDate } from '@/lib/format';
import type { Attendance } from '@/lib/types';

export default function HomeScreen() {
  const { authError, isProfileLoading, profile, refreshProfile, signOut, user } = useAuth();
  const [latestAttendance, setLatestAttendance] = useState<Attendance | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const graduation = useMemo(() => (profile ? computeGraduationProgress(profile) : null), [profile]);
  const displayName = profile?.full_name ?? user?.email ?? 'Aluno';
  const nextGoal = graduation?.isBlackBelt
    ? 'Definida pelo professor'
    : graduation?.canPromoteBelt
      ? 'Pronto para faixa'
      : graduation?.canPromoteGrade
        ? 'Pronto para grau'
        : graduation
          ? `${graduation.classesNeeded} aulas`
          : '--';

  useEffect(() => {
    const studentId = user?.id;
    if (!studentId) {
      return;
    }

    const resolvedStudentId = studentId;
    let cancelled = false;

    async function loadLatestAttendance() {
      setLoadingAttendance(true);
      try {
        const rows = await fetchStudentAttendances(resolvedStudentId, 1);
        if (!cancelled) {
          setLatestAttendance(rows[0] ?? null);
        }
      } catch {
        if (!cancelled) {
          setLatestAttendance(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAttendance(false);
        }
      }
    }

    void loadLatestAttendance();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const absenceDays = daysSince(latestAttendance?.date);
  const summary = [
    { label: 'Aulas no ciclo', value: graduation ? String(graduation.currentCycleClasses) : '--' },
    { label: 'Total de aulas', value: profile ? String(profile.total_classes) : '--' },
    { label: 'Ultima presenca', value: loadingAttendance ? '...' : formatDate(latestAttendance?.date) },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>J</Text>
        </View>
        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.subtitle}>
          {profile ? `Faixa ${getBeltName(profile.belt)} - grau ${profile.degree}` : 'Area do aluno'}
        </Text>
      </View>

      {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progresso</Text>
          <Text style={styles.progressNumber}>{graduation ? `${graduation.progressPct}%` : '--'}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${graduation?.progressPct ?? 0}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {graduation?.isBlackBelt
            ? 'Progressao definida pelo professor.'
            : graduation?.canPromoteBelt
              ? 'Pronto para trocar de faixa.'
              : graduation?.canPromoteGrade
                ? 'Pronto para o proximo grau.'
                : `Faltam ${nextGoal} para a proxima meta.`}
        </Text>
      </View>

      <View style={styles.panel}>
        {isProfileLoading ? (
          <ActivityIndicator color="#D7262E" />
        ) : (
          summary.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.sectionTitle}>Ritmo de treino</Text>
        <Text style={styles.insightText}>
          {absenceDays === null
            ? 'Ainda nao encontramos presencas registradas para esta conta.'
            : absenceDays === 0
              ? 'Presenca registrada hoje.'
              : `${absenceDays} dia(s) desde a ultima presenca.`}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={refreshProfile} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Atualizar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={signOut} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Sair</Text>
        </Pressable>
      </View>
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
    alignItems: 'flex-start',
    gap: 10,
  },
  logo: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 16,
  },
  panel: {
    gap: 12,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#ECECEC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  rowLabel: {
    color: '#6B7280',
    fontSize: 15,
  },
  rowValue: {
    color: '#151515',
    fontSize: 17,
    fontWeight: '700',
  },
  progressCard: {
    gap: 12,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#151515',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151515',
  },
  sectionTitle: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '800',
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  progressNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#3A3A3A',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  progressText: {
    color: '#F3F4F6',
    fontSize: 14,
    lineHeight: 20,
  },
  insightCard: {
    gap: 8,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  insightText: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    gap: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#D7262E',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#D7262E',
    fontSize: 16,
    fontWeight: '800',
  },
});

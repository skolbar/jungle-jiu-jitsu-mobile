import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';
import { computeGraduationProgress, getBeltName } from '@/lib/graduation';
import { fetchAdminAttendances, fetchAttendanceDates, fetchStudentAttendances, fetchStudents } from '@/lib/data';
import { daysSince, formatDate, formatDateTime } from '@/lib/format';
import type { Attendance, AttendanceDate, AttendanceWithStudent, Profile } from '@/lib/types';

export default function HomeScreen() {
  const auth = useAuth();

  if (auth.profile?.role === 'admin') {
    return <AdminHomeScreen auth={auth} />;
  }

  return <StudentHomeScreen auth={auth} />;
}

function StudentHomeScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const { authError, isProfileLoading, profile, refreshProfile, signOut, user } = auth;
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
    </SafeAreaView>
  );
}

function AdminHomeScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const { profile, signOut } = auth;
  const [students, setStudents] = useState<Profile[]>([]);
  const [recentAttendances, setRecentAttendances] = useState<AttendanceWithStudent[]>([]);
  const [attendanceDates, setAttendanceDates] = useState<AttendanceDate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (profile?.role !== 'admin') {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const [studentRows, attendanceRows, attendanceDateRows] = await Promise.all([
        fetchStudents(),
        fetchAdminAttendances(8),
        fetchAttendanceDates(),
      ]);
      setStudents(studentRows);
      setRecentAttendances(attendanceRows);
      setAttendanceDates(attendanceDateRows);
    } catch {
      setError('Nao foi possivel carregar o painel administrativo.');
    } finally {
      setLoading(false);
    }
  }, [profile?.role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadDashboard]);

  const todayKey = new Date().toDateString();
  const todayAttendances = attendanceDates.filter((attendance) => new Date(attendance.date).toDateString() === todayKey);
  const lastAttendanceByStudent = new Map<string, string>();

  attendanceDates.forEach((attendance) => {
    if (!lastAttendanceByStudent.has(attendance.student_id)) {
      lastAttendanceByStudent.set(attendance.student_id, attendance.date);
    }
  });

  const studentsWithProgress = students
    .map((student) => ({
      student,
      progress: computeGraduationProgress(student),
    }))
    .filter((item) => !item.progress.isBlackBelt);

  const nearGraduation = [...studentsWithProgress]
    .filter((item) => item.progress.progressPct >= 80)
    .sort((a, b) => b.progress.progressPct - a.progress.progressPct);

  const absentStudents = students
    .map((student) => {
      const lastAttendance = lastAttendanceByStudent.get(student.id) ?? null;
      return {
        student,
        lastAttendance,
        absenceDays: daysSince(lastAttendance),
      };
    })
    .filter((item) => item.absenceDays === null || item.absenceDays >= 15)
    .sort((a, b) => {
      if (a.absenceDays === null && b.absenceDays === null) return 0;
      if (a.absenceDays === null) return -1;
      if (b.absenceDays === null) return 1;
      return b.absenceDays - a.absenceDays;
    });

  const stats = [
    { label: 'Alunos', value: students.length },
    { label: 'Hoje', value: todayAttendances.length },
    { label: 'Graduacao', value: nearGraduation.length },
    { label: 'Ausentes', value: absentStudents.length },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>J</Text>
          </View>
          <Text style={styles.title}>Painel admin</Text>
          <Text style={styles.subtitle}>Visao geral da academia</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color="#D7262E" />
        ) : (
          <>
            <View style={styles.metricGrid}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.metricCard}>
                  <Text style={styles.metricValue}>{stat.value}</Text>
                  <Text style={styles.metricLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Proximos da graduacao</Text>
                <Text style={styles.sectionHint}>80%+</Text>
              </View>
              {nearGraduation.slice(0, 5).map(({ student, progress }) => (
                <View key={student.id} style={styles.adminListRow}>
                  <View style={styles.adminListBody}>
                    <Text style={styles.adminListTitle}>{student.full_name ?? student.email ?? 'Aluno'}</Text>
                    <Text style={styles.adminListMeta}>
                      {getBeltName(student.belt)} - grau {student.degree}
                    </Text>
                  </View>
                  <Text style={styles.adminListValue}>{progress.progressPct}%</Text>
                </View>
              ))}
              {nearGraduation.length === 0 ? (
                <Text style={styles.insightText}>Nenhum aluno acima de 80% neste momento.</Text>
              ) : null}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ultimas presencas</Text>
                <Text style={styles.sectionHint}>{recentAttendances.length}</Text>
              </View>
              {recentAttendances.slice(0, 5).map((attendance) => (
                <View key={attendance.id} style={styles.adminListRow}>
                  <View style={styles.adminListBody}>
                    <Text style={styles.adminListTitle}>{attendance.student?.full_name ?? 'Aluno'}</Text>
                    <Text style={styles.adminListMeta}>{formatDateTime(attendance.date)}</Text>
                  </View>
                  <Text style={styles.adminListValue}>OK</Text>
                </View>
              ))}
              {recentAttendances.length === 0 ? <Text style={styles.insightText}>Sem presencas recentes.</Text> : null}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Alunos ausentes</Text>
                <Text style={styles.sectionHint}>15+ dias</Text>
              </View>
              {absentStudents.slice(0, 5).map(({ student, absenceDays }) => (
                <View key={student.id} style={styles.adminListRow}>
                  <View style={styles.adminListBody}>
                    <Text style={styles.adminListTitle}>{student.full_name ?? student.email ?? 'Aluno'}</Text>
                    <Text style={styles.adminListMeta}>
                      {getBeltName(student.belt)} - grau {student.degree}
                    </Text>
                  </View>
                  <Text style={styles.warningValue}>{absenceDays === null ? 'Nunca' : `${absenceDays}d`}</Text>
                </View>
              ))}
              {absentStudents.length === 0 ? <Text style={styles.insightText}>Nenhum aluno ausente.</Text> : null}
            </View>
          </>
        )}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={loadDashboard} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Atualizar painel</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={signOut} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },
  container: {
    flexGrow: 1,
    gap: 18,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 18,
  },
  header: {
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#111111',
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
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
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
    backgroundColor: '#FFFFFF',
  },
  rowLabel: {
    flex: 1,
    color: '#6B7280',
    fontSize: 15,
  },
  rowValue: {
    flex: 1,
    color: '#151515',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
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
    backgroundColor: '#111111',
  },
  errorText: {
    color: '#FCA5A5',
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
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#111111',
  },
  metricCard: {
    minWidth: '47%',
    flex: 1,
    gap: 6,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  metricValue: {
    color: '#151515',
    fontSize: 28,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    gap: 10,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  sectionHint: {
    color: '#D7262E',
    fontSize: 13,
    fontWeight: '800',
  },
  adminListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopColor: '#F3F4F6',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  adminListBody: {
    flex: 1,
    gap: 2,
    backgroundColor: '#FFFFFF',
  },
  adminListTitle: {
    color: '#151515',
    fontSize: 15,
    fontWeight: '800',
  },
  adminListMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  adminListValue: {
    color: '#D7262E',
    fontSize: 14,
    fontWeight: '800',
  },
  warningValue: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '800',
  },
});

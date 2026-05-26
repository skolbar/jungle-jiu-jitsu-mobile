import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';
import { fetchStudentAttendances, fetchStudents } from '@/lib/data';
import { computeGraduationProgress, getBeltName } from '@/lib/graduation';
import { daysSince, formatDateTime } from '@/lib/format';
import type { Attendance, Profile } from '@/lib/types';

export default function AttendanceScreen() {
  const auth = useAuth();

  if (auth.profile?.role === 'admin') {
    return <AdminStudentsScreen />;
  }

  return <StudentAttendanceScreen />;
}

function StudentAttendanceScreen() {
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
    </SafeAreaView>
  );
}

function AdminStudentsScreen() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const rows = await fetchStudents();
      setStudents(rows);
    } catch {
      setError('Nao foi possivel carregar os alunos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStudents();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) => {
      const name = student.full_name?.toLowerCase() ?? '';
      const email = student.email?.toLowerCase() ?? '';
      return name.includes(term) || email.includes(term);
    });
  }, [searchTerm, students]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alunos</Text>
          <Text style={styles.subtitle}>{students.length} aluno(s) cadastrado(s)</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.searchCard}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearchTerm}
            placeholder="Buscar aluno"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchTerm}
          />
        </View>

        <Pressable accessibilityRole="button" onPress={loadStudents} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Atualizar</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator color="#D7262E" />
        ) : (
          <View style={styles.list}>
            {filteredStudents.map((student) => {
              const progress = computeGraduationProgress(student);
              return (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentHeader}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>{initials(student.full_name ?? student.email)}</Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.full_name ?? 'Aluno'}</Text>
                      <Text style={styles.studentEmail}>{student.email ?? '--'}</Text>
                    </View>
                  </View>
                  <View style={styles.studentMetaRow}>
                    <Text style={styles.studentMeta}>{getBeltName(student.belt)} - grau {student.degree}</Text>
                    <Text style={styles.studentMetaStrong}>{student.total_classes} aulas</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress.progressPct}%` }]} />
                  </View>
                  <Text style={styles.studentHint}>
                    {progress.isBlackBelt
                      ? 'Progressao definida pelo professor.'
                      : `${progress.currentCycleClasses}/${progress.classesPerGrade} aulas no ciclo`}
                  </Text>
                </View>
              );
            })}

            {filteredStudents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nenhum aluno encontrado</Text>
                <Text style={styles.emptyText}>Ajuste a busca ou atualize a lista.</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function initials(name: string | null | undefined) {
  return (name || 'Aluno')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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
    gap: 4,
    backgroundColor: '#111111',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
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
    backgroundColor: '#111111',
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
    color: '#FCA5A5',
    fontSize: 14,
  },
  searchCard: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    minHeight: 46,
    color: '#151515',
    fontSize: 16,
    fontWeight: '600',
  },
  studentCard: {
    gap: 12,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  studentAvatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#D7262E',
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  studentInfo: {
    flex: 1,
    gap: 2,
    backgroundColor: '#FFFFFF',
  },
  studentName: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '800',
  },
  studentEmail: {
    color: '#6B7280',
    fontSize: 13,
  },
  studentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  studentMeta: {
    flex: 1,
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },
  studentMetaStrong: {
    color: '#151515',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  studentHint: {
    color: '#6B7280',
    fontSize: 13,
  },
});

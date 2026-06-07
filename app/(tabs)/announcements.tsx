import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Text, View } from '@/components/Themed';
import {
  createAnnouncement,
  decideAllCheckIns,
  decideCheckIn,
  fetchCheckIns,
  registerAttendance,
} from '@/lib/api';
import { fetchAdminAttendances, fetchAnnouncements, fetchStudents } from '@/lib/data';
import { formatDate, formatDateTime } from '@/lib/format';
import { getBeltName } from '@/lib/graduation';
import { useAuth } from '@/contexts/auth';
import type { Announcement, AttendanceWithStudent, CheckIn, CheckInStatus, Profile } from '@/lib/types';

type AdminSection = 'avisos' | 'checkins' | 'catraca';

export default function AnnouncementsScreen() {
  const { profile } = useAuth();

  if (profile?.role === 'admin') {
    return <AdminAnnouncementsScreen />;
  }

  return <StudentAnnouncementsScreen />;
}

function StudentAnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const rows = await fetchAnnouncements();
      setAnnouncements(rows);
    } catch {
      setError('Nao foi possivel carregar os comunicados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAnnouncements();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAnnouncements]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Comunicados</Text>
          <Text style={styles.subtitle}>Novidades da academia</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable accessibilityRole="button" onPress={loadAnnouncements} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Atualizar</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator color="#D7262E" />
        ) : (
          <AnnouncementList announcements={announcements} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AdminAnnouncementsScreen() {
  const [activeSection, setActiveSection] = useState<AdminSection>('avisos');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [recentAttendances, setRecentAttendances] = useState<AttendanceWithStudent[]>([]);
  const [title, setTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAdminData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [announcementRows, checkInRows, studentRows, attendanceRows] = await Promise.all([
        fetchAnnouncements(),
        fetchCheckIns(),
        fetchStudents(),
        fetchAdminAttendances(10),
      ]);
      setAnnouncements(announcementRows);
      setCheckIns(checkInRows);
      setStudents(studentRows);
      setRecentAttendances(attendanceRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAdminData]);

  const pendingCheckIns = useMemo(() => checkIns.filter((item) => item.status === 'pending'), [checkIns]);
  const processedCheckIns = useMemo(() => checkIns.filter((item) => item.status !== 'pending'), [checkIns]);
  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students.slice(0, 8);

    return students
      .filter((student) => {
        const name = student.full_name?.toLowerCase() ?? '';
        const email = student.email?.toLowerCase() ?? '';
        return name.includes(term) || email.includes(term);
      })
      .slice(0, 12);
  }, [studentSearch, students]);

  async function handleCreateAnnouncement() {
    const nextTitle = title.trim();
    const nextMessage = messageBody.trim();

    if (!nextTitle || !nextMessage) {
      setError('Informe titulo e mensagem do comunicado.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await createAnnouncement(nextTitle, nextMessage);
      setTitle('');
      setMessageBody('');
      setMessage('Comunicado publicado com sucesso.');
      await loadAdminData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Nao foi possivel publicar o comunicado.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckInDecision(id: string, status: Exclude<CheckInStatus, 'pending'>) {
    setActionLoading(true);
    setError(null);
    try {
      await decideCheckIn(id, status);
      setMessage(status === 'approved' ? 'Check-in aprovado.' : 'Check-in rejeitado.');
      await loadAdminData();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Nao foi possivel processar o check-in.');
    } finally {
      setActionLoading(false);
    }
  }

  function confirmBulk(status: Exclude<CheckInStatus, 'pending'>) {
    if (pendingCheckIns.length === 0) return;

    const verb = status === 'approved' ? 'aprovar' : 'rejeitar';
    Alert.alert('Confirmar lote', `Deseja ${verb} ${pendingCheckIns.length} check-in(s) pendente(s)?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: status === 'approved' ? 'Aprovar' : 'Rejeitar',
        onPress: () => {
          void handleBulkCheckIns(status);
        },
      },
    ]);
  }

  async function handleBulkCheckIns(status: Exclude<CheckInStatus, 'pending'>) {
    setActionLoading(true);
    setError(null);
    try {
      const result = await decideAllCheckIns(status);
      setMessage(`${result.updated} check-in(s) processado(s).`);
      await loadAdminData();
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Nao foi possivel processar os check-ins.');
    } finally {
      setActionLoading(false);
    }
  }

  function confirmAttendance(student: Profile) {
    Alert.alert(
      'Registrar presenca',
      `Registrar presenca agora para ${student.full_name ?? student.email ?? 'este aluno'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: () => {
            void handleRegisterAttendance(student);
          },
        },
      ]
    );
  }

  async function handleRegisterAttendance(student: Profile) {
    setActionLoading(true);
    setError(null);
    try {
      await registerAttendance(student.id);
      setMessage(`Presenca registrada para ${student.full_name ?? 'o aluno'}.`);
      setStudentSearch('');
      await loadAdminData();
    } catch (attendanceError) {
      setError(attendanceError instanceof Error ? attendanceError.message : 'Nao foi possivel registrar a presenca.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin</Text>
          <Text style={styles.subtitle}>Comunicados, check-ins e catraca</Text>
        </View>

        <View style={styles.segmented}>
          <SegmentButton active={activeSection === 'avisos'} label="Avisos" onPress={() => setActiveSection('avisos')} />
          <SegmentButton
            active={activeSection === 'checkins'}
            label={`Check-ins ${pendingCheckIns.length}`}
            onPress={() => setActiveSection('checkins')}
          />
          <SegmentButton active={activeSection === 'catraca'} label="Catraca" onPress={() => setActiveSection('catraca')} />
        </View>

        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable accessibilityRole="button" onPress={loadAdminData} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Atualizar</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator color="#D7262E" />
        ) : activeSection === 'avisos' ? (
          <>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Novo comunicado</Text>
              <TextInput
                onChangeText={setTitle}
                placeholder="Titulo"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={title}
              />
              <TextInput
                multiline
                onChangeText={setMessageBody}
                placeholder="Mensagem"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
                value={messageBody}
              />
              <Pressable
                accessibilityRole="button"
                disabled={actionLoading}
                onPress={handleCreateAnnouncement}
                style={[styles.primaryButton, actionLoading && styles.disabledButton]}>
                <Text style={styles.primaryButtonText}>{actionLoading ? 'Publicando...' : 'Publicar'}</Text>
              </Pressable>
            </View>
            <AnnouncementList announcements={announcements} />
          </>
        ) : activeSection === 'checkins' ? (
          <CheckInPanel
            actionLoading={actionLoading}
            onBulk={confirmBulk}
            onDecide={handleCheckInDecision}
            pendingCheckIns={pendingCheckIns}
            processedCheckIns={processedCheckIns}
          />
        ) : (
          <AttendancePanel
            actionLoading={actionLoading}
            filteredStudents={filteredStudents}
            onRegister={confirmAttendance}
            recentAttendances={recentAttendances}
            search={studentSearch}
            setSearch={setStudentSearch}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  return (
    <View style={styles.list}>
      {announcements.map((announcement) => (
        <View key={announcement.id} style={styles.item}>
          <Text style={styles.itemDate}>{formatDate(announcement.created_at)}</Text>
          <Text style={styles.itemTitle}>{announcement.title}</Text>
          <Text style={styles.itemMessage}>{announcement.message}</Text>
        </View>
      ))}

      {announcements.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhum comunicado publicado</Text>
        </View>
      ) : null}
    </View>
  );
}

function CheckInPanel({
  actionLoading,
  onBulk,
  onDecide,
  pendingCheckIns,
  processedCheckIns,
}: {
  actionLoading: boolean;
  onBulk: (status: Exclude<CheckInStatus, 'pending'>) => void;
  onDecide: (id: string, status: Exclude<CheckInStatus, 'pending'>) => Promise<void>;
  pendingCheckIns: CheckIn[];
  processedCheckIns: CheckIn[];
}) {
  return (
    <>
      <View style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.formTitle}>Pendentes</Text>
          <Text style={styles.badge}>{pendingCheckIns.length}</Text>
        </View>
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={actionLoading || pendingCheckIns.length === 0}
            onPress={() => onBulk('approved')}
            style={styles.primarySmallButton}>
            <Text style={styles.primaryButtonText}>Aprovar todos</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={actionLoading || pendingCheckIns.length === 0}
            onPress={() => onBulk('rejected')}
            style={styles.secondarySmallButton}>
            <Text style={styles.secondaryButtonText}>Rejeitar todos</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.list}>
        {pendingCheckIns.map((checkIn) => (
          <View key={checkIn.id} style={styles.checkInCard}>
            <Text style={styles.cardTitle}>{checkIn.student?.full_name ?? 'Aluno'}</Text>
            <Text style={styles.cardMeta}>
              {getBeltName(checkIn.student?.belt)} - grau {checkIn.student?.degree ?? 0}
            </Text>
            <Text style={styles.cardMeta}>{formatDateTime(checkIn.created_at)}</Text>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                disabled={actionLoading}
                onPress={() => onDecide(checkIn.id, 'approved')}
                style={styles.primarySmallButton}>
                <Text style={styles.primaryButtonText}>Aprovar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={actionLoading}
                onPress={() => onDecide(checkIn.id, 'rejected')}
                style={styles.secondarySmallButton}>
                <Text style={styles.secondaryButtonText}>Rejeitar</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {pendingCheckIns.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum check-in pendente</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Processados recentes</Text>
        {processedCheckIns.slice(0, 8).map((checkIn) => (
          <View key={checkIn.id} style={styles.processedRow}>
            <View style={styles.processedBody}>
              <Text style={styles.cardTitle}>{checkIn.student?.full_name ?? 'Aluno'}</Text>
              <Text style={styles.cardMeta}>{formatDateTime(checkIn.created_at)}</Text>
            </View>
            <Text style={checkIn.status === 'approved' ? styles.approvedText : styles.rejectedText}>
              {checkIn.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

function AttendancePanel({
  actionLoading,
  filteredStudents,
  onRegister,
  recentAttendances,
  search,
  setSearch,
}: {
  actionLoading: boolean;
  filteredStudents: Profile[];
  onRegister: (student: Profile) => void;
  recentAttendances: AttendanceWithStudent[];
  search: string;
  setSearch: (value: string) => void;
}) {
  return (
    <>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Registrar presenca</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder="Buscar aluno"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={search}
        />
        {filteredStudents.map((student) => (
          <View key={student.id} style={styles.studentRow}>
            <View style={styles.processedBody}>
              <Text style={styles.cardTitle}>{student.full_name ?? 'Aluno'}</Text>
              <Text style={styles.cardMeta}>
                {getBeltName(student.belt)} - grau {student.degree}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={actionLoading}
              onPress={() => onRegister(student)}
              style={styles.rowButton}>
              <Text style={styles.rowButtonText}>Registrar</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Presencas recentes</Text>
        {recentAttendances.map((attendance) => (
          <View key={attendance.id} style={styles.processedRow}>
            <View style={styles.processedBody}>
              <Text style={styles.cardTitle}>{attendance.student?.full_name ?? 'Aluno'}</Text>
              <Text style={styles.cardMeta}>{formatDateTime(attendance.date)}</Text>
            </View>
            <Text style={styles.approvedText}>OK</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.segmentButton, active && styles.segmentActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
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
  segmented: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#111111',
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  segmentActive: {
    borderColor: '#D7262E',
    backgroundColor: '#D7262E',
  },
  segmentText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#FFFFFF',
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
    gap: 12,
    backgroundColor: '#111111',
  },
  item: {
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D7262E',
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  itemDate: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  itemTitle: {
    color: '#151515',
    fontSize: 18,
    fontWeight: '800',
  },
  itemMessage: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyCard: {
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '800',
  },
  formCard: {
    gap: 12,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    color: '#151515',
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#151515',
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.65,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  primarySmallButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#D7262E',
  },
  secondarySmallButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#D7262E',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#D7262E',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  badge: {
    minWidth: 28,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: '#D7262E',
  },
  checkInCard: {
    gap: 8,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    color: '#151515',
    fontSize: 15,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  processedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  processedBody: {
    flex: 1,
    gap: 2,
    backgroundColor: '#FFFFFF',
  },
  approvedText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '800',
  },
  rejectedText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  rowButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#D7262E',
  },
  rowButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#86EFAC',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});

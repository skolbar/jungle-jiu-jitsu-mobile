import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Text, View } from '@/components/Themed';
import {
  addStudentClasses,
  createUser,
  deleteStudent,
  updateStudent,
} from '@/lib/api';
import { useAuth } from '@/contexts/auth';
import { fetchStudentAttendances, fetchStudents } from '@/lib/data';
import { computeGraduationProgress, getBeltName } from '@/lib/graduation';
import { daysSince, formatDateTime } from '@/lib/format';
import type { Attendance, Belt, Profile } from '@/lib/types';

const BELT_ORDER: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
const DEGREE_OPTIONS = [0, 1, 2, 3, 4];

type StudentForm = {
  full_name: string;
  email: string;
  password: string;
  belt: Belt;
  degree: number;
};

type AdminMode = 'list' | 'create' | 'edit' | 'classes';

const emptyForm: StudentForm = {
  full_name: '',
  email: '',
  password: '',
  belt: 'white',
  degree: 0,
};

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
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [mode, setMode] = useState<AdminMode>('list');
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [classQuantity, setClassQuantity] = useState('1');

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

  const eligibleStudents = useMemo(
    () =>
      students.filter((student) => {
        const progress = computeGraduationProgress(student);
        return !progress.isBlackBelt && (progress.canPromoteBelt || progress.canPromoteGrade);
      }),
    [students]
  );

  function resetAction() {
    setMode('list');
    setSelectedStudent(null);
    setForm(emptyForm);
    setClassQuantity('1');
  }

  function openCreate() {
    setMessage(null);
    setError(null);
    setSelectedStudent(null);
    setForm(emptyForm);
    setMode('create');
  }

  function openEdit(student: Profile) {
    setMessage(null);
    setError(null);
    setSelectedStudent(student);
    setForm({
      full_name: student.full_name ?? '',
      email: student.email ?? '',
      password: '',
      belt: student.belt,
      degree: student.degree,
    });
    setMode('edit');
  }

  function openClasses(student: Profile) {
    setMessage(null);
    setError(null);
    setSelectedStudent(student);
    setClassQuantity('1');
    setMode('classes');
  }

  async function handleCreateStudent() {
    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName || !email || form.password.length < 6) {
      setError('Informe nome, email e uma senha com pelo menos 6 caracteres.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await createUser({
        full_name: fullName,
        email,
        password: form.password,
        belt: form.belt,
        degree: form.degree,
        role: 'student',
      });
      setMessage('Aluno criado com sucesso.');
      resetAction();
      await loadStudents();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Nao foi possivel criar o aluno.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateStudent() {
    if (!selectedStudent) return;

    const fullName = form.full_name.trim();
    if (!fullName) {
      setError('Nome nao pode ficar vazio.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const payload: { full_name?: string; belt?: Belt; degree?: number } = {};

      if (fullName !== (selectedStudent.full_name ?? '')) payload.full_name = fullName;
      if (form.belt !== selectedStudent.belt) payload.belt = form.belt;
      if (form.degree !== selectedStudent.degree) payload.degree = form.degree;

      if (Object.keys(payload).length === 0) {
        setMessage('Nenhuma alteracao para salvar.');
        resetAction();
        return;
      }

      await updateStudent(selectedStudent.id, payload);
      setMessage('Aluno atualizado com sucesso.');
      resetAction();
      await loadStudents();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Nao foi possivel atualizar o aluno.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddClasses() {
    if (!selectedStudent) return;
    const quantity = Number(classQuantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      setError('Informe uma quantidade entre 1 e 500 aulas.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await addStudentClasses(selectedStudent.id, quantity);
      setMessage(`${quantity} aula(s) adicionada(s) para ${selectedStudent.full_name ?? 'o aluno'}.`);
      resetAction();
      await loadStudents();
    } catch (classesError) {
      setError(classesError instanceof Error ? classesError.message : 'Nao foi possivel adicionar aulas.');
    } finally {
      setActionLoading(false);
    }
  }

  function handleRemoveStudent(student: Profile) {
    Alert.alert(
      'Remover aluno',
      `Deseja remover ${student.full_name ?? student.email ?? 'este aluno'}? Esta acao remove o perfil do sistema.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void removeStudent(student);
          },
        },
      ]
    );
  }

  async function removeStudent(student: Profile) {
    setActionLoading(true);
    setError(null);
    try {
      await deleteStudent(student.id);
      setMessage('Aluno removido com sucesso.');
      await loadStudents();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Nao foi possivel remover o aluno.');
    } finally {
      setActionLoading(false);
    }
  }

  function handlePromoteStudent(student: Profile) {
    const progress = computeGraduationProgress(student);
    if (progress.isBlackBelt || (!progress.canPromoteBelt && !progress.canPromoteGrade)) {
      setError('Aluno ainda nao esta elegivel para graduacao.');
      return;
    }

    const next = getNextGraduation(student, progress.canPromoteBelt);
    if (!next) {
      setError('Nao foi possivel calcular a proxima graduacao.');
      return;
    }

    const actionLabel = progress.canPromoteBelt ? 'Trocar faixa' : 'Conceder grau';
    Alert.alert(
      actionLabel,
      `${student.full_name ?? 'Aluno'} vai para Faixa ${getBeltName(next.belt)} - grau ${next.degree}. Confirmar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: actionLabel,
          onPress: () => {
            void promoteStudent(student, next);
          },
        },
      ]
    );
  }

  async function promoteStudent(student: Profile, next: { belt: Belt; degree: number }) {
    setActionLoading(true);
    setError(null);
    try {
      await updateStudent(student.id, { ...next, reset_cycle_classes: true });
      setMessage('Graduacao atualizada com sucesso.');
      await loadStudents();
    } catch (promoteError) {
      setError(promoteError instanceof Error ? promoteError.message : 'Nao foi possivel atualizar a graduacao.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alunos</Text>
          <Text style={styles.subtitle}>
            {students.length} aluno(s) cadastrado(s) | {eligibleStudents.length} apto(s) a graduar
          </Text>
        </View>

        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {mode === 'list' ? (
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={openCreate} style={styles.primarySmallButton}>
              <Text style={styles.primaryButtonText}>Novo aluno</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={loadStudents} style={styles.secondarySmallButton}>
              <Text style={styles.secondaryButtonText}>Atualizar</Text>
            </Pressable>
          </View>
        ) : (
          <StudentActionForm
            actionLoading={actionLoading}
            classQuantity={classQuantity}
            form={form}
            mode={mode}
            onCancel={resetAction}
            onChangeClassQuantity={setClassQuantity}
            onChangeForm={setForm}
            onSubmit={
              mode === 'create' ? handleCreateStudent : mode === 'edit' ? handleUpdateStudent : handleAddClasses
            }
            selectedStudent={selectedStudent}
          />
        )}

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

        {loading ? (
          <ActivityIndicator color="#D7262E" />
        ) : (
          <View style={styles.list}>
            {filteredStudents.map((student) => {
              const progress = computeGraduationProgress(student);
              const canPromote = !progress.isBlackBelt && (progress.canPromoteBelt || progress.canPromoteGrade);

              return (
                <View key={student.id} style={styles.studentCard}>
                  <Pressable accessibilityRole="button" onPress={() => openEdit(student)} style={styles.studentHeader}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>{initials(student.full_name ?? student.email)}</Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.full_name ?? 'Aluno'}</Text>
                      <Text style={styles.studentEmail}>{student.email ?? '--'}</Text>
                    </View>
                  </Pressable>
                  <View style={styles.studentMetaRow}>
                    <Text style={styles.studentMeta}>{getBeltName(student.belt)} - grau {student.degree}</Text>
                    <Text style={styles.studentMetaStrong}>{student.total_classes} aulas</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress.progressPct}%` }]} />
                  </View>
                  <Text style={styles.studentHint}>
                    {progress.isBlackBelt
                      ? 'Progressao manual pelo professor.'
                      : `${progress.currentCycleClasses}/${progress.classesPerGrade} aulas no ciclo`}
                  </Text>

                  <View style={styles.cardButtonGrid}>
                    <Pressable accessibilityRole="button" onPress={() => openClasses(student)} style={styles.cardButton}>
                      <Text style={styles.cardButtonText}>Aulas</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => openEdit(student)} style={styles.cardButton}>
                      <Text style={styles.cardButtonText}>Editar</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={!canPromote || actionLoading}
                      onPress={() => handlePromoteStudent(student)}
                      style={[styles.cardButton, !canPromote && styles.cardButtonDisabled]}>
                      <Text style={[styles.cardButtonText, !canPromote && styles.disabledText]}>
                        {progress.canPromoteBelt ? 'Faixa' : 'Grau'}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={actionLoading}
                      onPress={() => handleRemoveStudent(student)}
                      style={styles.removeButton}>
                      <Text style={styles.removeButtonText}>Remover</Text>
                    </Pressable>
                  </View>
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

function StudentActionForm({
  actionLoading,
  classQuantity,
  form,
  mode,
  onCancel,
  onChangeClassQuantity,
  onChangeForm,
  onSubmit,
  selectedStudent,
}: {
  actionLoading: boolean;
  classQuantity: string;
  form: StudentForm;
  mode: AdminMode;
  onCancel: () => void;
  onChangeClassQuantity: (value: string) => void;
  onChangeForm: (value: StudentForm) => void;
  onSubmit: () => Promise<void>;
  selectedStudent: Profile | null;
}) {
  const title = mode === 'create' ? 'Novo aluno' : mode === 'edit' ? 'Editar aluno' : 'Adicionar aulas';

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{title}</Text>
      {mode === 'classes' ? (
        <>
          <Text style={styles.formHint}>{selectedStudent?.full_name ?? selectedStudent?.email ?? 'Aluno'}</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={onChangeClassQuantity}
            placeholder="Quantidade de aulas"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={classQuantity}
          />
        </>
      ) : (
        <>
          <TextInput
            autoCapitalize="words"
            onChangeText={(full_name) => onChangeForm({ ...form, full_name })}
            placeholder="Nome completo"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={form.full_name}
          />
          {mode === 'create' ? (
            <>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={(email) => onChangeForm({ ...form, email })}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.email}
              />
              <TextInput
                onChangeText={(password) => onChangeForm({ ...form, password })}
                placeholder="Senha inicial"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={styles.input}
                value={form.password}
              />
            </>
          ) : null}
          <Text style={styles.inputLabel}>Faixa</Text>
          <View style={styles.chipGrid}>
            {BELT_ORDER.map((belt) => (
              <Pressable
                accessibilityRole="button"
                key={belt}
                onPress={() => onChangeForm({ ...form, belt })}
                style={[styles.chip, form.belt === belt && styles.chipSelected]}>
                <Text style={[styles.chipText, form.belt === belt && styles.chipTextSelected]}>{getBeltName(belt)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.inputLabel}>Grau</Text>
          <View style={styles.chipGrid}>
            {DEGREE_OPTIONS.map((degree) => (
              <Pressable
                accessibilityRole="button"
                key={degree}
                onPress={() => onChangeForm({ ...form, degree })}
                style={[styles.degreeChip, form.degree === degree && styles.chipSelected]}>
                <Text style={[styles.chipText, form.degree === degree && styles.chipTextSelected]}>{degree}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          disabled={actionLoading}
          onPress={onSubmit}
          style={[styles.primarySmallButton, actionLoading && styles.disabledButton]}>
          <Text style={styles.primaryButtonText}>{actionLoading ? 'Salvando...' : 'Salvar'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.secondarySmallButton}>
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getNextGraduation(student: Profile, promoteBelt: boolean): { belt: Belt; degree: number } | null {
  if (!promoteBelt) {
    return { belt: student.belt, degree: student.degree + 1 };
  }

  const currentIndex = BELT_ORDER.indexOf(student.belt);
  const nextBelt = BELT_ORDER[currentIndex + 1];
  return nextBelt ? { belt: nextBelt, degree: 0 } : null;
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
    lineHeight: 20,
  },
  successText: {
    color: '#86EFAC',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
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
    minHeight: 46,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#D7262E',
  },
  secondarySmallButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D7262E',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#D7262E',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.65,
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
  formHint: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
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
  inputLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '800',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  chip: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  degreeChip: {
    width: 44,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    borderColor: '#D7262E',
    backgroundColor: '#D7262E',
  },
  chipText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: '#FFFFFF',
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
  cardButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  cardButton: {
    minWidth: '46%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cardButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  cardButtonText: {
    color: '#151515',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  removeButton: {
    minWidth: '46%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    borderWidth: 1,
    borderColor: '#D7262E',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  removeButtonText: {
    color: '#D7262E',
    fontSize: 13,
    fontWeight: '800',
  },
});

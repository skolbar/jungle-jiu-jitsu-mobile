import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';
import { computeGraduationProgress, getBeltName } from '@/lib/graduation';

export default function HomeScreen() {
  const { authError, isProfileLoading, profile, refreshProfile, signOut, user } = useAuth();
  const graduation = profile ? computeGraduationProgress(profile) : null;
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

  const summary = [
    { label: 'Aulas no ciclo', value: graduation ? String(graduation.currentCycleClasses) : '--' },
    { label: 'Total de aulas', value: profile ? String(profile.total_classes) : '--' },
    { label: 'Proxima meta', value: nextGoal },
  ];

  return (
    <View style={styles.container}>
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

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={refreshProfile} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Atualizar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={signOut} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 48,
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

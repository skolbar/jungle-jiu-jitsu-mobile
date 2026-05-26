import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';
import { formatDate } from '@/lib/format';
import { getBeltName } from '@/lib/graduation';

function initials(name: string | null | undefined) {
  return (name || 'Aluno')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileScreen() {
  const { profile, refreshProfile, signOut, user } = useAuth();
  const displayName = profile?.full_name ?? user?.email ?? 'Aluno';
  const isAdmin = profile?.role === 'admin';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarFallback, isAdmin && styles.adminAvatarFallback]}>
              <Text style={styles.avatarText}>{isAdmin ? 'J' : initials(displayName)}</Text>
            </View>
          )}

          <Text style={styles.title}>{displayName}</Text>
          <Text style={styles.subtitle}>
            {isAdmin
              ? 'Administrador'
              : profile
                ? `Faixa ${getBeltName(profile.belt)} - grau ${profile.degree}`
                : 'Perfil do aluno'}
          </Text>
        </View>

        <View style={styles.card}>
          <Row label="Email" value={profile?.email ?? user?.email ?? '--'} />
          <Row label="Perfil" value={isAdmin ? 'Administrador' : 'Aluno'} />
          <Row label="Membro desde" value={formatDate(profile?.created_at)} />
          {isAdmin ? null : (
            <>
              <Row label="Total de aulas" value={profile ? String(profile.total_classes) : '--'} />
              <Row label="Aulas no ciclo" value={profile ? String(profile.cycle_classes) : '--'} />
              <Row label="Faixa e grau bloqueados" value={profile?.belt_locked ? 'Sim' : 'Nao'} />
            </>
          )}
        </View>

        <Pressable accessibilityRole="button" onPress={refreshProfile} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Atualizar perfil</Text>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={signOut} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Sair</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111111',
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarFallback: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 46,
    backgroundColor: '#D7262E',
  },
  adminAvatarFallback: {
    borderRadius: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
  },
  card: {
    gap: 2,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
  },
  rowLabel: {
    flex: 1,
    color: '#6B7280',
    fontSize: 14,
  },
  rowValue: {
    flex: 1,
    color: '#151515',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
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
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

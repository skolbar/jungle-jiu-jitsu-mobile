import { Image, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { Text, View } from '@/components/Themed';
import { lockStudentBelt, updatePassword, updateProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { formatDate } from '@/lib/format';
import { getBeltName } from '@/lib/graduation';
import type { Belt } from '@/lib/types';

const BELT_OPTIONS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
const DEGREE_OPTIONS = [0, 1, 2, 3, 4];

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

  const [fullName, setFullName] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [beltDraft, setBeltDraft] = useState<Belt | null>(null);
  const [degreeDraft, setDegreeDraft] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingBelt, setSavingBelt] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const visibleFullName = fullName ?? profile?.full_name ?? '';
  const visibleBelt = beltDraft ?? profile?.belt ?? 'white';
  const visibleDegree = degreeDraft ?? profile?.degree ?? 0;

  async function handleAvatarUpload() {
    if (!user?.id || !supabase) return;

    setUploadingAvatar(true);
    setError(null);
    setMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Permissao para acessar fotos foi negada.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: 'images',
        quality: 0.82,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const fileExt = getImageExtension(asset.uri, asset.mimeType);
      const filePath = `${user.id}/avatar.${fileExt}`;
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, arrayBuffer, {
        contentType: asset.mimeType ?? `image/${fileExt}`,
        upsert: true,
      });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      await updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });
      await refreshProfile();
      setMessage('Foto atualizada com sucesso.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Nao foi possivel atualizar a foto.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    const nextName = visibleFullName.trim();
    if (!nextName) {
      setError('Nome nao pode ficar vazio.');
      return;
    }

    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({ full_name: nextName });
      await refreshProfile();
      setFullName(null);
      setMessage('Perfil atualizado com sucesso.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel atualizar o perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas nao coincidem.');
      return;
    }

    setSavingPassword(true);
    setError(null);
    setMessage(null);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Senha alterada com sucesso.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Nao foi possivel alterar a senha.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLockBelt() {
    if (!profile || profile.belt_locked) return;

    setSavingBelt(true);
    setError(null);
    setMessage(null);
    try {
      await lockStudentBelt(visibleBelt, visibleDegree);
      await refreshProfile();
      setBeltDraft(null);
      setDegreeDraft(null);
      setMessage('Faixa e grau definidos com sucesso.');
    } catch (beltError) {
      setError(beltError instanceof Error ? beltError.message : 'Nao foi possivel definir faixa e grau.');
    } finally {
      setSavingBelt(false);
    }
  }

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

        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Foto de perfil</Text>
          <Pressable
            accessibilityRole="button"
            disabled={uploadingAvatar}
            onPress={handleAvatarUpload}
            style={[styles.secondaryButton, uploadingAvatar && styles.disabledButton]}>
            <Text style={styles.secondaryButtonText}>{uploadingAvatar ? 'Enviando...' : 'Alterar foto'}</Text>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Informacoes do perfil</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={setFullName}
            placeholder="Nome completo"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={visibleFullName}
          />
          <Pressable
            accessibilityRole="button"
            disabled={savingProfile}
            onPress={handleSaveProfile}
            style={[styles.primaryButton, savingProfile && styles.disabledButton]}>
            <Text style={styles.primaryButtonText}>{savingProfile ? 'Salvando...' : 'Salvar perfil'}</Text>
          </Pressable>
        </View>

        {!isAdmin && profile ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Faixa e grau</Text>
            {profile.belt_locked ? (
              <Text style={styles.formHint}>
                Definido como Faixa {getBeltName(profile.belt)} - grau {profile.degree}. Para alterar novamente, fale
                com o professor.
              </Text>
            ) : (
              <>
                <Text style={styles.formHint}>Voce pode definir faixa e grau uma unica vez.</Text>
                <Text style={styles.inputLabel}>Faixa</Text>
                <View style={styles.chipGrid}>
                  {BELT_OPTIONS.map((belt) => (
                    <Pressable
                      accessibilityRole="button"
                      key={belt}
                      onPress={() => setBeltDraft(belt)}
                      style={[styles.chip, visibleBelt === belt && styles.chipSelected]}>
                      <Text style={[styles.chipText, visibleBelt === belt && styles.chipTextSelected]}>
                        {getBeltName(belt)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.inputLabel}>Grau</Text>
                <View style={styles.chipGrid}>
                  {DEGREE_OPTIONS.map((degree) => (
                    <Pressable
                      accessibilityRole="button"
                      key={degree}
                      onPress={() => setDegreeDraft(degree)}
                      style={[styles.degreeChip, visibleDegree === degree && styles.chipSelected]}>
                      <Text style={[styles.chipText, visibleDegree === degree && styles.chipTextSelected]}>{degree}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={savingBelt}
                  onPress={handleLockBelt}
                  style={[styles.primaryButton, savingBelt && styles.disabledButton]}>
                  <Text style={styles.primaryButtonText}>{savingBelt ? 'Salvando...' : 'Salvar e bloquear'}</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Alterar senha</Text>
          <TextInput
            onChangeText={setNewPassword}
            placeholder="Nova senha"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            style={styles.input}
            value={newPassword}
          />
          <TextInput
            onChangeText={setConfirmPassword}
            placeholder="Confirmar nova senha"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
          />
          <Pressable
            accessibilityRole="button"
            disabled={savingPassword}
            onPress={handleChangePassword}
            style={[styles.secondaryButton, savingPassword && styles.disabledButton]}>
            <Text style={styles.secondaryButtonText}>{savingPassword ? 'Alterando...' : 'Alterar senha'}</Text>
          </Pressable>
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

function getImageExtension(uri: string, mimeType?: string) {
  if (mimeType?.includes('png')) return 'png';
  if (mimeType?.includes('webp')) return 'webp';

  const fromUri = uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  return fromUri && fromUri.length <= 4 ? fromUri : 'jpg';
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
    lineHeight: 20,
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
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D7262E',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#D7262E',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.65,
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

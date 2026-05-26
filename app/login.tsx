import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';

export default function LoginScreen() {
  const { authError, isConfigured, session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Redirect href="/" />;
  }

  const canSubmit = isConfigured && email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleLogin() {
    if (!canSubmit) {
      setLocalError('Informe email e senha para entrar.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setLocalError('Nao foi possivel entrar. Confira seus dados.');
    }
    setSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>J</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>Jungle Jiu-Jitsu</Text>
            <Text style={styles.subtitle}>Entrar no app do aluno</Text>
          </View>

          {!isConfigured ? (
            <Text style={styles.errorText}>Configure as variaveis EXPO_PUBLIC_SUPABASE_* antes de entrar.</Text>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!submitting}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              autoCapitalize="none"
              editable={!submitting}
              onChangeText={setPassword}
              placeholder="Sua senha"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          {localError || authError ? <Text style={styles.errorText}>{localError ?? authError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={handleLogin}
            style={[styles.primaryButton, !canSubmit && styles.disabledButton]}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Entrar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    gap: 18,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  logo: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  heading: {
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#151515',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
  },
  fieldGroup: {
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    color: '#151515',
    fontSize: 16,
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

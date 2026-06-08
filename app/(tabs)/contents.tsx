import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { createContent, deleteContent } from '@/lib/api';
import { useAuth } from '@/contexts/auth';
import { fetchContents } from '@/lib/data';
import { canAccessByGraduation, getBeltName } from '@/lib/graduation';
import { formatModuleTitle, getModuleDescription, groupContentByModule } from '@/lib/content';
import type { Belt, Content } from '@/lib/types';

const BELT_OPTIONS: Belt[] = ['white', 'blue', 'purple', 'brown', 'black'];
const DEGREE_OPTIONS = [0, 1, 2, 3, 4];

type ContentForm = {
  title: string;
  description: string;
  url: string;
  module_slug: string;
  category: string;
  required_belt: Belt;
  required_degree: number;
};

const emptyContentForm: ContentForm = {
  title: '',
  description: '',
  url: '',
  module_slug: 'guarda-fechada',
  category: 'Raspagens',
  required_belt: 'white',
  required_degree: 0,
};

export default function ContentsScreen() {
  const { profile } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<ContentForm>(emptyContentForm);

  const loadContents = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const rows = await fetchContents();
      setContents(rows);
    } catch {
      setError('Nao foi possivel carregar os conteudos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadContents();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadContents]);

  const grouped = useMemo(() => groupContentByModule(contents), [contents]);
  const moduleSlugs = useMemo(() => Object.keys(grouped).sort(), [grouped]);
  const activeModule = selectedModule ?? moduleSlugs[0] ?? null;
  const selectedContents = activeModule ? grouped[activeModule] ?? [] : [];
  const isAdmin = profile?.role === 'admin';

  async function openContent(url: string | null) {
    const targetUrl = normalizeContentUrl(url);

    if (!targetUrl) {
      setError('Este conteudo nao possui um link valido.');
      return;
    }

    setError(null);
    setMessage(null);

    try {
      await Linking.openURL(targetUrl);
    } catch {
      setError('Nao foi possivel abrir o conteudo neste aparelho. Verifique se ha um navegador ou app do YouTube instalado.');
    }
  }

  async function handleCreateContent() {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      module_slug: slugify(form.module_slug),
      category: form.category.trim() || 'Geral',
      required_belt: form.required_belt,
      required_degree: form.required_degree,
      type: 'video',
    };

    if (!payload.title || !payload.url || !payload.module_slug || !payload.category) {
      setError('Informe titulo, URL, modulo e categoria.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await createContent(payload);
      setMessage('Conteudo criado com sucesso.');
      setForm(emptyContentForm);
      setShowCreateForm(false);
      await loadContents();
      setSelectedModule(payload.module_slug);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Nao foi possivel criar o conteudo.');
    } finally {
      setActionLoading(false);
    }
  }

  function confirmDeleteContent(content: Content) {
    Alert.alert('Excluir conteudo', `Excluir "${content.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void handleDeleteContent(content);
        },
      },
    ]);
  }

  async function handleDeleteContent(content: Content) {
    setActionLoading(true);
    setError(null);
    try {
      await deleteContent(content.id);
      setMessage('Conteudo excluido com sucesso.');
      await loadContents();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Nao foi possivel excluir o conteudo.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Conteudos</Text>
          <Text style={styles.subtitle}>{contents.length} aula(s) cadastrada(s)</Text>
        </View>

        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" onPress={loadContents} style={styles.secondarySmallButton}>
            <Text style={styles.secondaryButtonText}>Atualizar</Text>
          </Pressable>
          {isAdmin ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowCreateForm((current) => !current)}
              style={styles.primarySmallButton}>
              <Text style={styles.primaryButtonText}>{showCreateForm ? 'Fechar' : 'Novo'}</Text>
            </Pressable>
          ) : null}
        </View>

        {isAdmin && showCreateForm ? (
          <ContentFormCard
            actionLoading={actionLoading}
            form={form}
            onChange={setForm}
            onSubmit={handleCreateContent}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator color="#D7262E" />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moduleScroller}>
              {moduleSlugs.map((slug) => {
                const selected = slug === activeModule;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={slug}
                    onPress={() => setSelectedModule(slug)}
                    style={[styles.moduleChip, selected && styles.moduleChipSelected]}>
                    <Text style={[styles.moduleChipText, selected && styles.moduleChipTextSelected]}>
                      {formatModuleTitle(slug)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {activeModule ? (
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleTitle}>{formatModuleTitle(activeModule)}</Text>
                <Text style={styles.moduleDescription}>{getModuleDescription(activeModule)}</Text>
              </View>
            ) : null}

            <View style={styles.list}>
              {selectedContents.map((content) => {
                const unlocked =
                  isAdmin ||
                  (profile ? canAccessByGraduation(profile, content.required_belt, content.required_degree) : false);
                return (
                  <View key={content.id} style={[styles.item, !unlocked && styles.itemLocked]}>
                    <View style={[styles.itemHeader, !unlocked && styles.itemHeaderLocked]}>
                      <Text style={[styles.itemCategory, !unlocked && styles.lockedText]}>
                        {content.category || 'Geral'}
                      </Text>
                      <Text style={styles.itemLock}>{unlocked ? 'Disponivel' : 'Bloqueado'}</Text>
                    </View>
                    <Text style={[styles.itemTitle, !unlocked && styles.lockedTitle]}>{content.title}</Text>
                    {content.description ? (
                      <Text style={[styles.itemDescription, !unlocked && styles.lockedText]}>
                        {content.description}
                      </Text>
                    ) : null}
                    <Text style={[styles.itemRequirement, !unlocked && styles.lockedText]}>
                      {getBeltName(content.required_belt)}
                      {content.required_degree > 0 ? ` - grau ${content.required_degree}` : ''}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={!unlocked || !content.url}
                      onPress={() => openContent(content.url)}
                      style={[styles.openButton, (!unlocked || !content.url) && styles.openButtonDisabled]}>
                      <Text style={styles.openButtonText}>{unlocked ? 'Abrir conteudo' : 'Indisponivel'}</Text>
                    </Pressable>
                    {isAdmin ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={actionLoading}
                        onPress={() => confirmDeleteContent(content)}
                        style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>Excluir conteudo</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}

              {contents.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Nenhum conteudo encontrado</Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContentFormCard({
  actionLoading,
  form,
  onChange,
  onSubmit,
}: {
  actionLoading: boolean;
  form: ContentForm;
  onChange: (value: ContentForm) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Novo conteudo</Text>
      <TextInput
        onChangeText={(title) => onChange({ ...form, title })}
        placeholder="Titulo"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={form.title}
      />
      <TextInput
        multiline
        onChangeText={(description) => onChange({ ...form, description })}
        placeholder="Descricao"
        placeholderTextColor="#9CA3AF"
        style={[styles.input, styles.textArea]}
        textAlignVertical="top"
        value={form.description}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onChangeText={(url) => onChange({ ...form, url })}
        placeholder="https://..."
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={form.url}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(module_slug) => onChange({ ...form, module_slug })}
        placeholder="Modulo. Ex: guarda-fechada"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={form.module_slug}
      />
      <TextInput
        onChangeText={(category) => onChange({ ...form, category })}
        placeholder="Categoria"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={form.category}
      />
      <Text style={styles.inputLabel}>Faixa minima</Text>
      <View style={styles.chipGrid}>
        {BELT_OPTIONS.map((belt) => (
          <Pressable
            accessibilityRole="button"
            key={belt}
            onPress={() => onChange({ ...form, required_belt: belt })}
            style={[styles.chip, form.required_belt === belt && styles.chipSelected]}>
            <Text style={[styles.chipText, form.required_belt === belt && styles.chipTextSelected]}>
              {getBeltName(belt)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.inputLabel}>Grau minimo</Text>
      <View style={styles.chipGrid}>
        {DEGREE_OPTIONS.map((degree) => (
          <Pressable
            accessibilityRole="button"
            key={degree}
            onPress={() => onChange({ ...form, required_degree: degree })}
            style={[styles.degreeChip, form.required_degree === degree && styles.chipSelected]}>
            <Text style={[styles.chipText, form.required_degree === degree && styles.chipTextSelected]}>{degree}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={actionLoading}
        onPress={onSubmit}
        style={[styles.primaryButton, actionLoading && styles.disabledButton]}>
        <Text style={styles.primaryButtonText}>{actionLoading ? 'Salvando...' : 'Criar conteudo'}</Text>
      </Pressable>
    </View>
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeContentUrl(url: string | null) {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `https://v0-jiu-jitsu-mvp.vercel.app${trimmed}`;
  return `https://${trimmed}`;
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  primarySmallButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  secondarySmallButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D7262E',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
    minHeight: 96,
    paddingTop: 12,
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
  moduleScroller: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  moduleChip: {
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  moduleChipSelected: {
    borderColor: '#D7262E',
    backgroundColor: '#D7262E',
  },
  moduleChipText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '800',
  },
  moduleChipTextSelected: {
    color: '#FFFFFF',
  },
  moduleHeader: {
    gap: 6,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#151515',
  },
  moduleTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  moduleDescription: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    gap: 12,
    backgroundColor: '#111111',
  },
  item: {
    gap: 10,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  itemLocked: {
    backgroundColor: '#F3F4F6',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  itemHeaderLocked: {
    backgroundColor: '#F3F4F6',
  },
  itemCategory: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '800',
  },
  itemLock: {
    color: '#D7262E',
    fontSize: 13,
    fontWeight: '800',
  },
  lockedTitle: {
    color: '#4B5563',
  },
  lockedText: {
    color: '#6B7280',
  },
  itemTitle: {
    color: '#151515',
    fontSize: 18,
    fontWeight: '800',
  },
  itemDescription: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  itemRequirement: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  openButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    backgroundColor: '#D7262E',
  },
  openButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderWidth: 1,
    borderColor: '#D7262E',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  deleteButtonText: {
    color: '#D7262E',
    fontSize: 14,
    fontWeight: '800',
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

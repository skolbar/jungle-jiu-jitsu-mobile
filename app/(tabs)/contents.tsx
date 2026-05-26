import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';
import { fetchContents } from '@/lib/data';
import { canAccessByGraduation, getBeltName } from '@/lib/graduation';
import { formatModuleTitle, getModuleDescription, groupContentByModule } from '@/lib/content';
import type { Content } from '@/lib/types';

export default function ContentsScreen() {
  const { profile } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

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

  async function openContent(url: string | null) {
    if (!url) {
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conteudos</Text>
        <Text style={styles.subtitle}>{contents.length} aula(s) cadastrada(s)</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable accessibilityRole="button" onPress={loadContents} style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>Atualizar</Text>
      </Pressable>

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
              const unlocked = profile ? canAccessByGraduation(profile, content.required_belt, content.required_degree) : false;
              return (
                <View key={content.id} style={[styles.item, !unlocked && styles.itemLocked]}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemCategory}>{content.category || 'Geral'}</Text>
                    <Text style={styles.itemLock}>{unlocked ? 'Disponivel' : 'Bloqueado'}</Text>
                  </View>
                  <Text style={styles.itemTitle}>{content.title}</Text>
                  {content.description ? <Text style={styles.itemDescription}>{content.description}</Text> : null}
                  <Text style={styles.itemRequirement}>
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
    gap: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
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
  },
  item: {
    gap: 10,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  itemLocked: {
    opacity: 0.62,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
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
    color: '#B91C1C',
    fontSize: 14,
  },
});

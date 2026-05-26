import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { fetchAnnouncements } from '@/lib/data';
import { formatDate } from '@/lib/format';
import type { Announcement } from '@/lib/types';

export default function AnnouncementsScreen() {
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
  list: {
    gap: 12,
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
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
});

import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/auth';

export default function AlertsScreen() {
  const { profile } = useAuth();
  const alerts = [
    { title: 'Presenca registrada', status: 'Aguardando backend de notificacoes' },
    { title: 'Ausencia prolongada', status: 'Planejado para fase 5' },
    {
      title: 'Proximo da graduacao',
      status: profile ? `${profile.cycle_classes} aulas no ciclo atual` : 'Perfil nao carregado',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alertas</Text>
      <View style={styles.list}>
        {alerts.map((alert) => (
          <View key={alert.title} style={styles.item}>
            <Text style={styles.itemTitle}>{alert.title}</Text>
            <Text style={styles.itemStatus}>{alert.status}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  item: {
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  itemTitle: {
    color: '#151515',
    fontSize: 17,
    fontWeight: '700',
  },
  itemStatus: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 6,
  },
});

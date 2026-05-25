import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

const alerts = [
  'Presenca registrada',
  'Ausencia prolongada',
  'Proximo da graduacao',
];

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alertas</Text>
      <View style={styles.list}>
        {alerts.map((alert) => (
          <View key={alert} style={styles.item}>
            <Text style={styles.itemTitle}>{alert}</Text>
            <Text style={styles.itemStatus}>Pendente</Text>
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

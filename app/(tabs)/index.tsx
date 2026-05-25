import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

const summary = [
  { label: 'Aulas no ciclo', value: '--' },
  { label: 'Ultima presenca', value: '--' },
  { label: 'Proxima meta', value: '--' },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>J</Text>
        </View>
        <Text style={styles.title}>Jungle Jiu-Jitsu</Text>
        <Text style={styles.subtitle}>Area do aluno</Text>
      </View>

      <View style={styles.panel}>
        {summary.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Entrar</Text>
      </Pressable>
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
});

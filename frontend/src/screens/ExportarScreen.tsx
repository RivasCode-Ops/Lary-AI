import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Exportar'>;

export default function ExportarScreen({ navigation }: Props) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `LARY AI - Exportação RDO\n\nPeríodo: 01/06 a 30/06\nTotal: 42 RDOs\nEconomia: ~R$ 14.280\nTempo médio: 6min/RDO`,
      });
    } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.successCard}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>RDO completo em 6 minutos!</Text>
        <Text style={styles.successSub}>Contra 2-4h no processo manual</Text>
        <Text style={styles.successSavings}>Economia de ~R$ 340 neste RDO</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 Exportar dados</Text>

        <View style={styles.formatRow}>
          <TouchableOpacity style={[styles.formatBtn, styles.formatActive]}>
            <Text style={styles.formatActiveText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.formatBtn}>
            <Text style={styles.formatText}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.formatBtn}>
            <Text style={styles.formatText}>API (JSON)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert('✅', 'CSV exportado')}>
          <Text style={styles.exportBtnText}>📥 Baixar CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappBtn} onPress={handleShare}>
          <Text style={styles.whatsappBtnText}>📤 Enviar para o ERP</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📈 Impacto acumulado</Text>
        <View style={styles.row}>
          <Text style={styles.rowKey}>RDOs processados</Text>
          <Text style={styles.rowValue}>42</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowKey}>Horas economizadas</Text>
          <Text style={styles.rowValue}>~84h</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowKey}>Economia estimada</Text>
          <Text style={[styles.rowValue, { color: '#16a34a' }]}>~R$ 14.280</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowKey}>Tempo médio/RDO</Text>
          <Text style={styles.rowValue}>6min 12s</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.newRDOBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.newRDOBtnText}>🔄 Novo RDO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={() => Alert.alert('✅', 'RDO encerrado')}>
          <Text style={styles.closeBtnText}>📋 Encerrar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  successCard: {
    backgroundColor: '#f0fdf4', borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#86efac',
  },
  successEmoji: { fontSize: 40 },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#166534', marginTop: 8 },
  successSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  successSavings: { fontSize: 14, fontWeight: '600', color: '#16a34a', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  formatRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  formatBtn: {
    flex: 1, padding: 10, borderRadius: 8,
    backgroundColor: '#f1f5f9', alignItems: 'center',
  },
  formatActive: { backgroundColor: '#0284c7' },
  formatText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  formatActiveText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  exportBtn: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  exportBtnText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  whatsappBtn: { backgroundColor: '#25D366', padding: 12, borderRadius: 10, alignItems: 'center' },
  whatsappBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowKey: { fontSize: 13, color: '#64748b' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  actionRow: { flexDirection: 'row', gap: 8 },
  newRDOBtn: { flex: 1, backgroundColor: '#0284c7', padding: 16, borderRadius: 14, alignItems: 'center' },
  newRDOBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  closeBtn: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
});

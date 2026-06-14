import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'PDF'>;

export default function PDFScreen({ route, navigation }: Props) {
  const { hash, auditTrail } = route.params as any;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `LARY AI - RDO #042\n\nHash: ${hash}\n\nDocumento com validade jurídica.`,
        title: 'Compartilhar RDO',
      });
    } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.banner, styles.bannerSuccess]}>
        <Text style={styles.bannerText}>✅ RDO aprovado e registrado na trilha de auditoria</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.pdfIcon}>
          <Text style={styles.pdfIconText}>📄</Text>
        </View>
        <Text style={styles.rdoTitle}>RDO #042 — APROVADO</Text>
        <Text style={styles.rdoDate}>13/06/2026 • 09:41</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowKey}>Aprovado por</Text>
          <Text style={styles.rowValue}>Eng. João Resende</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowKey}>Hash SHA-256</Text>
          <Text style={styles.rowValueSmall}>{hash}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📋 Trilha de auditoria</Text>
        {auditTrail.map((entry: any, i: number) => (
          <View key={i} style={styles.auditRow}>
            <View style={styles.auditDot} />
            <View style={styles.auditContent}>
              <Text style={styles.auditAction}>{entry.action}</Text>
              <Text style={styles.auditMeta}>{entry.timestamp} — {entry.user}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>📤 Compartilhar no WhatsApp</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('Exportar', { rdoId: 'mock-id' })}
      >
        <Text style={styles.primaryBtnText}>→ Exportar dados</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  banner: { padding: 12, borderRadius: 12, borderWidth: 1 },
  bannerSuccess: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  bannerText: { fontSize: 13, fontWeight: '600', color: '#166534' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  pdfIcon: { alignItems: 'center', marginBottom: 8 },
  pdfIconText: { fontSize: 40 },
  rdoTitle: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#0f172a' },
  rdoDate: { textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowKey: { fontSize: 13, color: '#64748b' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  rowValueSmall: { fontSize: 11, fontWeight: '500', color: '#0f172a', fontFamily: 'monospace', maxWidth: 200 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8, textTransform: 'uppercase' },
  auditRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  auditDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0284c7', marginTop: 4 },
  auditContent: { flex: 1 },
  auditAction: { fontSize: 13, color: '#0f172a' },
  auditMeta: { fontSize: 11, color: '#64748b' },
  shareBtn: {
    backgroundColor: '#25D366', padding: 14, borderRadius: 14,
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  primaryBtn: { backgroundColor: '#0284c7', padding: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

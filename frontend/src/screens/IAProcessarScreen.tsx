import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'IAProcessar'>;

interface ExtractedField {
  field_name: string;
  value: string;
  confidence: number;
  requires_review: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  service: 'Serviço executado',
  team: 'Equipe alocada',
  weather: 'Condição climática',
  materials: 'Materiais utilizados',
  equipment: 'Equipamentos em uso',
  occurrences: 'Ocorrências relevantes',
  measurements: 'Medições/quantidades',
};

export default function IAProcessarScreen({ route, navigation }: Props) {
  const { rawText } = route.params as any;
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate IA processing delay
    const timer = setTimeout(() => {
      const mockFields: ExtractedField[] = [
        { field_name: 'service', value: 'Concretagem de Laje L02', confidence: 98, requires_review: false },
        { field_name: 'team', value: 'Turma do João (8 operários)', confidence: 95, requires_review: false },
        { field_name: 'weather', value: 'Chuva leve (14h-15h)', confidence: 72, requires_review: true },
        { field_name: 'materials', value: '42 m³ concreto usinado (4 caminhões)', confidence: 96, requires_review: false },
        { field_name: 'measurements', value: '12,5 m³', confidence: 68, requires_review: true },
      ];
      setFields(mockFields);
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [rawText]);

  const needsReview = fields.filter(f => f.requires_review);
  const avgConfidence = fields.length
    ? Math.round(fields.reduce((s, f) => s + f.confidence, 0) / fields.length)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>LARY AI está analisando o apontamento...</Text>
        </View>
      ) : (
        <>
          <View style={[styles.banner, needsReview.length > 0 ? styles.bannerWarning : styles.bannerSuccess]}>
            <Text style={[styles.bannerText, needsReview.length > 0 ? styles.bannerTextWarning : styles.bannerTextSuccess]}>
              {needsReview.length > 0
                ? `⚠️ ${needsReview.length} campo(s) com confiança baixa — revise abaixo`
                : `✅ IA processou com confiança média de ${avgConfidence}%`}
            </Text>
          </View>

          {fields.map(field => (
            <View key={field.field_name} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.fieldLabel}>
                  {FIELD_LABELS[field.field_name] || field.field_name}
                </Text>
                <View style={[
                  styles.confBadge,
                  field.requires_review ? styles.confBadgeLow : styles.confBadgeHigh,
                ]}>
                  <Text style={[
                    styles.confText,
                    field.requires_review ? styles.confTextLow : styles.confTextHigh,
                  ]}>
                    {field.confidence}%
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.fieldValue,
                field.requires_review && styles.fieldValueReview,
              ]}>
                {field.value}
              </Text>
              {field.requires_review && (
                <Text style={styles.reviewHint}>⚠️ Confiança abaixo de 85% — revise manualmente</Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate('Revisar', { rdoId: 'mock-id', fields })}
          >
            <Text style={styles.continueBtnText}>✓ Revisar campos</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#64748b' },
  banner: { padding: 12, borderRadius: 12, borderWidth: 1 },
  bannerSuccess: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  bannerWarning: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
  bannerText: { fontSize: 13, fontWeight: '600' },
  bannerTextSuccess: { color: '#166534' },
  bannerTextWarning: { color: '#92400e' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  confBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  confBadgeHigh: { backgroundColor: '#dcfce7' },
  confBadgeLow: { backgroundColor: '#fee2e2' },
  confText: { fontSize: 11, fontWeight: '700' },
  confTextHigh: { color: '#16a34a' },
  confTextLow: { color: '#dc2626' },
  fieldValue: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  fieldValueReview: { color: '#92400e' },
  reviewHint: { fontSize: 11, color: '#dc2626', marginTop: 4 },
  continueBtn: {
    backgroundColor: '#0284c7', padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

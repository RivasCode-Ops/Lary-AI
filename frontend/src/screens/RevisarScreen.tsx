import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Revisar'>;

export default function RevisarScreen({ route, navigation }: Props) {
  const { fields } = route.params as any;
  const [confirmedReview, setConfirmedReview] = useState(false);
  const [engineerNotes, setEngineerNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const needsReview = fields.filter((f: any) => f.requires_review);

  const handleApprove = async () => {
    if (!confirmedReview) {
      Alert.alert('Confirmação necessária', 'Marque a declaração de verificação antes de aprovar');
      return;
    }
    setIsApproving(true);
    // Simulate API call
    setTimeout(() => {
      setIsApproving(false);
      const hash = 'a3f8c2d1e5b79f4e2c1d8a6b3f7e0d9c2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8';
      navigation.navigate('PDF', { rdoId: 'mock-id', hash, auditTrail: [
        { action: 'Apontamento criado', timestamp: '09:35', user: 'Mestre (offline)' },
        { action: 'IA processou', timestamp: '09:37', user: 'LARY AI' },
        { action: 'Engenheiro aprovou', timestamp: '09:40', user: 'Eng. João' },
      ]});
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>RDO #042 — Pendente</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{needsReview.length} alerta(s)</Text>
        </View>
      </View>

      {fields.map((field: any) => (
        <View key={field.field_name} style={[
          styles.card,
          field.requires_review && styles.cardWarning,
        ]}>
          <View style={styles.cardHeader}>
            <Text style={styles.fieldLabel}>{field.field_name}</Text>
            <Text style={[styles.confText, field.requires_review ? styles.confLow : styles.confHigh]}>
              {field.confidence}%
            </Text>
          </View>
          <TextInput
            style={[styles.fieldInput, field.requires_review && styles.fieldInputWarning]}
            defaultValue={field.value}
          />
          {field.requires_review && (
            <Text style={styles.alertText}>⚠️ Confiança baixa — verifique este campo</Text>
          )}
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.label}>Observação do engenheiro</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={engineerNotes}
          onChangeText={setEngineerNotes}
          placeholder="Adicione sua observação técnica..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.confirmCard}>
        <Switch
          value={confirmedReview}
          onValueChange={setConfirmedReview}
          trackColor={{ false: '#cbd5e1', true: '#22c55e' }}
          thumbColor={confirmedReview ? '#16a34a' : '#f1f5f9'}
        />
        <Text style={styles.confirmText}>
          Declaro que verifiquei os campos com alerta e confirmo os dados do RDO
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.approveBtn, !confirmedReview && styles.approveBtnDisabled, isApproving && styles.approveBtnDisabled]}
        onPress={handleApprove}
        disabled={!confirmedReview || isApproving}
      >
        <Text style={styles.approveBtnText}>
          {isApproving ? 'Aprovando...' : '✓ Aprovar RDO'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  headerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  headerBadgeText: { fontSize: 11, fontWeight: '600', color: '#92400e' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cardWarning: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  confText: { fontSize: 11, fontWeight: '700' },
  confHigh: { color: '#16a34a' },
  confLow: { color: '#dc2626' },
  fieldInput: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    padding: 10, fontSize: 14, color: '#0f172a',
  },
  fieldInputWarning: { borderColor: '#fcd34d', backgroundColor: '#fff' },
  alertText: { fontSize: 11, color: '#dc2626', marginTop: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  confirmCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fef3c7', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#fcd34d',
  },
  confirmText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '500' },
  approveBtn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 14, alignItems: 'center' },
  approveBtnDisabled: { opacity: 0.5 },
  approveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

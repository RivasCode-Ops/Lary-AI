import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { createRDO } from '../services/api';
import { useAuth } from '../services/auth';

type Props = NativeStackScreenProps<any, 'Apontar'>;

const COLORS = {
  bg: '#f1f5f9',
  surface: '#ffffff',
  primary: '#0f172a',
  accent: '#0284c7',
  text2: '#64748b',
  border: '#e2e8f0',
  green: '#22c55e',
  amber: '#eab308',
};

export default function ApontarScreen({ navigation }: Props) {
  const [service, setService] = useState('');
  const [team, setTeam] = useState('');
  const [content, setContent] = useState('');
  const [weather, setWeather] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { syncOrQueue, isOnline, queueSize } = useOfflineSync();

  const handleCapturePhoto = useCallback(async () => {
    if (photos.length >= 10) {
      Alert.alert('Limite atingido', 'Máximo de 10 fotos por RDO');
      return;
    }
    // Simulate photo capture (camera integration in real build)
    Alert.alert('📸 Câmera', 'Foto capturada com sucesso');
    setPhotos(prev => [...prev, `photo_${prev.length + 1}.jpg`]);
  }, [photos]);

  const handleRequestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'A localização é usada para georreferenciar fotos');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  }, []);

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert('Campo obrigatório', 'Preencha as ocorrências do dia');
      return;
    }
    setIsSaving(true);
    try {
      const rdoData = {
        id_work: '00000000-0000-0000-0000-000000000001',
        rdo_date: new Date().toISOString().slice(0, 10),
        service,
        team,
        content,
        weather,
        photos: photos.map(p => ({
          url: p,
          latitude: location?.lat,
          longitude: location?.lng,
          tags: ['obra'],
        })),
      };

      const { synced, id, error } = await syncOrQueue('rdo_create', rdoData);
      if (synced) {
        Alert.alert('✅ Salvo', 'RDO criado com sucesso');
        navigation.navigate('IAProcessar', {
          rdoId: id,
          rawText: content,
        });
      } else {
        Alert.alert(
          '💾 Salvo offline',
          error
            ? `RDO salvo na fila de sincronização.\nErro: ${error}`
            : 'RDO salvo localmente. Será sincronizado quando houver conexão.',
        );
        navigation.navigate('IAProcessar', {
          rdoId: 'pending-sync',
          rawText: content,
        });
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro inesperado');
    } finally {
      setIsSaving(false);
    }
  }, [content, service, team, weather, photos, location, navigation, syncOrQueue]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.steps}>
        {['Apontar', 'IA', 'Revisar', 'PDF', 'Exportar'].map((s, i) => (
          <View key={s} style={[styles.step, i === 0 && styles.stepActive]}>
            <View style={[styles.stepNum, i === 0 && styles.stepNumActive]}>
              <Text style={styles.stepNumText}>{i === 0 ? '1' : '○'}</Text>
            </View>
            <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>📋 Serviço</Text>
        <TextInput
          style={styles.input}
          value={service}
          onChangeText={setService}
          placeholder="Ex: Concretagem Laje L02"
        />

        <Text style={styles.label}>👥 Equipe</Text>
        <TextInput
          style={styles.input}
          value={team}
          onChangeText={setTeam}
          placeholder="Turma do João (8 operários)"
        />

        <Text style={styles.label}>📝 Ocorrências do dia *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Descreva as atividades, clima, intercorrências..."
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>🌤️ Clima</Text>
        <TextInput
          style={styles.input}
          value={weather}
          onChangeText={setWeather}
          placeholder="Ex: Chuva leve, sol, nublado"
        />

        <Text style={styles.label}>📷 Fotos (3/10)</Text>
        <View style={styles.photoRow}>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoThumb}>
              <Text style={styles.photoIcon}>📸</Text>
            </View>
          ))}
          {photos.length < 10 && (
            <TouchableOpacity style={styles.photoAdd} onPress={handleCapturePhoto}>
              <Text style={styles.photoAddText}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.locationBtn} onPress={handleRequestLocation}>
          <Text style={styles.locationText}>
            📍 {location ? `GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Adicionar localização'}
          </Text>
        </TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📶 Offline — dados serão sincronizados automaticamente</Text>
        </View>
      )}
      {queueSize > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>🔄 {queueSize} item(ns) aguardando sincronização</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveBtnText}>
          {isSaving ? 'Salvando...' : '✓ Salvar apontamento'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.syncQueueBtn}
        onPress={() => (navigation as any).navigate('SyncQueue')}
      >
        <Text style={styles.syncQueueBtnText}>
          📶 Fila de sincronização ({queueSize})
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  step: { alignItems: 'center', gap: 4 },
  stepActive: { opacity: 1 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  stepNumActive: { backgroundColor: COLORS.accent },
  stepNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepLabel: { fontSize: 10, color: COLORS.text2 },
  stepLabelActive: { color: COLORS.accent, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text2, marginBottom: 4, marginTop: 12, textTransform: 'uppercase' },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 12, fontSize: 15, color: COLORS.primary, backgroundColor: COLORS.surface,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  photoThumb: {
    width: 80, height: 80, borderRadius: 8,
    backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#93c5fd',
  },
  photoIcon: { fontSize: 24 },
  photoAdd: {
    width: 80, height: 80, borderRadius: 8,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed',
  },
  photoAddText: { fontSize: 28, color: '#94a3b8' },
  locationBtn: {
    marginTop: 12, padding: 12, borderRadius: 8,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac',
  },
  locationText: { fontSize: 12, color: '#166534' },
  offlineBanner: {
    padding: 12, borderRadius: 8,
    backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d',
  },
  offlineText: { fontSize: 13, color: '#92400e', textAlign: 'center' },
  syncBanner: {
    padding: 12, borderRadius: 8,
    backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc',
  },
  syncText: { fontSize: 13, color: '#075985', textAlign: 'center' },
  saveBtn: {
    backgroundColor: COLORS.accent, padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  syncQueueBtn: {
    padding: 12, borderRadius: 12,
    backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc',
    alignItems: 'center',
  },
  syncQueueBtnText: { fontSize: 13, fontWeight: '600', color: '#075985' },
});

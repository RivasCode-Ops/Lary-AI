import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useOfflineSync, SyncItem } from '../hooks/useOfflineSync';

export default function SyncQueueScreen() {
  const {
    queueSize, syncStatus, isOnline,
    getQueueItems, processQueue, clearQueue, removeFromQueue,
  } = useOfflineSync();

  const [items, setItems] = useState<SyncItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const q = await getQueueItems();
    setItems(q);
    setLoading(false);
  }, [getQueueItems]);

  useEffect(() => {
    loadItems();
    const interval = setInterval(loadItems, 5000);
    return () => clearInterval(interval);
  }, [loadItems]);

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Conecte-se à internet para sincronizar');
      return;
    }
    await processQueue();
    await loadItems();
  };

  const handleRemove = (id: string) => {
    Alert.alert('Remover', 'Remover este item da fila?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        await removeFromQueue(id);
        await loadItems();
      }},
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Limpar tudo', 'Remover todos os itens da fila?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: async () => {
        await clearQueue();
        await loadItems();
      }},
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Fila de Sincronização</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isOnline ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{queueSize}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, syncStatus === 'syncing' && { color: '#0284c7' }]}>
            {syncStatus === 'syncing' ? '🔄' : syncStatus === 'completed' ? '✅' : syncStatus === 'error' ? '⚠️' : '💤'}
          </Text>
          <Text style={styles.statLabel}>
            {syncStatus === 'syncing' ? 'Sincronizando' : syncStatus === 'completed' ? 'Completo' : syncStatus === 'error' ? 'Erro' : 'Ocioso'}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.syncBtn, (!isOnline || items.length === 0) && styles.btnDisabled]}
          onPress={handleSyncNow}
          disabled={!isOnline || items.length === 0}
        >
          <Text style={styles.syncBtnText}>
            {syncStatus === 'syncing' ? 'Sincronizando...' : '🔄 Sincronizar agora'}
          </Text>
        </TouchableOpacity>
        {items.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Text style={styles.clearBtnText}>🗑️ Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>Nenhum item pendente</Text>
          <Text style={styles.emptySub}>Todos os dados foram sincronizados</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemType}>
                {item.type === 'rdo_create' ? '📋 RDO' : '📷 Foto'}
              </Text>
              <Text style={styles.itemRetry}>
                Tentativas: {item.retryCount}/5
              </Text>
            </View>
            <Text style={styles.itemDate}>
              Criado em: {new Date(item.createdAt).toLocaleString('pt-BR')}
            </Text>
            {item.lastError && (
              <Text style={styles.itemError}>⚠️ {item.lastError}</Text>
            )}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(item.id)}
            >
              <Text style={styles.removeBtnText}>Remover</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  headerCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOnline: { backgroundColor: '#22c55e' },
  statusOffline: { backgroundColor: '#ef4444' },
  statusText: { fontSize: 13, color: '#64748b' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4, textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 8 },
  syncBtn: { flex: 1, backgroundColor: '#0284c7', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  syncBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  clearBtn: { backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  itemCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemType: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  itemRetry: { fontSize: 11, color: '#64748b' },
  itemDate: { fontSize: 12, color: '#64748b' },
  itemError: {
    fontSize: 12, color: '#dc2626', marginTop: 4,
    backgroundColor: '#fee2e2', padding: 6, borderRadius: 6,
  },
  removeBtn: { alignSelf: 'flex-end', marginTop: 8 },
  removeBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
});

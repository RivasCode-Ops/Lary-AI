import { useEffect, useRef, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createRDO } from '../services/api';

const SYNC_QUEUE_KEY = '@laryai_sync_queue';

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error';

export interface SyncItem {
  id: string;
  type: 'rdo_create' | 'photo_upload';
  payload: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export function useOfflineSync() {
  const isSyncing = useRef(false);
  const [queueSize, setQueueSize] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false;
      setIsOnline(online);
      if (online) processQueue();
    });
    return () => unsubscribe();
  }, []);

  // Refresh queue size
  const refreshQueueSize = useCallback(async () => {
    const q = await getQueue();
    setQueueSize(q.length);
  }, []);

  // Add to queue (offline-first)
  const addToQueue = useCallback(async (item: Omit<SyncItem, 'id' | 'createdAt' | 'retryCount'>) => {
    const queue = await getQueue();
    const newItem: SyncItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(newItem);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    setQueueSize(queue.length);
    console.log('[Sync] Added to queue:', newItem.id);
    return newItem.id;
  }, []);

  // Try to sync: if online, attempt API call; if fails or offline, queue it
  const syncOrQueue = useCallback(async (
    type: SyncItem['type'],
    payload: any,
  ): Promise<{ synced: boolean; id?: string; error?: string }> => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      await addToQueue({ type, payload });
      return { synced: false, id: undefined };
    }

    try {
      let result;
      if (type === 'rdo_create') {
        result = await createRDO(payload);
      }
      return { synced: true, id: result?.id_rdo };
    } catch (err: any) {
      // Online but API failed — queue for retry
      await addToQueue({ type, payload });
      return { synced: false, error: err?.response?.data?.error || err.message };
    }
  }, [addToQueue]);

  // Process queue: drain all pending items
  const processQueue = useCallback(async () => {
    if (isSyncing.current) return;

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    isSyncing.current = true;
    setSyncStatus('syncing');

    try {
      const queue = await getQueue();
      if (queue.length === 0) {
        setSyncStatus('idle');
        isSyncing.current = false;
        return;
      }

      const remaining: SyncItem[] = [];
      let syncedCount = 0;

      for (const item of queue) {
        try {
          if (item.type === 'rdo_create') {
            await createRDO(item.payload);
            syncedCount++;
            console.log('[Sync] Synced RDO:', item.id);
          }
        } catch (err: any) {
          item.retryCount++;
          item.lastError = err?.response?.data?.error || err.message;
          if (item.retryCount < 5) {
            remaining.push(item);
          } else {
            console.warn('[Sync] Dropping after 5 retries:', item.id, item.lastError);
          }
        }
      }

      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
      setQueueSize(remaining.length);
      setSyncStatus(remaining.length === 0 ? 'completed' : 'error');

      // Reset status after 3s
      if (remaining.length === 0) {
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } finally {
      isSyncing.current = false;
    }
  }, []);

  // Get queue items for display
  const getQueueItems = useCallback(async (): Promise<SyncItem[]> => {
    return getQueue();
  }, []);

  // Clear queue
  const clearQueue = useCallback(async () => {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
    setQueueSize(0);
  }, []);

  // Remove specific item
  const removeFromQueue = useCallback(async (itemId: string) => {
    const queue = await getQueue();
    const filtered = queue.filter(i => i.id !== itemId);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    setQueueSize(filtered.length);
  }, []);

  // Init queue size
  useEffect(() => { refreshQueueSize(); }, []);

  return {
    queueSize,
    syncStatus,
    isOnline,
    addToQueue,
    syncOrQueue,
    processQueue,
    getQueueItems,
    clearQueue,
    removeFromQueue,
    refreshQueueSize,
  };
}

async function getQueue(): Promise<SyncItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

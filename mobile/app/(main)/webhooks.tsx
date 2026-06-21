import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';

interface Webhook {
  id?: string;
  name?: string;
  url?: string;
  events?: string[];
  enabled?: boolean;
  [key: string]: any;
}

export default function WebhooksScreen() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<any>('/api/webhooks');
      const data = res.data;
      const list: Webhook[] = Array.isArray(data) ? data : data?.webhooks ?? [];
      setWebhooks(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchWebhooks(); }, [fetchWebhooks]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWebhooks();
    setRefreshing(false);
  };

  const renderWebhook = ({ item, index }: { item: Webhook; index: number }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name ?? item.id ?? `Webhook ${index + 1}`}</Text>
        {item.enabled !== undefined && (
          <View style={[styles.badge, { backgroundColor: item.enabled ? COLORS.success + '22' : COLORS.muted + '22' }]}>
            <Text style={[styles.badgeText, { color: item.enabled ? COLORS.success : COLORS.muted }]}>
              {item.enabled ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>
        )}
      </View>
      {item.url ? <Text style={styles.url} numberOfLines={1}>{item.url}</Text> : null}
      {item.events && item.events.length > 0 && (
        <Text style={styles.events}>{item.events.join(', ')}</Text>
      )}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchWebhooks}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={webhooks}
      keyExtractor={(item, i) => item.id ?? String(i)}
      renderItem={renderWebhook}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListEmptyComponent={<Text style={styles.empty}>No webhooks configured</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { color: COLORS.accent, fontSize: 13, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  url: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'monospace', marginBottom: 4 },
  events: { color: COLORS.muted, fontSize: 10, lineHeight: 16 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

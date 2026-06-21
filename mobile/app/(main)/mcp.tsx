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
import type { McpServer } from '../../src/types';

function statusColor(status: string): string {
  switch (status) {
    case 'connected': return COLORS.success;
    case 'error': return COLORS.error;
    case 'disabled': return COLORS.muted;
    default: return COLORS.warning;
  }
}

export default function McpScreen() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<McpServer[] | { servers: McpServer[] }>('/api/mcp');
      const data = res.data;
      setServers(Array.isArray(data) ? data : (data as any).servers ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load MCP servers');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchServers(); }, [fetchServers]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServers();
    setRefreshing(false);
  };

  const renderServer = ({ item }: { item: McpServer }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
          <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.tools}>{item.tools_count} tool{item.tools_count !== 1 ? 's' : ''}</Text>
      {item.error ? <Text style={styles.errorMsg} numberOfLines={2}>{item.error}</Text> : null}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchServers}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={servers}
      keyExtractor={(item) => item.name}
      renderItem={renderServer}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListEmptyComponent={<Text style={styles.empty}>No MCP servers configured</Text>}
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
  tools: { color: COLORS.textSecondary, fontSize: 11 },
  errorMsg: { color: COLORS.error, fontSize: 11, marginTop: 4, lineHeight: 16 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

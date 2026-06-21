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

interface Platform {
  name: string;
  state: string;
  display_name?: string;
  error_message?: string | null;
  error_code?: string | null;
  updated_at?: string;
}

function stateColor(state: string): string {
  switch (state) {
    case 'connected': return COLORS.success;
    case 'error': return COLORS.error;
    case 'disconnected': return COLORS.muted;
    default: return COLORS.warning;
  }
}

export default function ChannelsScreen() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      // Try the gateway_platforms from /api/status first, fall back to /api/messaging/platforms
      const statusRes = await client.get<{ gateway_platforms: Record<string, any> }>('/api/status');
      const gp = statusRes.data.gateway_platforms ?? {};
      const list: Platform[] = Object.entries(gp).map(([name, val]) => ({
        name,
        state: val.state ?? 'unknown',
        error_message: val.error_message,
        error_code: val.error_code,
        updated_at: val.updated_at,
      }));
      setPlatforms(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchChannels(); }, [fetchChannels]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChannels();
    setRefreshing(false);
  };

  const renderPlatform = ({ item }: { item: Platform }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name.toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: stateColor(item.state) + '22' }]}>
          <Text style={[styles.badgeText, { color: stateColor(item.state) }]}>
            {item.state.toUpperCase()}
          </Text>
        </View>
      </View>
      {item.error_message ? (
        <Text style={styles.error} numberOfLines={2}>{item.error_message}</Text>
      ) : null}
      {item.updated_at ? (
        <Text style={styles.updated}>Updated: {new Date(item.updated_at).toLocaleString()}</Text>
      ) : null}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchChannels}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={platforms}
      keyExtractor={(item) => item.name}
      renderItem={renderPlatform}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListEmptyComponent={<Text style={styles.empty}>No platforms configured</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  name: { color: COLORS.accent, fontSize: 13, fontWeight: '700', flex: 1, letterSpacing: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  error: { color: COLORS.error, fontSize: 11, lineHeight: 16, marginBottom: 4 },
  updated: { color: COLORS.muted, fontSize: 10 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

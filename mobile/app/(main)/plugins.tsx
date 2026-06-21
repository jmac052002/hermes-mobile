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

interface Plugin {
  name: string;
  label?: string;
  description?: string;
  version?: string;
  enabled?: boolean;
}

export default function PluginsScreen() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlugins = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      // Try dashboard plugins endpoint, fall back gracefully
      const res = await client.get<any>('/api/dashboard/plugins');
      const data = res.data;
      const list: Plugin[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.plugins)
        ? data.plugins
        : Object.entries(data ?? {}).map(([name, v]: [string, any]) => ({ name, ...v }));
      setPlugins(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load plugins');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPlugins(); }, [fetchPlugins]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlugins();
    setRefreshing(false);
  };

  const renderPlugin = ({ item }: { item: Plugin }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.label ?? item.name}</Text>
        {item.version && <Text style={styles.version}>v{item.version}</Text>}
      </View>
      {item.description ? <Text style={styles.description} numberOfLines={3}>{item.description}</Text> : null}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchPlugins}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={plugins}
      keyExtractor={(item, i) => item.name ?? String(i)}
      renderItem={renderPlugin}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListEmptyComponent={<Text style={styles.empty}>No plugins installed</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { color: COLORS.accent, fontSize: 13, fontWeight: '600', flex: 1 },
  version: { color: COLORS.muted, fontSize: 10, fontFamily: 'monospace' },
  description: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';
import type { EnvVarInfo } from '../../src/types';

interface EnvVar {
  key: string;
  info: EnvVarInfo;
}

export default function KeysScreen() {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const fetchVars = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<Record<string, EnvVarInfo>>('/api/env');
      const entries = Object.entries(res.data).map(([key, info]) => ({ key, info }));
      setVars(entries);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchVars(); }, [fetchVars]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVars();
    setRefreshing(false);
  };

  const revealKey = async (key: string) => {
    if (revealed[key]) {
      setRevealed((prev) => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    setRevealing(key);
    try {
      const client = await getApiClient();
      const res = await client.post<{ key: string; value: string }>('/api/env/reveal', { key });
      setRevealed((prev) => ({ ...prev, [key]: res.data.value }));
    } catch {
      Alert.alert('Error', 'Could not reveal key.');
    } finally {
      setRevealing(null);
    }
  };

  const setKey = (key: string) => {
    Alert.prompt(
      'Set API Key',
      `New value for ${key}:`,
      async (value) => {
        if (!value) return;
        try {
          const client = await getApiClient();
          await client.post('/api/env', { key, value });
          await fetchVars();
          Alert.alert('Saved', `${key} updated.`);
        } catch {
          Alert.alert('Error', 'Could not set key.');
        }
      },
      'secure-text'
    );
  };

  const renderVar = ({ item }: { item: EnvVar }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.keyName}>{item.key}</Text>
        <View style={[styles.badge, { backgroundColor: item.info.set ? COLORS.success + '22' : COLORS.error + '22' }]}>
          <Text style={[styles.badgeText, { color: item.info.set ? COLORS.success : COLORS.error }]}>
            {item.info.set ? 'SET' : 'UNSET'}
          </Text>
        </View>
      </View>
      {item.info.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.info.description}</Text>
      ) : null}
      {item.info.set && (
        <View style={styles.valueRow}>
          <Text style={styles.maskedValue} numberOfLines={1}>
            {revealed[item.key] ?? item.info.masked_value ?? '••••••••'}
          </Text>
          <TouchableOpacity
            style={styles.revealBtn}
            onPress={() => revealKey(item.key)}
            disabled={revealing === item.key}
          >
            {revealing === item.key ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Text style={styles.revealText}>{revealed[item.key] ? 'HIDE' : 'REVEAL'}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.setBtn} onPress={() => setKey(item.key)}>
        <Text style={styles.setBtnText}>{item.info.set ? 'UPDATE' : 'SET KEY'}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchVars}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={vars}
      keyExtractor={(item) => item.key}
      renderItem={renderVar}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListEmptyComponent={<Text style={styles.empty}>No env vars found</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  keyName: { color: COLORS.accent, fontSize: 12, fontWeight: '700', flex: 1, fontFamily: 'monospace' },
  badge: { paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  description: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  maskedValue: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'monospace', flex: 1 },
  revealBtn: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  revealText: { color: COLORS.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  setBtn: { borderWidth: 1, borderColor: COLORS.border, padding: 8, alignItems: 'center', marginTop: 4 },
  setBtnText: { color: COLORS.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';
import type { LogEntry } from '../../src/types';

type LogLevel = 'ALL' | 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
const LEVELS: LogLevel[] = ['ALL', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

function levelColor(level: string): string {
  switch (level) {
    case 'DEBUG': return COLORS.muted;
    case 'INFO': return COLORS.accent;
    case 'WARNING': return COLORS.warning;
    case 'ERROR': return COLORS.error;
    case 'CRITICAL': return COLORS.error;
    default: return COLORS.textSecondary;
  }
}

export default function LogsScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<LogLevel>('ALL');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const client = await getApiClient();
      const params = new URLSearchParams({ limit: '200' });
      if (level !== 'ALL') params.set('level', level);
      const res = await client.get<{ logs: LogEntry[] }>(`/api/logs?${params.toString()}`);
      setLogs(res.data.logs ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [level]);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
      intervalRef.current = setInterval(fetchLogs, 3000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [fetchLogs])
  );

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [level, fetchLogs]);

  const renderItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logRow}>
      <Text style={[styles.level, { color: levelColor(item.level) }]}>{item.level.slice(0, 4)}</Text>
      <View style={styles.logBody}>
        <Text style={styles.logger} numberOfLines={1}>{item.logger}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Level filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l}
            style={[styles.filterChip, level === l && styles.filterChipActive]}
            onPress={() => setLevel(l)}
          >
            <Text style={[styles.filterText, level === l && styles.filterTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchLogs} style={styles.retryBtn}>
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={[...logs].reverse()}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No logs</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { borderColor: COLORS.accent, backgroundColor: COLORS.surface },
  filterText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  filterTextActive: { color: COLORS.accent },
  list: { padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 1, borderBottomColor: '#111' },
  level: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, width: 32, paddingTop: 2 },
  logBody: { flex: 1 },
  logger: { color: COLORS.muted, fontSize: 9, marginBottom: 2 },
  message: { color: COLORS.textPrimary, fontSize: 11, lineHeight: 16, fontFamily: 'monospace' },
  timestamp: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

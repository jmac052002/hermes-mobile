import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';
import type { AnalyticsResponse } from '../../src/types';

type Period = 7 | 30 | 90;

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<AnalyticsResponse>(`/api/analytics?days=${period}`);
      setData(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const PERIODS: Period[] = [7, 30, 90];

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
    >
      {/* Period selector */}
      <View style={styles.periodBar}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => { setPeriod(p); setLoading(true); }}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}d</Text>
          </TouchableOpacity>
        ))}
      </View>

      {data && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>USAGE</Text>
            <StatRow label="Sessions" value={String(data.sessions)} />
            <StatRow label="API Calls" value={String(data.api_calls)} />
            <StatRow label="Tool Calls" value={String(data.tool_calls)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>TOKENS</Text>
            <StatRow label="Input" value={fmt(data.input_tokens)} />
            <StatRow label="Output" value={fmt(data.output_tokens)} />
            <StatRow label="Cache Read" value={fmt(data.cache_read_tokens)} />
            <StatRow label="Cache Write" value={fmt(data.cache_write_tokens)} />
            <StatRow
              label="Total"
              value={fmt(data.input_tokens + data.output_tokens)}
              highlight
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>COST</Text>
            <StatRow
              label={`Est. Cost (${period}d)`}
              value={`$${data.estimated_cost_usd.toFixed(4)}`}
              highlight
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, highlight && rowStyles.valueHighlight]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.textSecondary, fontSize: 12 },
  value: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
  valueHighlight: { color: COLORS.success, fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  periodBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: { paddingHorizontal: 16, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.border },
  periodBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.surface },
  periodText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  periodTextActive: { color: COLORS.accent },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  cardTitle: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
});

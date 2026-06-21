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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';
import type { CronJob } from '../../src/types';

function statusColor(status: string | null): string {
  switch (status) {
    case 'success': return COLORS.success;
    case 'error': return COLORS.error;
    case 'running': return COLORS.warning;
    default: return COLORS.muted;
  }
}

function formatTs(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function CronScreen() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<CronJob[]>('/api/cron/jobs?profile=default');
      setJobs(res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load cron jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const doAction = async (job: CronJob, action: 'pause' | 'resume' | 'trigger') => {
    try {
      const client = await getApiClient();
      await client.post(`/api/cron/jobs/${job.id}/${action}?profile=default`);
      await fetchJobs();
    } catch {
      Alert.alert('Error', `Could not ${action} job.`);
    }
  };

  const deleteJob = (job: CronJob) => {
    Alert.alert('Delete Job', `Delete "${job.name ?? job.id}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const client = await getApiClient();
            await client.delete(`/api/cron/jobs/${job.id}?profile=default`);
            setJobs((prev) => prev.filter((j) => j.id !== job.id));
          } catch {
            Alert.alert('Error', 'Could not delete job.');
          }
        },
      },
    ]);
  };

  const renderJob = ({ item }: { item: CronJob }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobName} numberOfLines={1}>{item.name ?? item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.enabled ? COLORS.success + '22' : COLORS.muted + '22' }]}>
          <Text style={[styles.statusText, { color: item.enabled ? COLORS.success : COLORS.muted }]}>
            {item.enabled ? 'ENABLED' : 'DISABLED'}
          </Text>
        </View>
      </View>

      <Text style={styles.schedule}>{item.schedule}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Last run:</Text>
        <Text style={styles.metaValue}>{formatTs(item.last_run)}</Text>
        {item.last_status && (
          <Text style={[styles.lastStatus, { color: statusColor(item.last_status) }]}>
            {item.last_status.toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Next run:</Text>
        <Text style={styles.metaValue}>{formatTs(item.next_run)}</Text>
      </View>

      <View style={styles.actions}>
        {item.enabled ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => doAction(item, 'pause')}>
            <Text style={styles.actionText}>PAUSE</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => doAction(item, 'resume')}>
            <Text style={styles.actionText}>RESUME</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => doAction(item, 'trigger')}>
          <Text style={styles.actionText}>RUN NOW</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deleteJob(item)}>
          <Text style={[styles.actionText, { color: COLORS.error }]}>DELETE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchJobs}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={renderJob}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListEmptyComponent={<Text style={styles.empty}>No cron jobs configured</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  jobName: { color: COLORS.accent, fontSize: 13, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  schedule: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'monospace', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  metaLabel: { color: COLORS.muted, fontSize: 10, width: 70 },
  metaValue: { color: COLORS.textSecondary, fontSize: 10, flex: 1 },
  lastStatus: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtn: { borderColor: COLORS.error + '55' },
  actionText: { color: COLORS.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

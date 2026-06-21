import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useConnection } from '../../src/context/ConnectionContext';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: { color: COLORS.textSecondary, fontSize: 12, letterSpacing: 0.5 },
  value: { color: COLORS.accent, fontSize: 12, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
});

export default function SystemScreen() {
  const { status, refresh } = useConnection();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleRestart = () => {
    Alert.alert('Restart Gateway', 'This will restart the Hermes gateway. Active sessions will be interrupted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restart',
        style: 'destructive',
        onPress: async () => {
          try {
            const client = await getApiClient();
            await client.post('/api/gateway/restart');
            Alert.alert('Restarting', 'Gateway restart initiated. Reconnect in a moment.');
          } catch {
            Alert.alert('Error', 'Could not send restart command.');
          }
        },
      },
    ]);
  };

  const platforms = status?.gateway_platforms ?? {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
      }
    >
      {!status ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>HERMES AGENT</Text>
            <Row label="Version" value={status.version} />
            <Row label="Released" value={status.release_date} />
            <Row label="Active Agents" value={String(status.active_agents)} />
            <Row label="Active Sessions" value={String(status.active_sessions)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>GATEWAY</Text>
            <Row
              label="State"
              value={status.gateway_state}
              valueColor={status.gateway_running ? COLORS.success : COLORS.error}
            />
            <Row label="Busy" value={status.gateway_busy ? 'Yes' : 'No'} />
          </View>

          {Object.keys(platforms).length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PLATFORMS</Text>
              {Object.entries(platforms).map(([name, plat]) => (
                <Row
                  key={name}
                  label={name.toUpperCase()}
                  value={plat.state}
                  valueColor={
                    plat.state === 'connected'
                      ? COLORS.success
                      : plat.state === 'error'
                      ? COLORS.error
                      : COLORS.warning
                  }
                />
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>ACTIONS</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleRestart}>
              <Text style={styles.actionText}>↻  RESTART GATEWAY</Text>
            </TouchableOpacity>
            {status.can_update_hermes && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() =>
                  Alert.alert('Update Hermes', 'Run `hermes update` in your terminal to update.')
                }
              >
                <Text style={styles.actionText}>↓  UPDATE HERMES</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnSecondary: { marginTop: 8 },
  actionText: { color: COLORS.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
});

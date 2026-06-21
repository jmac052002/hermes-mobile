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

interface PairingInfo {
  code?: string;
  url?: string;
  expires_at?: string;
  instructions?: string;
  [key: string]: any;
}

export default function PairingScreen() {
  const [info, setInfo] = useState<PairingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPairing = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<PairingInfo>('/api/pairing');
      setInfo(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load pairing info');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPairing(); }, [fetchPairing]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPairing();
    setRefreshing(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
    >
      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPairing}>
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : info ? (
        <>
          {info.code && (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>PAIRING CODE</Text>
              <Text style={styles.code}>{info.code}</Text>
            </View>
          )}
          {info.url && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>PAIRING URL</Text>
              <Text style={styles.url} selectable>{info.url}</Text>
            </View>
          )}
          {info.expires_at && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.value}>{new Date(info.expires_at).toLocaleString()}</Text>
            </View>
          )}
          {info.instructions && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>INSTRUCTIONS</Text>
              <Text style={styles.instructions}>{info.instructions}</Text>
            </View>
          )}
          {!info.code && !info.url && (
            <View style={styles.card}>
              <Text style={styles.instructions}>{JSON.stringify(info, null, 2)}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.instructions}>No pairing information available.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  errorCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 16, alignItems: 'center' },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  codeCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  codeLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  code: { color: COLORS.accent, fontSize: 36, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 8 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  cardLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  url: { color: COLORS.accent, fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
  value: { color: COLORS.textPrimary, fontSize: 13 },
  instructions: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, fontFamily: 'monospace' },
});

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
import type { ProfileInfo } from '../../src/types';

export default function ProfilesScreen() {
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<{ profiles: ProfileInfo[] }>('/api/profiles');
      setProfiles(res.data.profiles ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchProfiles(); }, [fetchProfiles]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  const switchProfile = async (profile: ProfileInfo) => {
    if (profile.is_active) return;
    Alert.alert('Switch Profile', `Switch to profile "${profile.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        onPress: async () => {
          setSwitching(profile.name);
          try {
            const client = await getApiClient();
            await client.post('/api/profiles/active', { name: profile.name });
            await fetchProfiles();
          } catch {
            Alert.alert('Error', 'Could not switch profile.');
          } finally {
            setSwitching(null);
          }
        },
      },
    ]);
  };

  const renderProfile = ({ item }: { item: ProfileInfo }) => (
    <TouchableOpacity
      style={[styles.card, item.is_active && styles.cardActive]}
      onPress={() => switchProfile(item)}
      disabled={item.is_active || switching !== null}
    >
      <View style={styles.row}>
        <Text style={[styles.name, item.is_active && styles.nameActive]}>{item.name}</Text>
        {item.is_active && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}
        {switching === item.name && <ActivityIndicator size="small" color={COLORS.accent} />}
      </View>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      {item.model ? (
        <Text style={styles.model}>{item.provider} / {item.model}</Text>
      ) : null}
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfiles}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={profiles}
      keyExtractor={(item) => item.name}
      renderItem={renderProfile}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListEmptyComponent={<Text style={styles.empty}>No profiles found</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  cardActive: { borderColor: COLORS.accent },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  nameActive: { color: COLORS.accent },
  activeBadge: { backgroundColor: COLORS.success + '22', paddingHorizontal: 8, paddingVertical: 2 },
  activeBadgeText: { color: COLORS.success, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  description: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16, marginBottom: 4 },
  model: { color: COLORS.muted, fontSize: 10, fontFamily: 'monospace' },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

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
  SectionList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';
import type { ModelInfo, ModelOption } from '../../src/types';

interface ModelOptionsResponse {
  providers: Record<string, ModelOption[]>;
}

export default function ModelsScreen() {
  const [current, setCurrent] = useState<ModelInfo | null>(null);
  const [sections, setSections] = useState<{ title: string; data: ModelOption[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const [infoRes, optsRes] = await Promise.all([
        client.get<ModelInfo>('/api/model/info'),
        client.get<ModelOptionsResponse>('/api/model/options'),
      ]);
      setCurrent(infoRes.data);
      const providers = optsRes.data.providers ?? {};
      setSections(
        Object.entries(providers).map(([provider, models]) => ({
          title: provider,
          data: models,
        }))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const switchModel = async (option: ModelOption) => {
    Alert.alert('Switch Model', `Switch to ${option.display_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        onPress: async () => {
          setSwitching(option.model);
          try {
            const client = await getApiClient();
            await client.post('/api/model/set', {
              provider: option.provider,
              model: option.model,
            });
            await fetchData();
            Alert.alert('Switched', `Now using ${option.display_name}`);
          } catch {
            Alert.alert('Error', 'Could not switch model.');
          } finally {
            setSwitching(null);
          }
        },
      },
    ]);
  };

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
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.provider}/${item.model}`}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListHeaderComponent={
        current ? (
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>ACTIVE MODEL</Text>
            <Text style={styles.currentModel}>{current.display_name ?? current.model}</Text>
            <Text style={styles.currentProvider}>{current.provider}</Text>
          </View>
        ) : null
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const isActive = current?.model === item.model && current?.provider === item.provider;
        const isSwitching = switching === item.model;
        return (
          <TouchableOpacity
            style={[styles.modelRow, isActive && styles.modelRowActive]}
            onPress={() => switchModel(item)}
            disabled={isActive || isSwitching}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.modelName, isActive && styles.modelNameActive]}>
                {item.display_name}
              </Text>
              {item.context_length && (
                <Text style={styles.contextLen}>{(item.context_length / 1000).toFixed(0)}k ctx</Text>
              )}
            </View>
            {isActive && <Text style={styles.activeBadge}>ACTIVE</Text>}
            {isSwitching && <ActivityIndicator size="small" color={COLORS.accent} />}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: COLORS.background, paddingBottom: 24 },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  currentCard: {
    margin: 12,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentLabel: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  currentModel: { color: COLORS.accent, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  currentProvider: { color: COLORS.textSecondary, fontSize: 12 },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  modelRowActive: { backgroundColor: COLORS.surface },
  modelName: { color: COLORS.textPrimary, fontSize: 13 },
  modelNameActive: { color: COLORS.accent, fontWeight: '600' },
  contextLen: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  activeBadge: { color: COLORS.success, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
});

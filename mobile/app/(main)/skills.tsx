import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';
import type { SkillInfo } from '../../src/types';

export default function SkillsScreen() {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<SkillInfo[]>('/api/skills');
      setSkills(res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchSkills(); }, [fetchSkills]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSkills();
    setRefreshing(false);
  };

  const toggleSkill = async (skill: SkillInfo) => {
    setToggling(skill.name);
    try {
      const client = await getApiClient();
      await client.post('/api/skills/toggle', {
        name: skill.name,
        enabled: !skill.enabled,
      });
      setSkills((prev) =>
        prev.map((s) => s.name === skill.name ? { ...s, enabled: !s.enabled } : s)
      );
    } catch {
      Alert.alert('Error', 'Could not toggle skill.');
    } finally {
      setToggling(null);
    }
  };

  const renderSkill = ({ item }: { item: SkillInfo }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.skillName}>{item.name}</Text>
          {item.category && <Text style={styles.category}>{item.category}</Text>}
        </View>
        {toggling === item.name ? (
          <ActivityIndicator size="small" color={COLORS.accent} />
        ) : (
          <Switch
            value={item.enabled}
            onValueChange={() => toggleSkill(item)}
            thumbColor={item.enabled ? COLORS.accent : COLORS.muted}
            trackColor={{ false: COLORS.border, true: COLORS.border }}
          />
        )}
      </View>
      {item.description ? (
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
      ) : null}
      {item.tags.length > 0 && (
        <View style={styles.tags}>
          {item.tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchSkills}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={skills}
      keyExtractor={(item) => item.name}
      renderItem={renderSkill}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      ListHeaderComponent={
        <Text style={styles.count}>{skills.length} skills</Text>
      }
      ListEmptyComponent={<Text style={styles.empty}>No skills installed</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  count: { color: COLORS.muted, fontSize: 10, letterSpacing: 1, marginBottom: 8, textAlign: 'right' },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  skillName: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  category: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
  description: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { backgroundColor: COLORS.border, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { color: COLORS.muted, fontSize: 9, letterSpacing: 0.5 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});

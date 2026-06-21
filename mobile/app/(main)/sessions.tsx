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
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';
import type { HermesSession, PaginatedSessions, SessionMessage } from '../../src/types';

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCost(cost: number | null): string {
  if (cost == null) return '—';
  return `$${cost.toFixed(4)}`;
}

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<HermesSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<HermesSession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<PaginatedSessions>('/api/sessions?limit=50');
      setSessions(res.data.sessions ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchSessions(); }, [fetchSessions]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const openSession = async (session: HermesSession) => {
    setSelectedSession(session);
    setMessagesLoading(true);
    setMessages([]);
    try {
      const client = await getApiClient();
      const res = await client.get<{ messages: SessionMessage[] }>(
        `/api/sessions/${session.id}/messages?limit=100`
      );
      setMessages(res.data.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const deleteSession = (session: HermesSession) => {
    Alert.alert('Delete Session', `Delete this session?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const client = await getApiClient();
            await client.delete(`/api/sessions/${session.id}`);
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
          } catch {
            Alert.alert('Error', 'Could not delete session.');
          }
        },
      },
    ]);
  };

  const roleColor = (role: string) => {
    if (role === 'user') return COLORS.accent;
    if (role === 'assistant') return COLORS.success;
    return COLORS.textSecondary;
  };

  const renderSession = ({ item }: { item: HermesSession }) => (
    <TouchableOpacity style={styles.sessionCard} onPress={() => openSession(item)} onLongPress={() => deleteSession(item)}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionId} numberOfLines={1}>{item.title ?? item.id.slice(0, 20)}</Text>
        {item.is_active && <View style={styles.activeDot} />}
      </View>
      <Text style={styles.sessionPreview} numberOfLines={2}>{item.preview ?? '—'}</Text>
      <View style={styles.sessionMeta}>
        <Text style={styles.metaText}>{item.source}</Text>
        <Text style={styles.metaText}>{item.message_count} msgs</Text>
        <Text style={styles.metaText}>{formatCost(item.estimated_cost_usd)}</Text>
        <Text style={styles.metaText}>{formatDate(item.last_active)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchSessions}>
          <Text style={styles.retryText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={<Text style={styles.empty}>No sessions yet</Text>}
      />

      <Modal visible={!!selectedSession} animationType="slide" onRequestClose={() => setSelectedSession(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedSession?.title ?? selectedSession?.id?.slice(0, 20) ?? ''}
            </Text>
            <TouchableOpacity onPress={() => setSelectedSession(null)}>
              <Text style={styles.closeBtn}>CLOSE</Text>
            </TouchableOpacity>
          </View>
          {messagesLoading ? (
            <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>
          ) : (
            <ScrollView style={styles.messages}>
              {messages.map((msg) => (
                <View key={msg.id} style={[styles.msgBubble, { borderLeftColor: roleColor(msg.role) }]}>
                  <Text style={[styles.msgRole, { color: roleColor(msg.role) }]}>{msg.role.toUpperCase()}</Text>
                  <Text style={styles.msgContent}>
                    {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sessionId: { color: COLORS.accent, fontSize: 13, fontWeight: '600', flex: 1 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginLeft: 8 },
  sessionPreview: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 },
  sessionMeta: { flexDirection: 'row', gap: 12 },
  metaText: { color: COLORS.muted, fontSize: 10, letterSpacing: 0.5 },
  errorText: { color: COLORS.error, marginBottom: 16, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 12, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.accent, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 12 },
  closeBtn: { color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  messages: { flex: 1, padding: 12 },
  msgBubble: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  msgRole: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  msgContent: { color: COLORS.textPrimary, fontSize: 13, lineHeight: 20 },
});

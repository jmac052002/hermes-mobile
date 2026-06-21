import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';
import type { FileEntry } from '../../src/types';

interface FilesResponse {
  path: string;
  entries: FileEntry[];
}

function formatSize(size: number | null): string {
  if (size == null) return '';
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export default function FilesScreen() {
  const [path, setPath] = useState('/');
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['/']);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileViewName, setFileViewName] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  const fetchPath = useCallback(async (p: string) => {
    setError(null);
    setLoading(true);
    try {
      const client = await getApiClient();
      const res = await client.get<FilesResponse>(`/api/files?path=${encodeURIComponent(p)}`);
      setEntries(res.data.entries ?? []);
      setPath(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPath(path); }, [path, fetchPath]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPath(path);
    setRefreshing(false);
  };

  const navigateTo = (entry: FileEntry) => {
    if (entry.is_dir) {
      setBreadcrumbs((prev) => [...prev, entry.path]);
      fetchPath(entry.path);
    } else {
      openFile(entry);
    }
  };

  const navigateBack = () => {
    if (breadcrumbs.length <= 1) return;
    const prev = breadcrumbs[breadcrumbs.length - 2];
    setBreadcrumbs((b) => b.slice(0, -1));
    fetchPath(prev);
  };

  const openFile = async (entry: FileEntry) => {
    setFileViewName(entry.name);
    setFileContent(null);
    setFileLoading(true);
    try {
      const client = await getApiClient();
      const res = await client.get<{ content: string }>(`/api/files/read?path=${encodeURIComponent(entry.path)}`);
      setFileContent(res.data.content);
    } catch {
      setFileContent('[Could not read file content]');
    } finally {
      setFileLoading(false);
    }
  };

  const renderEntry = ({ item }: { item: FileEntry }) => (
    <TouchableOpacity style={styles.row} onPress={() => navigateTo(item)}>
      <Text style={styles.icon}>{item.is_dir ? '📁' : '📄'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, item.is_dir && styles.dirName]} numberOfLines={1}>{item.name}</Text>
        {!item.is_dir && item.size != null && (
          <Text style={styles.size}>{formatSize(item.size)}</Text>
        )}
      </View>
      {item.is_dir && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.breadcrumbs}>
        {breadcrumbs.length > 1 && (
          <TouchableOpacity onPress={navigateBack} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.pathText} numberOfLines={1}>{path}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPath(path)}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.path}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>Empty directory</Text>}
        />
      )}

      <Modal visible={fileContent !== null || fileLoading} animationType="slide" onRequestClose={() => setFileContent(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>{fileViewName}</Text>
            <TouchableOpacity onPress={() => setFileContent(null)}>
              <Text style={styles.closeBtn}>CLOSE</Text>
            </TouchableOpacity>
          </View>
          {fileLoading ? (
            <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>
          ) : (
            <ScrollView style={styles.fileView}>
              <Text style={styles.fileContent}>{fileContent}</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  backBtn: { paddingRight: 8 },
  backText: { color: COLORS.accent, fontSize: 14 },
  pathText: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'monospace', flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  icon: { fontSize: 16, marginRight: 12 },
  name: { color: COLORS.textPrimary, fontSize: 13 },
  dirName: { color: COLORS.accent, fontWeight: '600' },
  size: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  chevron: { color: COLORS.muted, fontSize: 18 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, padding: 24 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.accent, fontSize: 13, fontWeight: '700', flex: 1, marginRight: 12, fontFamily: 'monospace' },
  closeBtn: { color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  fileView: { flex: 1, padding: 12 },
  fileContent: { color: COLORS.textPrimary, fontSize: 11, fontFamily: 'monospace', lineHeight: 18 },
});

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';

export default function ConfigScreen() {
  const [yaml, setYaml] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setError(null);
    try {
      const client = await getApiClient();
      const res = await client.get<{ yaml: string }>('/api/config/raw');
      setYaml(res.data.yaml);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchConfig(); }, [fetchConfig]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConfig();
    setRefreshing(false);
  };

  const openEditor = () => {
    setEditValue(yaml ?? '');
    setEditing(true);
  };

  const saveConfig = async () => {
    Alert.alert('Save Config', 'Save and apply this config? A gateway restart may be required.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: async () => {
          setSaving(true);
          try {
            const client = await getApiClient();
            await client.post('/api/config/raw', { yaml: editValue });
            setYaml(editValue);
            setEditing(false);
            Alert.alert('Saved', 'Config saved successfully.');
          } catch {
            Alert.alert('Error', 'Could not save config.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>;

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        {error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchConfig}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.toolbar}>
              <Text style={styles.path}>config.yaml</Text>
              <TouchableOpacity style={styles.editBtn} onPress={openEditor}>
                <Text style={styles.editBtnText}>EDIT</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.yaml}>{yaml}</Text>
          </>
        )}
      </ScrollView>

      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>EDIT CONFIG</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveConfig} style={styles.saveBtn} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color={COLORS.background} /> : <Text style={styles.saveText}>SAVE</Text>}
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.editor}
            value={editValue}
            onChangeText={setEditValue}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            selectionColor={COLORS.accent}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  path: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'monospace' },
  editBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 6 },
  editBtnText: { color: COLORS.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  yaml: { color: COLORS.textPrimary, fontSize: 11, fontFamily: 'monospace', padding: 12, lineHeight: 18 },
  errorText: { color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.5 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  modalActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: COLORS.accent },
  saveText: { color: COLORS.background, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  editor: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 11,
    fontFamily: 'monospace',
    padding: 12,
    lineHeight: 18,
    textAlignVertical: 'top',
    backgroundColor: COLORS.inputBg,
  },
});

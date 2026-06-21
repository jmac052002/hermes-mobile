import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useConnection } from '../../src/context/ConnectionContext';
import { invalidateApiClient } from '../../src/services/apiClient';
import { COLORS } from '../../src/constants';

export default function SettingsScreen() {
  const { baseUrl, token, status, isConnected, isConnecting, error, connect, disconnect } = useConnection();
  const [urlInput, setUrlInput] = useState(baseUrl);
  const [tokenInput, setTokenInput] = useState(token ?? '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUrlInput(baseUrl);
    setTokenInput(token ?? '');
  }, [baseUrl, token]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await connect(urlInput.trim(), tokenInput.trim() || undefined);
    setSaving(false);
    if (ok) {
      Alert.alert('Connected', 'Settings saved and connection verified.');
    }
  };

  const handleDisconnect = async () => {
    Alert.alert('Disconnect', 'Clear stored credentials and return to connect screen?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await disconnect();
          invalidateApiClient();
          router.replace('/connect');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Connection status */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
          <Text style={styles.statusText}>
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        {status && (
          <Text style={styles.versionText}>Hermes v{status.version} · {status.gateway_state}</Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Base URL */}
      <Text style={styles.label}>BASE URL</Text>
      <TextInput
        style={styles.input}
        value={urlInput}
        onChangeText={setUrlInput}
        placeholder="https://dashboard.josephsdctlabtraining.com"
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        selectionColor={COLORS.accent}
      />

      {/* Session token */}
      <Text style={styles.label}>SESSION TOKEN (OPTIONAL)</Text>
      <TextInput
        style={styles.input}
        value={tokenInput}
        onChangeText={setTokenInput}
        placeholder="Leave blank if auth not required"
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        selectionColor={COLORS.accent}
      />

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving || isConnecting}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.background} size="small" />
        ) : (
          <Text style={styles.saveBtnText}>SAVE &amp; RECONNECT</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
        <Text style={styles.disconnectText}>DISCONNECT</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        The base URL should point to your Hermes instance via Tailscale or your network.{'\n'}Session token is only required when auth_required is true.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 20,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  versionText: { color: COLORS.textSecondary, fontSize: 11 },
  errorText: { color: COLORS.error, fontSize: 11, marginTop: 4 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.background, fontWeight: '700', fontSize: 12, letterSpacing: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  disconnectBtn: {
    borderWidth: 1,
    borderColor: COLORS.error + '55',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  disconnectText: { color: COLORS.error, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  hint: { color: COLORS.muted, fontSize: 11, lineHeight: 18, textAlign: 'center' },
});

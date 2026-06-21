import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useConnection } from '../src/context/ConnectionContext';
import { COLORS } from '../src/constants';

export default function ConnectScreen() {
  const { connect, error, isConnecting } = useConnection();
  const [baseUrl, setBaseUrl] = useState('http://100.125.69.27:9119');
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleConnect = async () => {
    const ok = await connect(baseUrl.trim(), token.trim() || undefined);
    if (ok) {
      router.replace('/(main)/system');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.brand}>HERMES{'\n'}AGENT</Text>
        <Text style={styles.subtitle}>Connect to your Hermes instance</Text>

        <Text style={styles.label}>BASE URL</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="http://100.125.69.27:9119"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          selectionColor={COLORS.accent}
        />

        <Text style={styles.label}>SESSION TOKEN (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="Leave blank if auth not required"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          selectionColor={COLORS.accent}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isConnecting && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color={COLORS.background} size="small" />
          ) : (
            <Text style={styles.buttonText}>CONNECT</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Make sure Tailscale is connected on your device before connecting.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: {
    color: COLORS.accent,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    lineHeight: 38,
    marginBottom: 8,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 40 },
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
    fontSize: 14,
    marginBottom: 20,
  },
  error: { color: COLORS.error, fontSize: 13, marginBottom: 16 },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
  },
  hint: { color: COLORS.muted, fontSize: 12, marginTop: 24, textAlign: 'center' },
});

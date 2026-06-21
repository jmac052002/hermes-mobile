import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../src/constants';

const DOCS_URL = 'https://claude-code.nousresearch.com/docs';

export default function DocsScreen() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(DOCS_URL);

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
          onPress={() => webRef.current?.goBack()}
          disabled={!canGoBack}
        >
          <Text style={[styles.navBtnText, !canGoBack && styles.navBtnTextDisabled]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
          onPress={() => webRef.current?.goForward()}
          disabled={!canGoForward}
        >
          <Text style={[styles.navBtnText, !canGoForward && styles.navBtnTextDisabled]}>›</Text>
        </TouchableOpacity>
        <Text style={styles.urlBar} numberOfLines={1}>{currentUrl}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => webRef.current?.reload()}>
          <Text style={styles.navBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator color={COLORS.accent} size="small" />
        </View>
      )}

      <WebView
        ref={webRef}
        source={{ uri: DOCS_URL }}
        style={styles.webview}
        onNavigationStateChange={(state) => {
          setCanGoBack(state.canGoBack);
          setCanGoForward(state.canGoForward);
          setCurrentUrl(state.url);
        }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        allowsBackForwardNavigationGestures
        userAgent="Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: COLORS.accent, fontSize: 20, lineHeight: 24 },
  navBtnTextDisabled: { color: COLORS.muted },
  urlBar: { flex: 1, color: COLORS.textSecondary, fontSize: 10, fontFamily: 'monospace' },
  loadingBar: { paddingVertical: 4, alignItems: 'center', backgroundColor: COLORS.surface },
  webview: { flex: 1 },
});

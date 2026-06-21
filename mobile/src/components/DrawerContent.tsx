import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { useRouter, usePathname } from 'expo-router';
import { COLORS } from '../constants';
import { useConnection } from '../context/ConnectionContext';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Sessions', route: '/(main)/sessions', icon: '💬' },
  { label: 'Files', route: '/(main)/files', icon: '📁' },
  { label: 'Analytics', route: '/(main)/analytics', icon: '📊' },
  { label: 'Models', route: '/(main)/models', icon: '🧠' },
  { label: 'Logs', route: '/(main)/logs', icon: '📋' },
  { label: 'Cron', route: '/(main)/cron', icon: '⏰' },
  { label: 'Skills', route: '/(main)/skills', icon: '📦' },
  { label: 'Plugins', route: '/(main)/plugins', icon: '🧩' },
  { label: 'MCP', route: '/(main)/mcp', icon: '🔌' },
  { label: 'Channels', route: '/(main)/channels', icon: '📡' },
  { label: 'Webhooks', route: '/(main)/webhooks', icon: '🪝' },
  { label: 'Pairing', route: '/(main)/pairing', icon: '🔐' },
  { label: 'Profiles', route: '/(main)/profiles', icon: '👤' },
  { label: 'Config', route: '/(main)/config', icon: '⚙️' },
  { label: 'Keys', route: '/(main)/keys', icon: '🔑' },
  { label: 'System', route: '/(main)/system', icon: '🔧' },
  { label: 'Docs', route: '/(main)/docs', icon: '📖' },
  { label: 'Settings', route: '/(main)/settings', icon: '⚙️' },
];

export function DrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useConnection();

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>HERMES{'\n'}AGENT</Text>
        <Text style={styles.version}>{status?.version ?? '—'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const routeSegment = item.route.replace('/(main)/', '');
          const isActive = pathname.includes(routeSegment);
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label.toUpperCase()}
              </Text>
              {isActive && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {status && (
        <View style={styles.footer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: status.gateway_running ? COLORS.success : COLORS.error }
          ]} />
          <Text style={styles.footerText}>
            Gateway {status.gateway_state}
          </Text>
        </View>
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.drawerBg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brand: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 22,
  },
  version: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'relative',
  },
  navItemActive: { backgroundColor: '#ffffff08' },
  navIcon: { fontSize: 14, marginRight: 12, width: 20, textAlign: 'center' },
  navLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    flex: 1,
  },
  navLabelActive: { color: COLORS.accent },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.accent,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  footerText: { color: COLORS.textSecondary, fontSize: 11 },
});

import { Drawer } from 'expo-router/drawer';
import { DrawerContent } from '../../src/components/DrawerContent';

export default function MainLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#0d0d0d' },
        headerTintColor: '#e0e0e0',
        headerTitleStyle: { fontWeight: '700', letterSpacing: 1 },
        drawerStyle: { backgroundColor: '#0d0d0d', width: 260 },
        sceneContainerStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Drawer.Screen name="system" options={{ title: 'SYSTEM' }} />
      <Drawer.Screen name="sessions" options={{ title: 'SESSIONS' }} />
      <Drawer.Screen name="files" options={{ title: 'FILES' }} />
      <Drawer.Screen name="analytics" options={{ title: 'ANALYTICS' }} />
      <Drawer.Screen name="models" options={{ title: 'MODELS' }} />
      <Drawer.Screen name="logs" options={{ title: 'LOGS' }} />
      <Drawer.Screen name="cron" options={{ title: 'CRON' }} />
      <Drawer.Screen name="skills" options={{ title: 'SKILLS' }} />
      <Drawer.Screen name="plugins" options={{ title: 'PLUGINS' }} />
      <Drawer.Screen name="mcp" options={{ title: 'MCP' }} />
      <Drawer.Screen name="channels" options={{ title: 'CHANNELS' }} />
      <Drawer.Screen name="webhooks" options={{ title: 'WEBHOOKS' }} />
      <Drawer.Screen name="pairing" options={{ title: 'PAIRING' }} />
      <Drawer.Screen name="profiles" options={{ title: 'PROFILES' }} />
      <Drawer.Screen name="config" options={{ title: 'CONFIG' }} />
      <Drawer.Screen name="keys" options={{ title: 'API KEYS' }} />
      <Drawer.Screen name="docs" options={{ title: 'DOCS' }} />
      <Drawer.Screen name="settings" options={{ title: 'SETTINGS' }} />
    </Drawer>
  );
}

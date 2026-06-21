import { Redirect } from 'expo-router';
import { useConnection } from '../src/context/ConnectionContext';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../src/constants';

export default function Index() {
  const { isConnecting, isConnected } = useConnection();

  if (isConnecting) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return isConnected ? <Redirect href="/(main)/system" /> : <Redirect href="/connect" />;
}

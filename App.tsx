import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { getDatabase } from './src/database/database';
import RootNavigator from './src/navigation/RootNavigator';
import { useUserStore } from './src/store/userStore';
import { Colors } from './src/constants/theme';

const NAV_THEME = {
  dark: true,
  colors: {
    primary: Colors.purple,
    background: Colors.bg,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.purple,
  },
};

function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <Text style={loadingStyles.logo}>ASCEND</Text>
      <Text style={loadingStyles.sub}>Initialising…</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 40,
    letterSpacing: 6,
    color: Colors.purple,
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const loadProfile = useUserStore((s) => s.loadProfile);

  const [fontsLoaded, fontError] = useFonts({
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    // Shorthand aliases used via Fonts.display / Fonts.body in theme
    Rajdhani: Rajdhani_700Bold,
    DMSans: DMSans_400Regular,
  });

  const initDb = useCallback(async () => {
    try {
      await getDatabase();
      await loadProfile();
      setDbReady(true);
    } catch (err) {
      console.error('Database init failed:', err);
      setDbError(err instanceof Error ? err.message : 'Unknown DB error');
    }
  }, [loadProfile]);

  useEffect(() => {
    void initDb();
  }, [initDb]);

  const isReady = fontsLoaded && dbReady;
  const hasError = fontError !== null || dbError !== null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        {hasError ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>
              Failed to start: {fontError?.message ?? dbError}
            </Text>
          </View>
        ) : !isReady ? (
          <LoadingScreen />
        ) : (
          <NavigationContainer theme={NAV_THEME}>
            <RootNavigator />
          </NavigationContainer>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.red,
    fontSize: 14,
    textAlign: 'center',
  },
});

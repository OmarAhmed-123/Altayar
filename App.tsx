import React, { useEffect, useCallback } from 'react';
import { StatusBar, Platform, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';
import Toast from 'react-native-toast-message';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'new NativeEventEmitter',
]);

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes (replaced cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const AppContent: React.FC = () => {
  const { loadUser } = useAuthStore();

  const initializeApp = useCallback(async () => {
    try {
      await loadUser();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  }, [loadUser]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return <AppNavigator />;
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor="#6366F1"
              translucent={Platform.OS === 'android'}
            />
            <AppContent />
            <Toast />
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default App;
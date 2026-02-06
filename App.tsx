/**
 * Altayar App
 * Main entry point for the React Native application
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme, LogBox, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// Ignore InteractionManager deprecation warning from React Navigation
// This warning comes from React Navigation's internal code, not our code
// We'll suppress it until React Navigation updates their code
LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
  'InteractionManager has been deprecated and will be removed in a future release',
  'requestIdleCallback',
  /InteractionManager/,
  /requestIdleCallback/,
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'SafeAreaView has been deprecated',
  /SafeAreaView.*deprecated/,
  // Ignore React Navigation Card warnings
  /Card\.js/,
  /CardContainer\.js/,
  /CardStack\.js/,
  /StackView\.js/,
  // Ignore react-native-video Native module warnings (we handle this gracefully)
  /Native module check failed/,
  /react-native-video.*not.*installed/,
  /Video.*will use fallback UI/,
  // CRITICAL: Ignore getViewManagerConfig errors from react-native-video
  /Cannot read property 'getViewManagerConfig'/,
  /getViewManagerConfig.*of null/,
  /Video\.js.*getViewManagerConfig/,
]);

// Suppress specific warnings that are from third-party libraries
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('InteractionManager') ||
      message.includes('requestIdleCallback') ||
      message.includes('Card.js') ||
      message.includes('CardContainer.js') ||
      message.includes('SafeAreaView has been deprecated') ||
      message.includes('Native module check failed') ||
      message.includes('react-native-video') ||
      message.includes('Video will use fallback UI') ||
      message.includes('getViewManagerConfig') ||
      message.includes('Video.js')
    ) {
      // Suppress these warnings
      return;
    }
    originalWarn.apply(console, args);
  };
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <ThemeProvider>
            <LanguageProvider>
              <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
              />
              <AppNavigator />
              <Toast />
            </LanguageProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;

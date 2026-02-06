/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { preloadIcons } from './src/utils/iconHelper';

// Preload icons to prevent Chinese character display issues
preloadIcons().then((loaded) => {
  if (loaded) {
    console.log('✅ Icons loaded successfully');
  } else {
    console.warn('⚠️ Icons may not be loaded properly');
  }
});

AppRegistry.registerComponent(appName, () => App);

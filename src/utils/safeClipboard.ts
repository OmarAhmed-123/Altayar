import { NativeModules } from 'react-native';

type ClipboardModule = {
  setString: (text: string) => void | Promise<void>;
  getString: () => Promise<string>;
};

const createFallbackModule = (): ClipboardModule => ({
  setString: () => {
    if (__DEV__) {
      console.warn('⚠️ [safeClipboard] Clipboard module is not linked. Text copy skipped.');
    }
  },
  getString: async () => '',
});

let clipboardModule: ClipboardModule = createFallbackModule();
let clipboardLinked = false;

try {
  const linkedClipboard = require('@react-native-clipboard/clipboard').default as ClipboardModule;
  if (linkedClipboard?.setString && linkedClipboard?.getString) {
    clipboardModule = linkedClipboard;
    clipboardLinked = true;
  }
} catch (error) {
  const legacyClipboard = (NativeModules as any)?.Clipboard;
  if (legacyClipboard?.setString && legacyClipboard?.getString) {
    clipboardModule = {
      setString: legacyClipboard.setString,
      getString: legacyClipboard.getString,
    };
    clipboardLinked = true;
  } else if (__DEV__) {
    console.warn('⚠️ [safeClipboard] Falling back to no-op clipboard implementation.', error);
  }
}

export const isClipboardAvailable = clipboardLinked;
export default clipboardModule;


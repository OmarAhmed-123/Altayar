import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { NativeModules, Platform } from 'react-native';
import { SafeVideoPlayer } from '../src/components/common/SafeVideoPlayer';
import VideoComponent from 'react-native-video';
import { WebView as WebViewComponent } from 'react-native-webview';

jest.mock('react-native-video', () => {
  const MockVideo = () => null;
  return {
    __esModule: true,
    default: MockVideo,
  };
});

jest.mock('react-native-webview', () => {
  const MockWebView = () => null;
  return {
    __esModule: true,
    WebView: MockWebView,
    default: MockWebView,
  };
});

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#000000',
        textSecondary: '#FFFFFF',
        primary: '#FF3040',
      },
    },
  }),
}));

jest.mock('../src/utils/iconHelper', () => ({
  SafeIcon: () => null,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('token'),
}));

const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');

beforeAll(() => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => 'android',
  });
});

afterAll(() => {
  if (platformDescriptor) {
    Object.defineProperty(Platform, 'OS', platformDescriptor);
  }
});

describe('SafeVideoPlayer (Android)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    delete NativeModules.RNVideo;
    delete (globalThis as any).__ALTAYAR_FORCE_WEB_VIDEO__;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderPlayer = async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(
        <SafeVideoPlayer
          source={{ uri: 'http://example.com/video.mp4' }}
          paused={false}
          controls={false}
          repeat
        />,
      );
    });
    await act(async () => {
      jest.runAllTimers();
    });
    if (!tree) {
      throw new Error('Renderer not created');
    }
    return tree;
  };

  it('prefers native video when the native module is available', async () => {
    NativeModules.RNVideo = { exists: true };
    const tree = await renderPlayer();
    const videoCount = tree.root.findAllByType(VideoComponent as React.ComponentType<any>).length;
    const webViewCount = tree.root.findAllByType(WebViewComponent as React.ComponentType<any>).length;
    expect(videoCount).toBeGreaterThan(0);
    expect(webViewCount).toBe(0);
  });

  it('falls back to WebView when the native module is unavailable', async () => {
    delete NativeModules.RNVideo;
    const tree = await renderPlayer();
    const webViewCount = tree.root.findAllByType(WebViewComponent as React.ComponentType<any>).length;
    expect(webViewCount).toBeGreaterThan(0);
  });
});


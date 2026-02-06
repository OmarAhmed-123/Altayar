declare module 'react-native-video' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface OnLoadData {
    duration: number;
    naturalSize?: {
      width: number;
      height: number;
      orientation: 'portrait' | 'landscape';
    };
    [key: string]: any;
  }

  export interface OnProgressData {
    currentTime: number;
    playableDuration: number;
    seekableDuration: number;
  }

  export interface VideoProperties extends ViewProps {
    source: { uri?: string; headers?: Record<string, string> } | number;
    controls?: boolean;
    paused?: boolean;
    muted?: boolean;
    repeat?: boolean;
    resizeMode?: 'contain' | 'cover' | 'stretch';
    playInBackground?: boolean;
    playWhenInactive?: boolean;
    poster?: string;
    posterResizeMode?: 'contain' | 'cover' | 'stretch';
    ignoreSilentSwitch?: 'ignore' | 'obey';
    bufferConfig?: {
      minBufferMs?: number;
      maxBufferMs?: number;
      bufferForPlaybackMs?: number;
      bufferForPlaybackAfterRebufferMs?: number;
    };
    onLoadStart?: () => void;
    onLoad?: (data: OnLoadData) => void;
    onReadyForDisplay?: (data: OnLoadData) => void;
    onProgress?: (data: OnProgressData) => void;
    onEnd?: () => void;
    onError?: (error: any) => void;
    onBuffer?: (data: { isBuffering: boolean }) => void;
  }

  export default class Video extends React.Component<VideoProperties> {}
}


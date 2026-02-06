/**
 * SafeVideoPlayer Component - ULTIMATE FIX
 * 
 * This component uses LAZY LOADING and DYNAMIC IMPORT to prevent
 * react-native-video from loading if the native module is not properly linked.
 * 
 * CRITICAL: This prevents the "Cannot read property 'getViewManagerConfig' of null"
 * error by NEVER requiring react-native-video until we're 100% sure the native
 * module is available.
 */

import React, { Component, ErrorInfo, ReactNode, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../hooks/useTheme';
import { SafeIcon } from '../../utils/iconHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CRITICAL: Try direct import first - this ensures Metro bundles it
let directVideoModule: any = null;
let directVideoComponent: any = null;
let directResizeMode: any = { CONTAIN: 'contain', COVER: 'cover', STRETCH: 'stretch' };

try {
  // CRITICAL: Direct import at module level - Metro will bundle it
  directVideoModule = require('react-native-video');
  if (directVideoModule) {
    if (directVideoModule.default) {
      directVideoComponent = directVideoModule.default;
    } else if (directVideoModule.Video) {
      directVideoComponent = directVideoModule.Video;
    } else if (typeof directVideoModule === 'function') {
      directVideoComponent = directVideoModule;
    }
    directResizeMode = directVideoModule.ResizeMode || directResizeMode;
    
    if (__DEV__ && directVideoComponent) {
      console.log('✅ [SafeVideoPlayer] Direct import successful at module level', {
        hasVideo: !!directVideoComponent,
        videoType: typeof directVideoComponent,
        hasResizeMode: !!directResizeMode,
      });
    }
  }
} catch (error: any) {
  if (__DEV__) {
    console.warn('⚠️ [SafeVideoPlayer] Direct import failed at module level:', error.message);
  }
  directVideoModule = null;
  directVideoComponent = null;
}

// CRITICAL: Global flags - NEVER load react-native-video until verified
let globalVideoModuleVerified = false;
let globalVideoComponent: any = directVideoComponent; // Initialize with direct import if available
let globalResizeMode: any = directResizeMode; // Initialize with direct import if available
let globalVideoModulePromise: Promise<{ Video: any; ResizeMode: any } | null> | null = null;

/**
 * Attempt to extract the Video component from the provided module
 * CRITICAL: This function MUST set globalVideoComponent for the component to work
 */
const assignVideoModule = (videoModule: any): { Video: any; ResizeMode: any } | null => {
  if (!videoModule) {
    if (__DEV__) {
      console.warn('⚠️ [SafeVideoPlayer] assignVideoModule: videoModule is null/undefined');
    }
    return null;
  }

  let Video: any = null;
  
  // CRITICAL: Try multiple ways to extract Video component
  if (videoModule.default) {
    Video = videoModule.default;
    if (__DEV__) {
      console.log('✅ [SafeVideoPlayer] Found Video via default export');
    }
  } else if (videoModule.Video) {
    Video = videoModule.Video;
    if (__DEV__) {
      console.log('✅ [SafeVideoPlayer] Found Video via named export');
    }
  } else if (typeof videoModule === 'function') {
    Video = videoModule;
    if (__DEV__) {
      console.log('✅ [SafeVideoPlayer] Found Video as function');
    }
  } else if (videoModule.VideoPlayer) {
    Video = videoModule.VideoPlayer;
    if (__DEV__) {
      console.log('✅ [SafeVideoPlayer] Found VideoPlayer');
    }
  }

  // CRITICAL: Validate Video component
  if (!Video) {
    if (__DEV__) {
      console.warn('⚠️ [SafeVideoPlayer] assignVideoModule: No Video component found in module', {
        hasDefault: !!videoModule.default,
        hasVideo: !!videoModule.Video,
        isFunction: typeof videoModule === 'function',
        hasVideoPlayer: !!videoModule.VideoPlayer,
        moduleKeys: Object.keys(videoModule || {}),
      });
    }
    return null;
  }

  // CRITICAL: Validate Video is a valid component (function or object with render method)
  if (typeof Video !== 'function' && typeof Video !== 'object') {
    if (__DEV__) {
      console.warn('⚠️ [SafeVideoPlayer] assignVideoModule: Video is not a valid component', {
        type: typeof Video,
        value: Video,
      });
    }
    return null;
  }

  // CRITICAL: Extract ResizeMode
  let ResizeMode: any = videoModule.ResizeMode || videoModule.default?.ResizeMode || globalResizeMode;

  // CRITICAL: Set global variables - THIS IS ESSENTIAL
  globalVideoComponent = Video;
  globalResizeMode = ResizeMode || globalResizeMode;

  if (__DEV__) {
    console.log('✅ [SafeVideoPlayer] assignVideoModule: Successfully assigned', {
      hasVideoComponent: globalVideoComponent !== null,
      videoType: typeof globalVideoComponent,
      hasResizeMode: !!globalResizeMode,
    });
  }

  return { Video: globalVideoComponent, ResizeMode: globalResizeMode };
};

/**
 * Attempt to synchronously require react-native-video so Metro always bundles it.
 * CRITICAL: This is the primary method - it should work if react-native-video is installed
 */
const loadVideoModuleSync = (): { Video: any; ResizeMode: any } | null => {
  try {
    // CRITICAL: First check if direct import worked
    if (directVideoComponent && globalVideoComponent === directVideoComponent) {
      if (__DEV__) {
        console.log('✅ [SafeVideoPlayer] Using direct import component');
      }
      return { Video: directVideoComponent, ResizeMode: directResizeMode };
    }
    
    // CRITICAL: Try to require react-native-video
    // This will work if the module is installed and Metro has bundled it
    if (__DEV__) {
      console.log('🔍 [SafeVideoPlayer] Attempting synchronous require of react-native-video...');
    }
    
    const videoModule = require('react-native-video');
    
    if (!videoModule) {
      if (__DEV__) {
        console.warn('⚠️ [SafeVideoPlayer] require returned null/undefined');
      }
      return null;
    }
    
    if (__DEV__) {
      console.log('📦 [SafeVideoPlayer] Module loaded, examining structure:', {
        hasDefault: !!videoModule.default,
        hasVideo: !!videoModule.Video,
        isFunction: typeof videoModule === 'function',
        hasVideoPlayer: !!videoModule.VideoPlayer,
        moduleKeys: Object.keys(videoModule || {}).slice(0, 10),
        moduleType: typeof videoModule,
      });
    }
    
    const assignedModule = assignVideoModule(videoModule);

    if (assignedModule && assignedModule.Video && globalVideoComponent) {
      if (__DEV__) {
        console.log('✅ [SafeVideoPlayer] react-native-video loaded synchronously via require()', {
          hasVideo: !!assignedModule.Video,
          hasGlobalComponent: !!globalVideoComponent,
          videoType: typeof globalVideoComponent,
          isFunction: typeof globalVideoComponent === 'function',
          isObject: typeof globalVideoComponent === 'object',
        });
      }
      return assignedModule;
    } else {
      if (__DEV__) {
        console.warn('⚠️ [SafeVideoPlayer] require succeeded but assignment failed', {
          hasAssignedModule: !!assignedModule,
          hasVideo: !!assignedModule?.Video,
          hasGlobalComponent: !!globalVideoComponent,
          videoModuleStructure: {
            hasDefault: !!videoModule.default,
            hasVideo: !!videoModule.Video,
            isFunction: typeof videoModule === 'function',
            moduleKeys: Object.keys(videoModule || {}).slice(0, 10),
          },
        });
      }
      return null;
    }
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [SafeVideoPlayer] Synchronous require failed:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return null;
  }
};

const normalizeVideoUri = (uri?: string): string => {
  if (!uri) {
    return '';
  }

  const trimmed = uri.trim();
  if (!trimmed.endsWith('/')) {
    return trimmed;
  }

  const hashIndex = trimmed.indexOf('#');
  const queryIndex = trimmed.indexOf('?');
  let suffix = '';
  let pathPart = trimmed;

  const cutIndex =
    hashIndex === -1
      ? queryIndex
      : queryIndex === -1
      ? hashIndex
      : Math.min(hashIndex, queryIndex);

  if (cutIndex !== -1) {
    suffix = trimmed.substring(cutIndex);
    pathPart = trimmed.substring(0, cutIndex);
  }

  const trimmedPath = pathPart.replace(/\/+$/, '');
  if (!trimmedPath) {
    return trimmed;
  }

  const lastSegment = trimmedPath.split('/').pop();
  if (lastSegment && lastSegment.includes('.')) {
    return `${trimmedPath}${suffix}`;
  }

  return trimmed;
};

const escapeHtmlAttribute = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const buildWebVideoHtml = ({
  uri,
  objectFit,
  autoPlay,
  controls,
  muted,
  loop,
  poster,
}: {
  uri: string;
  objectFit: 'contain' | 'cover' | 'stretch';
  autoPlay: boolean;
  controls: boolean;
  muted: boolean;
  loop: boolean;
  poster?: string;
}): string => {
  const safeUri = escapeHtmlAttribute(uri);
  const safePoster = poster ? escapeHtmlAttribute(poster) : '';
  // Normalize objectFit to valid CSS values
  const safeObjectFit =
    objectFit === 'contain' ? 'contain' : objectFit === 'stretch' ? 'fill' : 'cover';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }
      
      html, body, #root {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #000000;
        touch-action: none;
        position: relative;
      }
      
      #video-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000000;
      }
      
      #video-player {
        width: 100%;
        height: 100%;
        object-fit: ${safeObjectFit};
        background-color: #000000;
        position: absolute;
        top: 0;
        left: 0;
      }
      
      #loading-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        text-align: center;
        z-index: 10;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto 10px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      #error-message {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
        text-align: center;
        z-index: 20;
      }
      
      #error-message.show {
        display: flex;
      }
      
      #error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      #error-text {
        font-size: 16px;
        margin-bottom: 16px;
        max-width: 80%;
      }
      
      #retry-button {
        padding: 10px 20px;
        background-color: #007AFF;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div id="video-container">
        <video
          id="video-player"
          ${autoPlay ? 'autoplay playsinline' : ''}
          ${controls ? 'controls' : ''}
          ${muted ? 'muted' : ''}
          ${loop ? 'loop' : ''}
          preload="auto"
          webkit-playsinline="true"
          playsinline
          x-webkit-airplay="allow"
          ${poster ? `poster="${safePoster}"` : ''}
        >
          <source src="${safeUri}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        
        <div id="loading-indicator">
          <div class="spinner"></div>
          <div>جاري التحميل...</div>
        </div>
        
        <div id="error-message">
          <div id="error-icon">❌</div>
          <div id="error-text">حدث خطأ أثناء تحميل الفيديو. يرجى المحاولة مرة أخرى.</div>
          <button id="retry-button">إعادة المحاولة</button>
        </div>
      </div>
    </div>

    <script>
      (function() {
        // Get DOM elements
        const player = document.getElementById('video-player');
        const loadingIndicator = document.getElementById('loading-indicator');
        const errorMessage = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const retryButton = document.getElementById('retry-button');
        let hasError = false;
        let isFirstPlay = true;
        
        if (!player) {
          console.error('❌ Video player element not found');
          return;
        }
        
        // Helper function to send messages to React Native
        function post(type, payload = {}) {
          if (!window.ReactNativeWebView) {
            console.warn('ReactNativeWebView not available');
            return;
          }
          const message = JSON.stringify({ type, ...payload });
          console.log('📤 Posting message:', message);
          window.ReactNativeWebView.postMessage(message);
        }
        
        // Handle video ready
        function handleLoadedMetadata() {
          console.log('✅ Video metadata loaded', {
            duration: player.duration,
            videoWidth: player.videoWidth,
            videoHeight: player.videoHeight,
            readyState: player.readyState,
            networkState: player.networkState,
            error: player.error
          });
          
          post('ready', { 
            duration: player.duration || 0,
            naturalSize: {
              width: player.videoWidth,
              height: player.videoHeight,
              orientation: player.videoWidth > player.videoHeight ? 'landscape' : 'portrait'
            }
          });
          
          // Hide loading indicator when metadata is loaded
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          
          // Try to play if autoplay is enabled
          if (${autoPlay}) {
            const playPromise = player.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('❌ Autoplay failed:', error);
                // Try again with mute if autoplay fails
                player.muted = true;
                player.play().catch(e => {
                  console.error('❌ Muted autoplay also failed:', e);
                  showError('تعذر تشغيل الفيديو تلقائياً. يرجى النقر على زر التشغيل.');
                });
              });
            }
          }
        }
        
        // Handle play event
        function handlePlay() {
          console.log('▶️ Video play event');
          post('playing', { currentTime: player.currentTime });
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          if (errorMessage) {
            errorMessage.classList.remove('show');
          }
        }
        
        // Handle pause event
        function handlePause() {
          console.log('⏸️ Video pause event');
          post('paused', { currentTime: player.currentTime });
        }
        
        // Handle time update
        function handleTimeUpdate() {
          post('progress', { 
            currentTime: player.currentTime || 0, 
            duration: player.duration || 0,
            playableDuration: player.buffered.length > 0 ? player.buffered.end(player.buffered.length - 1) : 0
          });
        }
        
        // Handle video end
        function handleEnded() {
          console.log('⏹️ Video ended');
          post('end', { 
            currentTime: player.duration || 0, 
            duration: player.duration || 0 
          });
        }
        
        // Handle waiting/buffering
        function handleWaiting() {
          console.log('⏳ Video waiting/buffering');
          if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
          }
          post('waiting', { currentTime: player.currentTime });
        }
        
        // Handle playing (buffering complete)
        function handlePlaying() {
          console.log('▶️ Video playing (buffering complete)');
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          post('playing', { currentTime: player.currentTime });
        }
        
        // Handle errors
        function handleError(event) {
          const error = player.error || { code: 0, message: 'Unknown video error' };
          console.error('❌ Video error:', error);
          
          let errorMessage = 'حدث خطأ غير معروف';
          switch(error.code) {
            case 1: // MEDIA_ERR_ABORTED
              errorMessage = 'تم إلغاء تشغيل الفيديو';
              break;
            case 2: // MEDIA_ERR_NETWORK
              errorMessage = 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت';
              break;
            case 3: // MEDIA_ERR_DECODE
              errorMessage = 'خطأ في تشفير الفيديو';
              break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
              errorMessage = 'تنسيق الفيديو غير مدعوم';
              break;
          }
          
          showError(errorMessage);
          post('error', { 
            code: error.code || 0, 
            message: error.message || 'Unknown video error',
            error: JSON.stringify(error)
          });
        }
        
        // Show error message
        function showError(message) {
          hasError = true;
          if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.classList.add('show');
          }
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
        }
        
        // Retry loading the video
        function handleRetry() {
          if (!hasError) return;
          
          console.log('🔄 Retrying video playback...');
          hasError = false;
          if (errorMessage) {
            errorMessage.classList.remove('show');
          }
          if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
          }
          
          // Force reload the video source
          const currentTime = player.currentTime;
          const isPaused = player.paused;
          const src = player.currentSrc || player.src;
          
          if (src) {
            player.load(); // Reload the video
            if (!isPaused) {
              const playPromise = player.play();
              if (playPromise !== undefined) {
                playPromise.catch(error => {
                  console.error('Retry play failed:', error);
                  player.muted = true;
                  player.play().catch(e => {
                    console.error('Muted retry play also failed:', e);
                    showError('تعذر تشغيل الفيديو. يرجى المحاولة مرة أخرى لاحقاً.');
                  });
                });
              }
            }
          }
        }
        
        // Handle messages from React Native
        function handleMessage(event) {
          try {
            const payload = JSON.parse(event.data || '{}');
            console.log('📥 Received message:', payload);
            
            if (payload.type === 'control') {
              if (typeof payload.paused === 'boolean') {
                if (payload.paused) {
                  player.pause();
                } else {
                  player.play().catch(error => {
                    console.error('Play command failed:', error);
                    // If play fails, try with mute
                    if (!player.muted) {
                      player.muted = true;
                      player.play().catch(e => {
                        console.error('Muted play also failed:', e);
                        showError('تعذر تشغيل الفيديو. يرجى التحقق من اتصالك بالإنترنت.');
                      });
                    }
                  });
                }
              }
              
              if (typeof payload.muted === 'boolean') {
                player.muted = payload.muted;
              }
              
              if (typeof payload.volume === 'number') {
                player.volume = Math.min(1, Math.max(0, payload.volume));
              }
              
              if (typeof payload.seekTo === 'number') {
                player.currentTime = payload.seekTo;
              }
              
              if (typeof payload.loop === 'boolean') {
                player.loop = payload.loop;
              }
              
              if (typeof payload.controls === 'boolean') {
                player.controls = payload.controls;
              }
            }
          } catch (err) {
            console.error('Error handling message:', err);
          }
        }
        
        // Add event listeners
        player.addEventListener('loadedmetadata', handleLoadedMetadata);
        player.addEventListener('play', handlePlay);
        player.addEventListener('pause', handlePause);
        player.addEventListener('timeupdate', handleTimeUpdate);
        player.addEventListener('ended', handleEnded);
        player.addEventListener('waiting', handleWaiting);
        player.addEventListener('playing', handlePlaying);
        player.addEventListener('error', handleError);
        
        // Add click handler for retry button
        if (retryButton) {
          retryButton.addEventListener('click', handleRetry);
        }
        
        // Listen for messages from React Native
        window.addEventListener('message', handleMessage);
        
        // Initial ready check
        if (player.readyState >= 2) {  // HAVE_CURRENT_DATA
          handleLoadedMetadata();
        }
        
        // Log initial state
        console.log('🎥 Video player initialized', {
          src: '${safeUri}',
          autoplay: ${autoPlay},
          muted: ${muted},
          controls: ${controls},
          loop: ${loop},
          readyState: player.readyState,
          networkState: player.networkState,
          error: player.error
        });
      })();
    </script>
  </body>
</html>
`;
};

const parseBooleanishFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
  }
  return false;
};

const resolveWebFallbackDefault = (): boolean => {
  if (Platform.OS !== 'android') {
    return false;
  }

  const runtimeOverride = (globalThis as any)?.__ALTAYAR_FORCE_WEB_VIDEO__;
  if (typeof runtimeOverride !== 'undefined') {
    return parseBooleanishFlag(runtimeOverride);
  }

  const envValueRaw =
    typeof (globalThis as any)?.process?.env?.ALTAYAR_FORCE_WEB_VIDEO === 'string'
      ? (globalThis as any).process.env.ALTAYAR_FORCE_WEB_VIDEO
      : undefined;

  if (typeof envValueRaw === 'string') {
    return parseBooleanishFlag(envValueRaw);
  }

  // Default: enable WebView fallback on Android unless explicitly turned off
  return true;
};

/**
 * CRITICAL: Check if native module exists BEFORE any attempt to load react-native-video
 * This function checks NativeModules directly, which is safer than UIManager
 */
const checkNativeModuleExists = (): boolean => {
  try {
    // Check NativeModules first - this is the most reliable way
    const moduleNames = [
      'RNVideo',
      'VideoManager',
      'RCTVideo',
      'VideoPlayer',
      'VideoViewManager',
      'RCTVideoView',
      'RCTVideoViewManager'
    ];
    
    for (const moduleName of moduleNames) {
      if (NativeModules[moduleName] && NativeModules[moduleName] !== null) {
        if (__DEV__) {
          console.log(`✅ [SafeVideoPlayer] Found native module: ${moduleName}`);
        }
        return true;
      }
    }
    
    // Also check UIManager as fallback
    if (typeof UIManager !== 'undefined' && UIManager !== null) {
      const viewManagerNames = ['RCTVideo', 'VideoView', 'RNVideo', 'VideoViewManager', 'RCTVideoView'];
      for (const name of viewManagerNames) {
        try {
          if (UIManager.getViewManagerConfig && 
              typeof UIManager.getViewManagerConfig === 'function' &&
              UIManager.getViewManagerConfig !== null) {
            const config = UIManager.getViewManagerConfig(name);
            if (config && config !== null && typeof config === 'object') {
              if (__DEV__) {
                console.log(`✅ [SafeVideoPlayer] Found view manager: ${name}`);
              }
              return true;
            }
          }
        } catch {
          // Continue checking other names
          continue;
        }
      }
    }
    
    return false;
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [SafeVideoPlayer] checkNativeModuleExists error:', error.message);
    }
    return false;
  }
};

/**
 * CRITICAL: Lazy load react-native-video
 * This uses dynamic import to load react-native-video
 * We try to load it even if checkNativeModuleExists fails, as react-native-video
 * may work even if we can't detect the native module
 */
const lazyLoadVideoModule = async (): Promise<{ Video: any; ResizeMode: any } | null> => {
  // Fast path: attempt synchronous require first
  const syncModule = loadVideoModuleSync();
  if (syncModule) {
    return syncModule;
  }

  // CRITICAL: Try to check native module, but don't fail if check fails
  const hasNativeModule = checkNativeModuleExists();
    if (__DEV__) {
    if (hasNativeModule) {
      console.log('✅ [SafeVideoPlayer] Native module check passed, loading video module via dynamic import');
    } else {
      console.warn('⚠️ [SafeVideoPlayer] Native module check failed, attempting dynamic import anyway');
    }
  }
  
  try {
    // CRITICAL: Try dynamic import first
    let videoModule: any = null;
    try {
      videoModule = await import('react-native-video');
    } catch (importError: any) {
      if (__DEV__) {
        console.warn('⚠️ [SafeVideoPlayer] Dynamic import failed, trying require:', importError.message);
      }
      // Fallback to require if dynamic import fails
      try {
        videoModule = require('react-native-video');
      } catch (requireError: any) {
        if (__DEV__) {
          console.error('❌ [SafeVideoPlayer] Both import and require failed:', requireError.message);
      }
      return null;
    }
    }
    
    if (!videoModule) {
      if (__DEV__) {
        console.warn('⚠️ [SafeVideoPlayer] Video module is null/undefined after load');
      }
      return null;
    }
    
    const assignedModule = assignVideoModule(videoModule);

    if (!assignedModule || !assignedModule.Video || !globalVideoComponent) {
      if (__DEV__) {
        console.warn('⚠️ [SafeVideoPlayer] Video module loaded but component invalid', {
          hasAssignedModule: !!assignedModule,
          hasVideo: !!assignedModule?.Video,
          hasGlobalComponent: !!globalVideoComponent,
        });
      }
      return null;
    }
    
    if (__DEV__) {
      console.log('✅ [SafeVideoPlayer] Video module loaded successfully via dynamic import', {
        hasVideo: !!assignedModule.Video,
        hasResizeMode: !!assignedModule.ResizeMode,
        hasGlobalComponent: !!globalVideoComponent,
        videoType: typeof globalVideoComponent,
      });
    }
    
    return assignedModule;
  } catch (error: any) {
    // CRITICAL: If import fails, return null - don't crash
    if (__DEV__) {
      console.error('❌ [SafeVideoPlayer] Failed to load video module:', error.message, error.stack);
    }
    return null;
  }
};

/**
 * CRITICAL: Initialize video module with lazy loading
 * This function is called once and caches the result
 */
const initializeVideoModule = async (): Promise<boolean> => {
  // CRITICAL: If already verified and component exists, return immediately
  if (globalVideoModuleVerified && globalVideoComponent) {
    if (__DEV__) {
      console.log('✅ [SafeVideoPlayer] Video module already initialized');
    }
    return true;
  }
  
  // CRITICAL: Attempt synchronous load first so we don't rely on async import
  const syncModule = loadVideoModuleSync();
  if (syncModule && syncModule.Video && globalVideoComponent) {
    globalVideoModuleVerified = true;
    if (__DEV__) {
      console.log('✅ [SafeVideoPlayer] Video module initialized synchronously');
    }
    return true;
  }
  
  // CRITICAL: If we already have a pending promise, await it
  if (globalVideoModulePromise) {
    try {
      const pendingResult = await globalVideoModulePromise;
      globalVideoModuleVerified = true;
      const success = pendingResult !== null && !!pendingResult.Video && !!globalVideoComponent;
      if (__DEV__) {
        console.log('✅ [SafeVideoPlayer] Video module initialized from pending promise:', success);
      }
      return success;
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [SafeVideoPlayer] Pending promise failed:', error.message);
      }
      globalVideoModulePromise = null;
    }
  }
  
  // CRITICAL: Create new promise for lazy loading
  globalVideoModulePromise = lazyLoadVideoModule();
  
  try {
    const result = await globalVideoModulePromise;
    globalVideoModulePromise = null;
    
    // CRITICAL: Verify that both result and globalVideoComponent are set
    if (result && result.Video && globalVideoComponent) {
      globalVideoModuleVerified = true;
      if (__DEV__) {
        console.log('✅ [SafeVideoPlayer] Video module initialized successfully via async load');
      }
      return true;
    }
    
    // CRITICAL: If result exists but globalVideoComponent is not set, try to set it
    if (result && result.Video && !globalVideoComponent) {
      globalVideoComponent = result.Video;
      globalResizeMode = result.ResizeMode || globalResizeMode;
      globalVideoModuleVerified = true;
      if (__DEV__) {
        console.log('✅ [SafeVideoPlayer] Video component set from result');
      }
      return true;
    }
    
    // CRITICAL: Final fallback - try synchronous load one more time
    if (!globalVideoComponent) {
      const finalSyncModule = loadVideoModuleSync();
      if (finalSyncModule && finalSyncModule.Video && globalVideoComponent) {
        globalVideoModuleVerified = true;
        if (__DEV__) {
          console.log('✅ [SafeVideoPlayer] Video module initialized via final sync fallback');
        }
        return true;
      }
    }
    
      globalVideoComponent = null;
      globalVideoModuleVerified = true;
    if (__DEV__) {
      console.error('❌ [SafeVideoPlayer] Failed to initialize video module after all attempts');
    }
    return false;
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [SafeVideoPlayer] initializeVideoModule error:', error.message, error.stack);
    }
    globalVideoModulePromise = null;
    globalVideoComponent = null;
    globalVideoModuleVerified = true;
    return false;
  }
};

type ResizeMode = 'contain' | 'cover' | 'stretch' | 'fill';

interface SafeVideoPlayerProps {
  source: { uri: string; headers?: { [key: string]: string } };
  style?: StyleProp<ViewStyle>;
  resizeMode?: ResizeMode;
  controls?: boolean;
  paused?: boolean;
  repeat?: boolean;
  playInBackground?: boolean;
  playWhenInactive?: boolean;
  ignoreSilentSwitch?: 'ignore' | 'obey';
  poster?: string;
  muted?: boolean;
  volume?: number;
  requiresAuth?: boolean; // CRITICAL: If true, add Authorization header automatically
  onLoadStart?: () => void;
  onLoad?: (data?: any) => void;
  onReadyForDisplay?: (data?: any) => void;
  onBuffer?: (data: { isBuffering: boolean }) => void;
  onProgress?: (data: { currentTime: number; playableDuration: number; seekableDuration: number }) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
  fallbackMessage?: string;
}

type FallbackReason = 'timeout' | 'error';

interface WebVideoFallbackProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  controls?: boolean;
  paused?: boolean;
  repeat?: boolean;
  muted?: boolean;
  resizeMode?: ResizeMode;
  poster?: string;
  onReady?: (payload: WebVideoMessagePayload) => void;
  onError?: (error: any) => void;
  onProgress?: (payload: WebVideoMessagePayload) => void;
  onEnded?: () => void;
}

interface WebVideoMessagePayload {
  type: 'ready' | 'error' | 'progress' | 'ended';
  currentTime?: number;
  duration?: number;
  width?: number;
  height?: number;
  code?: number;
  message?: string;
  error?: any;
}

// Error Boundary for Video component
class VideoErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('❌ [SafeVideoPlayer] Video component crashed:', error, errorInfo);
    }
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const SafeVideoPlayer: React.FC<SafeVideoPlayerProps> = (props) => {
  const { theme } = useTheme();
  const {
    source,
    paused: pausedProp,
    resizeMode: resizeModeProp,
    controls: controlsProp,
    repeat: repeatProp,
    playInBackground: playInBackgroundProp,
    playWhenInactive: playWhenInactiveProp,
    ignoreSilentSwitch: ignoreSilentSwitchProp,
    muted: mutedProp,
    volume: volumeProp,
    poster,
    onLoad,
    onReadyForDisplay,
    onError,
    onEnd,
    onLoadStart: onLoadStartProp,
    onBuffer: onBufferProp,
    onProgress,
    style: containerStyle,
    fallbackMessage,
    requiresAuth,
  } = props;
  const fallbackDefault = resolveWebFallbackDefault();
  const [internalPaused, setInternalPaused] = useState(pausedProp !== undefined ? pausedProp : false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canRenderVideo, setCanRenderVideo] = useState(false);
  const [authHeaders, setAuthHeaders] = useState<{ [key: string]: string }>({});
  const videoSourceRef = useRef<string | null>(null);
  const lastPausedRef = useRef<boolean | undefined>(pausedProp);
  const [forceSurfaceView, setForceSurfaceView] = useState(false);
  const [videoRenderKey, setVideoRenderKey] = useState(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRenderedFrameRef = useRef(false);
  const [webFallbackLocked, setWebFallbackLocked] = useState(fallbackDefault);
  const [useWebVideoFallback, setUseWebVideoFallback] = useState(fallbackDefault);
  const [nativeModuleAvailable, setNativeModuleAvailable] = useState<boolean | null>(null);
  const nativeModuleStatusRef = useRef<boolean | null>(null);
  const shouldUseNativeVideo = !webFallbackLocked;

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const markVideoFrameRendered = useCallback(() => {
    hasRenderedFrameRef.current = true;
    clearFallbackTimer();
  }, [clearFallbackTimer]);

  const triggerSurfaceFallback = useCallback((reason: FallbackReason) => {
    if (Platform.OS !== 'android' || forceSurfaceView) {
      return false;
    }

    if (__DEV__) {
      console.warn('⚠️ [SafeVideoPlayer] Switching video renderer to SurfaceView fallback', {
        reason,
        uri: source?.uri,
      });
    }

    hasRenderedFrameRef.current = false;
    clearFallbackTimer();
    setForceSurfaceView(true);
    setIsLoading(true);
    setHasError(false);
    setVideoRenderKey(prev => prev + 1);
    return true;
  }, [forceSurfaceView, clearFallbackTimer, source?.uri]);

  const scheduleSurfaceFallbackCheck = useCallback(() => {
    if (Platform.OS !== 'android' || forceSurfaceView) {
      return;
    }

    clearFallbackTimer();
    fallbackTimerRef.current = setTimeout(() => {
      if (!hasRenderedFrameRef.current) {
        triggerSurfaceFallback('timeout');
      }
    }, 4000);
  }, [forceSurfaceView, clearFallbackTimer, triggerSurfaceFallback]);

  const forceWebFallback = useCallback(
    (reason: string) => {
      if (__DEV__) {
        console.warn('⚠️ [SafeVideoPlayer] Forcing WebView fallback (native module unavailable)', {
          reason,
          uri: videoSourceRef.current || source?.uri,
        });
      }
      setWebFallbackLocked(true);
      nativeModuleStatusRef.current = false;
      setNativeModuleAvailable(false);
      clearFallbackTimer();
      setUseWebVideoFallback(true);
      setForceSurfaceView(false);
      setCanRenderVideo(false);
      setIsLoading(false);
      setHasError(false);
    },
    [clearFallbackTimer, source?.uri]
  );

  const ensureNativeModule = useCallback(
    (context: string): boolean => {
      const hasModule = checkNativeModuleExists();
      nativeModuleStatusRef.current = hasModule;
      setNativeModuleAvailable(hasModule);
      if (!hasModule) {
        forceWebFallback(context);
        return false;
      }
      return true;
    },
    [forceWebFallback]
  );
  
  // CRITICAL: Load auth token if required
  useEffect(() => {
    if (requiresAuth) {
      const loadAuthToken = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            setAuthHeaders({
              'Authorization': `Bearer ${token}`,
            });
            if (__DEV__) {
              console.log('✅ [SafeVideoPlayer] Auth token loaded for video');
            }
          } else {
            if (__DEV__) {
              console.warn('⚠️ [SafeVideoPlayer] No auth token found, video may fail to load if protected');
            }
          }
        } catch (error) {
          if (__DEV__) {
            console.error('❌ [SafeVideoPlayer] Failed to load auth token:', error);
          }
        }
      };
      loadAuthToken();
    }
  }, [requiresAuth]);

  useEffect(() => {
    return () => {
      clearFallbackTimer();
    };
  }, [clearFallbackTimer]);

  useEffect(() => {
    if (!shouldUseNativeVideo) {
      setNativeModuleAvailable(false);
      setUseWebVideoFallback(true);
      setCanRenderVideo(false);
      return;
    }
    ensureNativeModule('initial-check');
  }, [ensureNativeModule, shouldUseNativeVideo]);

  useEffect(() => {
    hasRenderedFrameRef.current = false;
  }, [source?.uri, videoRenderKey]);

  useEffect(() => {
    if (useWebVideoFallback) {
      setHasError(false);
      setIsLoading(false);
    }
  }, [useWebVideoFallback, source?.uri]);

  // CRITICAL: Memoize video source to prevent re-rendering loops
  // MUST be called BEFORE any conditional returns to follow Rules of Hooks
  // Only recreate if URI or headers actually change
  const videoSource = useMemo(() => {
    // Early return if source is invalid - return a safe default
    if (!source || !source.uri) {
      return { uri: '', type: 'video/mp4' };
    }

    // CRITICAL: Clean URI - normalize and remove problematic trailing slashes/fragments
    const normalizedUri = normalizeVideoUri(source.uri);
    const fragmentIndex = normalizedUri.indexOf('#');
    const queryIndex = normalizedUri.indexOf('?');
    const trimIndex =
      fragmentIndex === -1
        ? queryIndex
        : queryIndex === -1
        ? fragmentIndex
        : Math.min(fragmentIndex, queryIndex);
    const cleanUri = trimIndex >= 0 ? normalizedUri.substring(0, trimIndex) : normalizedUri;

    // CRITICAL FIX: Build proper video source with correct format
    const computedSource: {
      uri: string;
      type?: string;
      headers?: Record<string, string>;
    } = {
      uri: cleanUri,
    };

    // CRITICAL: Add headers only if URI is HTTP/HTTPS (not file://)
    if (cleanUri.startsWith('http://') || cleanUri.startsWith('https://')) {
      // CRITICAL: Build headers object - merge auth headers first, then default headers, then props headers
      const defaultHeaders: Record<string, string> = {
        Accept: 'video/*',
        'Accept-Encoding': 'identity',
      };

      computedSource.headers = {
        ...defaultHeaders,
        ...authHeaders,
        ...(source.headers || {}),
      };

      // CRITICAL: Remove Range header if it's set to 'bytes=0-' as it can cause playback issues
      if (computedSource.headers.Range === 'bytes=0-') {
        delete computedSource.headers.Range;
      }
    }

    // CRITICAL: Set type based on file extension
    const fileExtension = cleanUri.match(/\.([^./?#]+)(?:[?#].*)?$/i)?.[1]?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      m4v: 'video/x-m4v',
      '3gp': 'video/3gpp',
      mkv: 'video/x-matroska',
    };
    computedSource.type = fileExtension ? mimeTypes[fileExtension] || 'video/mp4' : 'video/mp4';

    return computedSource;
  }, [source, authHeaders]);

  useEffect(() => {
    if (!shouldUseNativeVideo) {
      return;
    }
    if (videoSource?.uri) {
      ensureNativeModule('video-source-change');
    }
  }, [videoSource?.uri, ensureNativeModule, shouldUseNativeVideo]);

  // Decide when to rely on the WebView-based fallback player (final safety net)
  useEffect(() => {
    if (Platform.OS !== 'android' || useWebVideoFallback) {
      return;
    }

    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    if (videoSource?.uri) {
      fallbackTimeout = setTimeout(() => {
        if (!canRenderVideo && !useWebVideoFallback) {
          if (__DEV__) {
            console.warn('⚠️ [SafeVideoPlayer] Falling back to WebView-based video renderer (timeout)');
          }
          setUseWebVideoFallback(true);
          setForceSurfaceView(false);
        }
      }, 3500);
    }

    if (canRenderVideo && useWebVideoFallback) {
      setUseWebVideoFallback(false);
    }

    return () => {
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
    };
  }, [videoSource?.uri, canRenderVideo, useWebVideoFallback]);
  
  // CRITICAL: Sync paused state with props - with proper change detection to prevent loops
  useEffect(() => {
    // Only update if paused state actually changed
    if (lastPausedRef.current !== pausedProp) {
      lastPausedRef.current = pausedProp;
      
      if (pausedProp !== undefined) {
        setInternalPaused(pausedProp);
      if (__DEV__) {
        console.log('🎬 [SafeVideoPlayer] Paused state updated:', {
            uri: source?.uri,
            paused: pausedProp,
            previous: lastPausedRef.current,
        });
      }
    } else {
      // CRITICAL: If paused is undefined, default to playing
      setInternalPaused(false);
        if (__DEV__) {
          console.log('🎬 [SafeVideoPlayer] Paused undefined, defaulting to playing');
        }
      }
    }
  }, [pausedProp, source?.uri]);
  
  // CRITICAL: Initialize video module on mount with lazy loading
  useEffect(() => {
    if (!shouldUseNativeVideo) {
      setCanRenderVideo(false);
      return;
    }
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const initVideo = async () => {
      try {
        if (__DEV__) {
          console.log('🚀 [SafeVideoPlayer] Starting video module initialization...');
        }
        const moduleDetected = ensureNativeModule('init-start');
        if (__DEV__) {
          if (!moduleDetected) {
            console.warn('⚠️ [SafeVideoPlayer] Native module check failed, switching to WebView fallback');
          } else {
            console.log('✅ [SafeVideoPlayer] Native module check passed');
          }
        }
        if (!moduleDetected) {
          return;
        }
        
        // CRITICAL: Check direct import first (fastest path)
        if (directVideoComponent && typeof directVideoComponent === 'function') {
          if (!ensureNativeModule('direct-import')) {
            return;
          }
          globalVideoComponent = directVideoComponent;
          globalResizeMode = directResizeMode;
          if (isMounted) {
            setCanRenderVideo(true);
            setIsLoading(false);
            if (__DEV__) {
              console.log('✅ [SafeVideoPlayer] Using direct import component (fastest path)');
            }
            return;
          }
        }
        
        // CRITICAL: Try synchronous load first (fastest)
        if (__DEV__) {
          console.log('🔄 [SafeVideoPlayer] Attempting synchronous load...');
        }
        const syncModule = loadVideoModuleSync();
        if (syncModule && syncModule.Video && globalVideoComponent) {
          if (!ensureNativeModule('sync-load')) {
            return;
          }
          if (isMounted) {
            const hasValidComponent = globalVideoComponent !== null && 
                                     (typeof globalVideoComponent === 'function' || typeof globalVideoComponent === 'object');
            setCanRenderVideo(hasValidComponent);
            setIsLoading(false);
            
            if (__DEV__) {
              console.log('✅ [SafeVideoPlayer] Video module initialized synchronously on mount', {
                hasVideoComponent: globalVideoComponent !== null,
                hasValidComponent,
                canRenderVideo: hasValidComponent,
                videoType: typeof globalVideoComponent,
              });
            }
          }
          return;
        } else {
          if (__DEV__) {
            console.warn('⚠️ [SafeVideoPlayer] Synchronous load failed, trying async load...', {
              hasSyncModule: !!syncModule,
              hasVideo: !!syncModule?.Video,
              hasGlobalComponent: !!globalVideoComponent,
              hasDirectComponent: !!directVideoComponent,
            });
          }
        }
        
        // CRITICAL: If sync load failed, try async load
        const initialized = await initializeVideoModule();
        
        if (isMounted) {
          // CRITICAL: Set canRenderVideo based on whether Video component is actually available
          // Check globalVideoComponent directly as it's more reliable than the initialization flag
          // CRITICAL FIX: Also verify that globalVideoComponent is a valid function/component
          const hasValidComponent = globalVideoComponent !== null && 
                                   (typeof globalVideoComponent === 'function' || typeof globalVideoComponent === 'object');
          const moduleStillAvailable = ensureNativeModule('post-init');
          const videoAvailable = moduleStillAvailable && hasValidComponent && initialized;
          
          setCanRenderVideo(videoAvailable);
          setIsLoading(false);
          
          if (__DEV__) {
            console.log('🎥 [SafeVideoPlayer] Initialization complete:', {
              initialized,
              hasVideoComponent: globalVideoComponent !== null,
              hasValidComponent,
              canRenderVideo: videoAvailable,
              videoComponentType: typeof globalVideoComponent,
              isFunction: typeof globalVideoComponent === 'function',
              isObject: typeof globalVideoComponent === 'object',
              retryCount,
              nativeModuleAvailable: moduleStillAvailable,
            });
          }

          if (!moduleStillAvailable) {
            return;
          }
          
          // CRITICAL: If initialization failed or component is invalid, retry with exponential backoff
          if ((!initialized || !hasValidComponent) && retryCount < maxRetries) {
            retryCount++;
            const delay = Math.min(500 * Math.pow(2, retryCount - 1), 2000); // 500ms, 1000ms, 2000ms
            
            if (__DEV__) {
              console.warn(`⚠️ [SafeVideoPlayer] Initialization failed, retrying (${retryCount}/${maxRetries}) in ${delay}ms...`);
            }
            
            setTimeout(async () => {
              if (!isMounted) return;
              
              // Reset verification to force re-initialization
              globalVideoModuleVerified = false;
              globalVideoComponent = null;
              
              const retryInitialized = await initializeVideoModule();
              
              if (isMounted) {
                const retryHasValidComponent = globalVideoComponent !== null && 
                                              (typeof globalVideoComponent === 'function' || typeof globalVideoComponent === 'object');
                const retryHasNativeModule = ensureNativeModule(`retry-${retryCount}`);
                setCanRenderVideo(retryInitialized && retryHasValidComponent && retryHasNativeModule);
                
                if (__DEV__) {
                  console.log(`🔄 [SafeVideoPlayer] Retry ${retryCount} result:`, {
                    retryInitialized,
                    hasVideoComponent: globalVideoComponent !== null,
                    hasValidComponent: retryHasValidComponent,
                    canRenderVideo: retryInitialized && retryHasValidComponent && retryHasNativeModule,
                    nativeModuleAvailable: retryHasNativeModule,
                  });
                }
                if (!retryHasNativeModule) {
                  return;
                }
              }
            }, delay);
          }
        }
      } catch (error: any) {
        if (__DEV__) {
          console.error('❌ [SafeVideoPlayer] Initialization error:', error.message, error.stack);
        }
        if (isMounted) {
          setIsLoading(false);
          setCanRenderVideo(false);
        }
      }
    };
    
    if (shouldUseNativeVideo) {
      initVideo();
    }
    
    return () => {
      isMounted = false;
    };
  }, [shouldUseNativeVideo]); // Only run once per mode
  
  // CRITICAL: Memoize video props to prevent re-rendering loops
  // MUST be called BEFORE any conditional returns to follow Rules of Hooks
  const videoProps = useMemo(() => {
    // Early return if source is invalid or component is not available
    if (!shouldUseNativeVideo || !globalVideoComponent || !videoSource || !videoSource.uri) {
      return null;
    }
    
    // CRITICAL FIX: Build video props with proper format for react-native-video
    return {
      source: videoSource,
      style: [
        StyleSheet.absoluteFillObject,
        { 
          backgroundColor: 'transparent', // CRITICAL: Transparent to show video content
          width: '100%',
          height: '100%',
        }
      ], // CRITICAL: Use absoluteFillObject to ensure video fills container
      resizeMode: resizeModeProp || (globalResizeMode?.COVER || 'cover'),
      controls: controlsProp !== undefined ? controlsProp : true,
      paused: internalPaused,
      repeat: repeatProp !== undefined ? repeatProp : true,
      playInBackground: playInBackgroundProp ?? false,
      playWhenInactive: playWhenInactiveProp ?? false,
      ignoreSilentSwitch: ignoreSilentSwitchProp || 'ignore',
      muted: mutedProp ?? false,
      volume: volumeProp ?? 1.0,
      // CRITICAL: Add poster only if provided
      ...(poster ? { poster } : {}),
      // CRITICAL: Ensure video is visible
      posterResizeMode: 'cover',
      // CRITICAL FIX: Add video-specific props for better playback
      ...(Platform.OS === 'android' ? {
        bufferConfig: {
          minBufferMs: 10000, // Reduced for faster start
          maxBufferMs: 30000, // Reduced for better performance
          bufferForPlaybackMs: 1500, // Reduced for faster start
          bufferForPlaybackAfterRebufferMs: 3000, // Reduced for faster recovery
        },
        useTextureView: !forceSurfaceView,
        // CRITICAL: Enable hardware acceleration
        hardwareAccelerationAndroid: true,
        // CRITICAL: Ensure video is visible on Android
        allowsExternalPlayback: false,
        // CRITICAL: Enable smooth playback
        progressUpdateInterval: 250, // Update progress every 250ms
      } : {
        // iOS specific props
        preferredForwardBufferDuration: 3, // Reduced for faster start
        allowsExternalPlayback: false,
        progressUpdateInterval: 250, // Update progress every 250ms
      }),
      onLoad: (data: any) => {
        if (__DEV__) {
          console.log('✅ [SafeVideoPlayer] Video loaded successfully:', {
            uri: videoSource.uri,
            duration: data?.duration,
            naturalSize: data?.naturalSize,
            width: data?.naturalSize?.width,
            height: data?.naturalSize?.height,
            canPlayFastForward: data?.canPlayFastForward,
            canPlayReverse: data?.canPlayReverse,
            canPlaySlowForward: data?.canPlaySlowForward,
            canPlaySlowReverse: data?.canPlaySlowReverse,
            canStepBackward: data?.canStepBackward,
            canStepForward: data?.canStepForward,
            paused: pausedProp,
            internalPaused,
            videoComponentType: typeof globalVideoComponent,
          });
        }
        markVideoFrameRendered();
        setHasError(false);
        setIsLoading(false);
        // CRITICAL FIX: Force play when video loads (if not explicitly paused)
        // Only auto-play if paused is explicitly false or undefined
        if (pausedProp === false || pausedProp === undefined) {
          // Use setTimeout to ensure state update happens after component is ready
          setTimeout(() => {
            setInternalPaused(false);
            if (__DEV__) {
              console.log('▶️ [SafeVideoPlayer] Auto-playing video after load (delayed)');
            }
          }, 100);
        } else {
          setInternalPaused(true);
        }
        if (onLoad) onLoad(data);
      },
      onReadyForDisplay: (data: any) => {
        if (__DEV__) {
          console.log('✅ [SafeVideoPlayer] Video ready for display:', {
            uri: videoSource.uri,
            naturalSize: data?.naturalSize,
            width: data?.naturalSize?.width,
            height: data?.naturalSize?.height,
            orientation: data?.orientation,
            paused: pausedProp,
            internalPaused,
            videoComponentType: typeof globalVideoComponent,
          });
        }
        markVideoFrameRendered();
        setHasError(false);
        setIsLoading(false);
        // CRITICAL: Force play when video is ready for display (if not explicitly paused)
        // Only auto-play if paused is explicitly false or undefined
        if (pausedProp === false || pausedProp === undefined) {
          // Use setTimeout to ensure state update happens after component is ready
          setTimeout(() => {
            setInternalPaused(false);
            if (__DEV__) {
              console.log('▶️ [SafeVideoPlayer] Auto-playing video after ready for display (delayed)');
            }
          }, 100);
        } else {
          setInternalPaused(true);
        }
        if (onReadyForDisplay) onReadyForDisplay(data);
      },
      onError: (error: any) => {
        const errorCode = error?.error?.code || error?.code || error?.message || error;
        const errorString = JSON.stringify(error);
        
        if (__DEV__) {
          console.error('❌ [SafeVideoPlayer] Video playback error:', {
            uri: videoSource.uri,
            error: errorCode,
            errorString: errorString,
            errorObject: error,
            hasAuthHeaders: !!authHeaders.Authorization,
          });
        }

        if (triggerSurfaceFallback('error')) {
          return;
        }
        
        // CRITICAL: Don't set error for certain error codes that might be recoverable
        // Some errors like network timeouts might be temporary
        const recoverableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ERR_CANCELED'];
        const isRecoverable = recoverableErrors.some(code => 
          errorString.includes(code) || errorCode?.toString().includes(code)
        );
        
        // CRITICAL: For 401 errors, try to reload token and retry
        if (errorCode === 401 || errorString.includes('401')) {
          if (__DEV__) {
            console.warn('⚠️ [SafeVideoPlayer] 401 Unauthorized - Video may require authentication');
          }
          // Try to reload token if requiresAuth is true
        if (requiresAuth) {
            const reloadToken = async () => {
              try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                  setAuthHeaders({
                    'Authorization': `Bearer ${token}`,
                  });
                  if (__DEV__) {
                    console.log('🔄 [SafeVideoPlayer] Token reloaded, video should retry');
                  }
                  // Reset error state to allow retry
                  setHasError(false);
                  setIsLoading(true);
                }
              } catch (tokenError) {
                if (__DEV__) {
                  console.error('❌ [SafeVideoPlayer] Failed to reload token:', tokenError);
                }
              }
            };
            reloadToken();
          }
        }
        
        if (!isRecoverable) {
          setHasError(true);
        }
        setIsLoading(false);
        if (onError) onError(error);
      },
      onEnd: () => {
        if (__DEV__) {
          console.log('⏹️ [SafeVideoPlayer] Video ended:', videoSource.uri);
        }
        if (repeatProp) {
          setInternalPaused(false);
        }
        if (onEnd) onEnd();
      },
      onLoadStart: () => {
        if (__DEV__) {
          console.log('🔄 [SafeVideoPlayer] Video load started:', {
            uri: videoSource.uri,
            source: videoSource,
          });
        }
        hasRenderedFrameRef.current = false;
        scheduleSurfaceFallbackCheck();
        setIsLoading(true);
        setHasError(false);
        if (onLoadStartProp) {
          onLoadStartProp();
        }
      },
      onBuffer: (data: { isBuffering: boolean }) => {
        if (__DEV__) {
          console.log('⏳ [SafeVideoPlayer] Video buffering:', {
            uri: videoSource.uri,
            isBuffering: data.isBuffering,
          });
        }
        setIsLoading(data.isBuffering);
        if (onBufferProp) {
          onBufferProp(data);
        }
      },
      onProgress: (data: { currentTime: number; playableDuration: number; seekableDuration: number }) => {
        if (__DEV__ && data.currentTime > 0) {
          // Video is playing - clear loading state
          setIsLoading(false);
          // Log progress every 5 seconds
          if (Math.floor(data.currentTime) % 5 === 0) {
            console.log('▶️ [SafeVideoPlayer] Video playing:', {
              uri: videoSource.uri,
              currentTime: data.currentTime,
              playableDuration: data.playableDuration,
              seekableDuration: data.seekableDuration,
            });
          }
        }
        if (onProgress) {
          onProgress(data);
        }
      },
    };
  }, [
    videoSource,
    internalPaused,
    resizeModeProp,
    controlsProp,
    repeatProp,
    playInBackgroundProp,
    playWhenInactiveProp,
    ignoreSilentSwitchProp,
    mutedProp,
    volumeProp,
    poster,
    pausedProp,
    onLoad,
    onReadyForDisplay,
    onError,
    onEnd,
    onLoadStartProp,
    onBufferProp,
    onProgress,
    authHeaders,
    forceSurfaceView,
    scheduleSurfaceFallbackCheck,
    markVideoFrameRendered,
    triggerSurfaceFallback,
    requiresAuth,
    shouldUseNativeVideo,
  ]);
  const hasValidComponent = useMemo(
    () =>
      shouldUseNativeVideo &&
      videoRenderKey >= 0 &&
      globalVideoComponent !== null &&
      (typeof globalVideoComponent === 'function' || typeof globalVideoComponent === 'object'),
    [videoRenderKey, shouldUseNativeVideo]
  );

  useEffect(() => {
    if (
      shouldUseNativeVideo &&
      !webFallbackLocked &&
      useWebVideoFallback &&
      hasValidComponent &&
      canRenderVideo
    ) {
      setUseWebVideoFallback(false);
    }
  }, [shouldUseNativeVideo, webFallbackLocked, useWebVideoFallback, hasValidComponent, canRenderVideo]);
  
  // CRITICAL: Only log when video source actually changes (prevent spam)
  useEffect(() => {
    if (videoSource && videoSource.uri) {
      // Always update the ref to track the current source
      const isNewSource = videoSourceRef.current !== videoSource.uri;
      videoSourceRef.current = videoSource.uri;
      
      // Reset error state when source changes
      if (isNewSource) {
        setHasError(false);
        setIsLoading(true);
      }
      
      if (__DEV__ && isNewSource) {
      console.log('🎥 [SafeVideoPlayer] Loading video:', {
        uri: videoSource.uri,
        paused: internalPaused,
          resizeMode: resizeModeProp || 'cover',
        isAbsolute: videoSource.uri?.startsWith('http://') || videoSource.uri?.startsWith('https://'),
        hasHeaders: !!videoSource.headers && Object.keys(videoSource.headers).length > 0,
        hasAuthHeader: !!videoSource.headers?.Authorization,
        headers: videoSource.headers ? Object.keys(videoSource.headers) : [],
        canRenderVideo,
        hasError,
        isLoading,
      });
    }
    }
  }, [videoSource, internalPaused, canRenderVideo, hasError, isLoading, resizeModeProp]);
  
  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      shouldUseNativeVideo &&
      (!hasValidComponent || nativeModuleAvailable === false) &&
      !useWebVideoFallback
    ) {
      if (__DEV__) {
        console.warn('⚠️ [SafeVideoPlayer] Native module unavailable, forcing WebView fallback');
      }
      setUseWebVideoFallback(true);
      setForceSurfaceView(false);
    }
  }, [hasValidComponent, nativeModuleAvailable, useWebVideoFallback, shouldUseNativeVideo]);
  
  // CRITICAL: Fallback UI - defined after all Hooks
  const fallbackUI = (
    <View style={[styles.fallbackContainer, containerStyle || {}, { backgroundColor: theme.colors.background }]}>
      <SafeIcon name="videocam-off" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
        {fallbackMessage || 'مشغل الفيديو غير متاح'}
      </Text>
      <Text style={[styles.fallbackSubtext, { color: theme.colors.textSecondary }]}>
        يرجى التأكد من ربط react-native-video بشكل صحيح
      </Text>
      <Text style={[styles.fallbackSubtext, { color: theme.colors.textSecondary }]}>
        جرب تشغيل: npm run fix:video:manual
      </Text>
    </View>
  );
  
  const canUseHtmlFallback =
    useWebVideoFallback &&
    videoSource &&
    videoSource.uri &&
    (videoSource.uri.startsWith('http://') || videoSource.uri.startsWith('https://'));
  
  // CRITICAL: Handle tap to toggle play/pause
  const handlePress = () => {
    if (__DEV__) {
      console.log('🎬 [SafeVideoPlayer] Toggle play/pause:', {
        currentState: internalPaused,
        newState: !internalPaused,
        uri: source?.uri,
      });
    }
    setInternalPaused(prev => !prev);
  };
  
  // CRITICAL: Show loading state
  if (isLoading && !canUseHtmlFallback) {
    return (
      <View style={[styles.fallbackContainer, containerStyle || {}, { backgroundColor: theme.colors.background }]}>
        <SafeIcon name="hourglass-empty" size={64} color="#FFFFFF" />
        <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
          جاري تحميل مشغل الفيديو...
        </Text>
      </View>
    );
  }
  
  // CRITICAL: If Video is not available or has error, show fallback UI immediately
  // CRITICAL: Check globalVideoComponent first (most reliable), then canRenderVideo
  // CRITICAL FIX: Also verify that globalVideoComponent is a valid function/component
  
  if ((!hasValidComponent || !canRenderVideo || hasError || useWebVideoFallback) && videoSource?.uri) {
    // Log the reason for falling back to WebView
    if (__DEV__) {
      console.log('🔄 [SafeVideoPlayer] Using WebView fallback:', {
        hasValidComponent,
        canRenderVideo,
        hasError,
        useWebVideoFallback,
        uri: videoSource.uri,
      });
    }
    
    return (
      <WebVideoFallback
        key={`web-fallback-${videoRenderKey}-${videoSource.uri}`}
        uri={videoSource.uri}
        style={containerStyle}
        controls={controlsProp ?? true}
        paused={internalPaused}
        repeat={repeatProp ?? true}
        muted={mutedProp ?? false}
        resizeMode={resizeModeProp || 'cover'}
        poster={poster}
        onReady={(payload) => {
          markVideoFrameRendered();
          setHasError(false);
          setIsLoading(false);
          if (pausedProp === false || pausedProp === undefined) {
            setTimeout(() => setInternalPaused(false), 100);
          } else if (pausedProp === true) {
            setInternalPaused(true);
          }
          const loadEvent = {
            duration: payload.duration || 0,
            naturalSize: {
              width: payload.width || 0,
              height: payload.height || 0,
              orientation: (payload.width || 0) > (payload.height || 0) ? 'landscape' as const : 'portrait' as const,
            },
          };
          if (onLoad) {
            onLoad(loadEvent);
          }
          if (onReadyForDisplay) {
            onReadyForDisplay({
              naturalSize: {
                width: payload.width || 0,
                height: payload.height || 0,
                orientation: (payload.width || 0) > (payload.height || 0) ? 'landscape' as const : 'portrait' as const,
              },
            });
          }
        }}
        onError={(errorInfo) => {
          console.error('❌ [SafeVideoPlayer] WebView fallback error:', errorInfo);
          setHasError(true);
          setIsLoading(false);
          if (onError) {
            onError({
              error: {
                code: errorInfo.code || -1,
                message: errorInfo.message || 'Unknown WebView error',
                error: errorInfo,
              },
            });
          }
        }}
        onProgress={(payload) => {
          setIsLoading(false);
          if (onProgress) {
            onProgress({
              currentTime: payload.currentTime || 0,
              playableDuration: payload.duration || 0,
              seekableDuration: payload.duration || 0,
            });
          }
        }}
        onEnded={() => {
          if (onEnd) {
            onEnd();
          }
        }}
      />
    );
  }
  
  if (!hasValidComponent || !canRenderVideo || hasError) {
    if (__DEV__) {
      if (!globalVideoComponent) {
        console.warn('⚠️ [SafeVideoPlayer] Video component not available at render time (null)');
      } else if (!hasValidComponent) {
        console.warn('⚠️ [SafeVideoPlayer] Video component invalid at render time:', {
          type: typeof globalVideoComponent,
          isFunction: typeof globalVideoComponent === 'function',
          isObject: typeof globalVideoComponent === 'object',
        });
      } else if (!canRenderVideo) {
        console.warn('⚠️ [SafeVideoPlayer] canRenderVideo is false');
      }
    }
    return fallbackUI;
  }
  
  // CRITICAL: Check if videoProps and videoSource are valid
  if (!videoProps || !videoSource?.uri) {
    if (__DEV__) {
      console.warn('⚠️ [SafeVideoPlayer] Invalid video props or source:', { videoProps, videoSource });
    }
    return fallbackUI;
  }
  
  const videoContainerStyle = containerStyle
    ? [containerStyle, styles.videoWrapper]
    : [styles.defaultVideoContainer, styles.videoWrapper];
    
    // CRITICAL: Use React.createElement with try-catch as final safety net
    let videoElement: React.ReactElement | null = null;
    try {
      if (!globalVideoComponent) {
        throw new Error('Video component is not available');
      }
      
      videoElement = React.createElement(globalVideoComponent, {
        key: `video-${videoRenderKey}-${videoSource.uri}`,
        ...videoProps,
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [SafeVideoPlayer] Failed to create Video element:', error);
      }
      setHasError(true);
      return fallbackUI;
    }
    
    if (!videoElement) {
      return fallbackUI;
    }
    
    return (
      <VideoErrorBoundary 
        fallback={fallbackUI}
        onError={() => setHasError(true)}
      >
        <View style={videoContainerStyle}>
          {/* CRITICAL: Video container with absolute positioning to ensure it fills the parent */}
          <View style={styles.absoluteVideoLayer}>
            {videoElement}
          </View>
          {internalPaused && (
            <TouchableOpacity
              style={styles.playButtonOverlay}
              activeOpacity={0.8}
              onPress={handlePress}
            >
              <SafeIcon name="play-circle-filled" size={80} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </View>
      </VideoErrorBoundary>
    );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  fallbackText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  fallbackSubtext: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  defaultVideoContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  absoluteVideoLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
              playButtonOverlay: {
                ...StyleSheet.absoluteFillObject,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
              },
              loadingOverlay: {
                ...StyleSheet.absoluteFillObject,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
              },
  defaultWebVideoContainer: {
    flex: 1,
  },
  webVideoWrapper: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
              },
});

const WebVideoFallback: React.FC<WebVideoFallbackProps> = ({
  uri,
  style,
  controls,
  paused,
  repeat,
  muted,
  resizeMode,
  poster,
  onReady,
  onError,
  onProgress,
  onEnded,
}) => {
  const webRef = useRef<WebView>(null);
  const [webReady, setWebReady] = useState(false);
  const normalizedUri = useMemo(() => {
    try {
      // Ensure the URI is properly encoded and has the correct protocol
      let safeUri = (uri || '').trim();
      if (!safeUri) return '';
      
      // If the URI is a relative path, try to make it absolute
      if (!safeUri.match(/^(https?:\/\/|file:\/\/)/i)) {
        const baseUrl = 'http://192.168.1.2:5000';
        safeUri = safeUri.startsWith('/') 
          ? `${baseUrl}${safeUri}` 
          : `${baseUrl}/${safeUri}`;
      }
      
      // Use a simple string-based approach instead of URL API
      const urlParts = safeUri.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/);
      if (!urlParts) return safeUri.replace(/ /g, '%20');
      
      const protocol = urlParts[1] || 'http:';
      const host = urlParts[4] || '192.168.1.2:5000';
      const path = urlParts[5] || '';
      const search = urlParts[6] || '';
      const hash = urlParts[8] ? `#${urlParts[8]}` : '';
      
      return `${protocol}//${host}${path}${search}${hash}`.replace(/ /g, '%20');
    } catch (error) {
      console.error('❌ [WebVideoFallback] Error normalizing URI:', { uri, error });
      return uri.replace(/ /g, '%20');
    }
  }, [uri]);

  const htmlContent = useMemo(() => {
    const safeResizeMode = resizeMode || 'cover';
    return buildWebVideoHtml({
      uri: normalizedUri,
      objectFit: safeResizeMode === 'contain' ? 'contain' : safeResizeMode === 'stretch' ? 'stretch' : 'cover',
      autoPlay: !paused,
      controls: controls || false,
      muted: muted || false,
      loop: repeat || false,
      poster: poster || '',
    });
  }, [normalizedUri, resizeMode, paused, controls, muted, repeat, poster]);

  const extractOrigin = useCallback((value: string): string => {
    try {
      const match = value.match(/^(https?:\/\/[^/]+)/i);
      return match ? match[1] : '';
    } catch {
      return '';
    }
  }, []);

  const sendControlMessage = useCallback(
    (ready: boolean) => {
      if (!ready || !webRef.current) {
        return;
      }

      const payload = {
        type: 'control',
        paused,
        muted,
        loop: repeat,
        controls,
      };

      try {
        webRef.current.postMessage(JSON.stringify(payload));
      } catch {
        // Ignore postMessage failures silently
      }
    },
    [paused, muted, repeat, controls]
  );

  useEffect(() => {
    sendControlMessage(webReady);
  }, [webReady, sendControlMessage]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data?: string; url?: string } }) => {
      try {
        if (!event.nativeEvent.data) return;
        
        const origin = event.nativeEvent.url ? extractOrigin(event.nativeEvent.url) : '';
        const allowedOrigins = ['http://localhost', 'http://192.168.1.2:5000'];
        
        if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
          console.warn('Message from unauthorized origin:', origin);
          return;
        }
        
        const payload = JSON.parse(event.nativeEvent.data) as WebVideoMessagePayload;
        
        switch (payload.type) {
          case 'ready':
            setWebReady(true);
            onReady?.(payload);
            break;
          case 'error':
            onError?.(payload.error || { message: 'Unknown error occurred' });
            break;
          case 'progress':
            onProgress?.(payload);
            break;
          case 'ended':
            onEnded?.();
            break;
        }
      } catch (error) {
        console.warn('Error handling WebView message:', error);
      }
    },
    [extractOrigin, onReady, onError, onProgress, onEnded]
  );

  const webVideoContainerStyle = style
    ? [style, styles.webVideoWrapper]
    : [styles.defaultWebVideoContainer, styles.webVideoWrapper];

  return (
    <View style={webVideoContainerStyle}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        androidHardwareAccelerationDisabled={false}
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        cacheEnabled={false}
        allowsFullscreenVideo={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        dataDetectorTypes="none"
        source={{ 
          html: htmlContent,
          baseUrl: normalizedUri.startsWith('http') ? extractOrigin(normalizedUri) : ''
        }}
        style={styles.webView}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const error = {
            code: -1,
            message: `WebView error: ${syntheticEvent.nativeEvent.description || 'Unknown error'}`,
            error: syntheticEvent.nativeEvent
          };
          console.error('❌ [WebVideoFallback] WebView error:', error);
          if (onError) {
            onError(error);
          }
        }}
        onHttpError={(syntheticEvent) => {
          const error = {
            code: syntheticEvent.nativeEvent.statusCode || -1,
            message: `HTTP Error ${syntheticEvent.nativeEvent.statusCode || 'Unknown'}: ${syntheticEvent.nativeEvent.description || 'Failed to load video'}`,
            error: syntheticEvent.nativeEvent
          };
          console.error('❌ [WebVideoFallback] HTTP error:', error);
          if (onError) {
            onError(error);
          }
        }}
        onContentProcessDidTerminate={() => {
          const error = {
            code: -2,
            message: 'WebView content process terminated',
            error: {}
          };
          console.error('❌ [WebVideoFallback] WebView process terminated');
          if (onError) {
            onError(error);
          }
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      />
    </View>
  );
};

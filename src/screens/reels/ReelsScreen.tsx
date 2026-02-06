import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { useAuthStore } from './../../stores/authStore';
import { API } from './../../services/apiClient';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { SafeIcon } from './../../utils/iconHelper';
import Toast from 'react-native-toast-message';
import { buildImageUrl } from './../../utils/imageUrlBuilder';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeVideoPlayer } from './../../components/common/SafeVideoPlayer';
import { ReelsViewportPlayer } from './../../components/reels/ReelsViewportPlayer';
import type { ProfileScreenProps } from './../../types/navigation';

// CRITICAL: Video handling is now done through SafeVideoPlayer component
// This component handles all native module checks and error handling internally

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Reel {
  id: number;
  title: string;
  content: string;
  mediaUrl?: string | null;
  mediaUrls?: string[]; // CRITICAL: Array for multiple images
  media_urls?: string[]; // Alternative field name
  mediaType?: 'image' | 'video';
  isReel?: boolean;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  savedCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  viewsCount?: number;
  destination?: string;
  tags?: string[] | string;
  author?: {
    id: number;
    name: string;
  };
  created_at: string;
}

// CRITICAL: VideoErrorBoundary is now handled by SafeVideoPlayer component

type ReelsScreenNavigation = ProfileScreenProps<'Reels'>['navigation'];

export const ReelsScreen: React.FC = () => {
  const navigation = useNavigation<ReelsScreenNavigation>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const canCreateReel =
    !!user &&
    (user.role === 'super_admin' || user.role === 'admin' || user.role === 'data_entry');
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [playingVideos, setPlayingVideos] = useState<{ [key: number]: boolean }>({});
  const [mutedVideos, setMutedVideos] = useState<{ [key: number]: boolean }>({});
  const [videoDurations, setVideoDurations] = useState<{ [key: number]: number }>({});
  const [videoProgress, setVideoProgress] = useState<{ [key: number]: number }>({});
  const [showInteractionHint, setShowInteractionHint] = useState(true);
  const currentReelIdRef = useRef<number | null>(null);
  const viewedReelsRef = useRef<Set<number>>(new Set());
  const recordReelView = useCallback(
    async (reelId: number) => {
      try {
        const response = await API.blog.getBlogById(reelId.toString());
        const payload = response.data || response;
        const normalizedBlog = payload.blog ?? payload;
        if (normalizedBlog?.viewsCount !== undefined) {
          setReels(prev =>
            prev.map(reel =>
              reel.id === reelId ? { ...reel, viewsCount: normalizedBlog.viewsCount } : reel
            ),
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('⚠️ [ReelsScreen] Failed to record view:', (error as Error).message);
        }
      }
    },
    [],
  );


  useEffect(() => {
    if (!hasLoadedOnce) {
      loadReels();
      setHasLoadedOnce(true);
    }
  }, []);
  useEffect(() => {
    if (reels.length === 0) {
      return;
    }
    if (currentIndex < 0 || currentIndex >= reels.length) {
      return;
    }
    const activeReel = reels[currentIndex];
    if (!activeReel || viewedReelsRef.current.has(activeReel.id)) {
      return;
    }
    viewedReelsRef.current.add(activeReel.id);
    recordReelView(activeReel.id);
  }, [currentIndex, reels, recordReelView]);


  useEffect(() => {
    if (!showInteractionHint) {
      return;
    }
    const timer = setTimeout(() => setShowInteractionHint(false), 7000);
    return () => clearTimeout(timer);
  }, [showInteractionHint]);

  // Reload reels when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce) {
        loadReels();
      }
    }, [hasLoadedOnce])
  );

  const loadReels = async () => {
    try {
      if (!refreshing) {
        setIsLoading(true);
      }
      if (__DEV__) {
        console.log('🔄 [ReelsScreen] Loading reels...');
      }
      const response = await API.blog.getBlogs({ isReel: true, mediaType: 'video' });
      const blogsData = Array.isArray(response) ? response : (response.data || []);
      
      if (__DEV__) {
        console.log('📊 [ReelsScreen] Received blogs:', {
          total: blogsData.length,
          blogs: blogsData.map((b: any) => ({
            id: b.id,
            isReel: b.is_reel || b.isReel,
            mediaType: b.media_type || b.mediaType,
            mediaUrl: b.media_url || b.mediaUrl,
          })),
        });
      }
      
      // CRITICAL: Filter only reels (videos only)
      const reelsData = blogsData.filter(
        (blog: any) => {
          const isReelVideo = blog.is_reel === true || blog.isReel === true;
          const isVideo = blog.media_type === 'video' || blog.mediaType === 'video';
          return isReelVideo && isVideo;
        }
      );
      
      if (__DEV__) {
        console.log('🎬 [ReelsScreen] Filtered reels (videos only):', {
          count: reelsData.length,
          reels: reelsData.map((r: any) => ({
            id: r.id,
            title: r.title,
            mediaType: r.media_type || r.mediaType,
            mediaUrl: r.media_url || r.mediaUrl,
          })),
        });
      }
      
      // Construct proper media URLs - support both single and multiple images
      const reelsWithUrls = reelsData.map((reel: any) => {
        // CRITICAL: Parse media URLs - support both single URL and JSON array
        let mediaUrls: string[] = [];
        let mediaUrl: string | null = null;
        
        try {
          // Check if media_url is a JSON array (for multiple images)
          const mediaUrlData = reel.media_url || reel.mediaUrl || reel.mediaUrls || reel.media_urls;
          
          if (typeof mediaUrlData === 'string' && mediaUrlData.startsWith('[')) {
            // It's a JSON array
            mediaUrls = JSON.parse(mediaUrlData);
          } else if (Array.isArray(mediaUrlData)) {
            // Already an array
            mediaUrls = mediaUrlData;
          } else if (mediaUrlData) {
            // Single URL
            mediaUrls = [mediaUrlData];
          }
          
          // Build URLs for all media
          mediaUrls = mediaUrls.map((url: string) => {
            if (!url) return url;
            const builtUrl = buildImageUrl(url) || url;
            return builtUrl;
          }).filter((url: string) => url); // Remove null/undefined
          
          // Primary media URL (first one) for backward compatibility
          mediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : null;
        } catch (parseError) {
          // If parsing fails, treat as single URL
          const mediaUrlData = reel.media_url || reel.mediaUrl;
          if (mediaUrlData) {
            mediaUrl = buildImageUrl(mediaUrlData) || mediaUrlData;
            mediaUrls = [mediaUrl];
          }
        }
        
        const tagsList = Array.isArray(reel.tags)
          ? reel.tags
          : typeof reel.tags === 'string'
            ? (() => {
                try {
                  const parsed = JSON.parse(reel.tags);
                  if (Array.isArray(parsed)) {
                    return parsed;
                  }
                } catch (error) {
                  // fallback to comma split
                }
                return reel.tags
                  .split(',')
                  .map((tag: string) => tag.trim())
                  .filter(Boolean);
              })()
            : [];

        const processedReel = {
          ...reel,
          mediaUrl: mediaUrl, // Primary URL (backward compatibility)
          mediaUrls: mediaUrls, // Array of all media URLs
          media_urls: mediaUrls, // Alternative field name
          mediaType: reel.media_type || reel.mediaType || 'image',
          viewsCount: Number(reel.viewsCount ?? reel.views_count ?? 0),
          destination: reel.destination || null,
          tags: tagsList,
        };
        
        if (__DEV__) {
          console.log('✅ [ReelsScreen] Processed reel:', {
            id: processedReel.id,
            title: processedReel.title,
            mediaType: processedReel.mediaType,
            mediaUrl: processedReel.mediaUrl,
            mediaUrlsCount: processedReel.mediaUrls?.length || 0,
          });
        }
        
        return processedReel;
      });
      
      if (__DEV__) {
        console.log('✅ [ReelsScreen] Final reels with URLs:', {
          count: reelsWithUrls.length,
          reels: reelsWithUrls.map((r: any) => ({
            id: r.id,
            mediaUrl: r.mediaUrl,
            mediaType: r.mediaType,
          })),
        });
      }
      
      setReels(reelsWithUrls);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الريلز',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReels();
  };

  const handleLike = async (reel: Reel) => {
    if (!user) {
      Toast.show({
        type: 'info',
        text1: 'تنبيه',
        text2: 'يجب تسجيل الدخول للإعجاب',
      });
      return;
    }

    try {
      const response = await API.blog.likeBlog(reel.id.toString());
      const data = response.data || response;
      
      setReels(reels.map(r => 
        r.id === reel.id 
          ? { ...r, isLiked: data.isLiked, likesCount: data.likesCount }
          : r
      ));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل في الإعجاب',
      });
    }
  };

  const handleComment = (reel: Reel) => {
    navigation.navigate('BlogDetails', { blogId: reel.id.toString() });
  };

  const handleShare = async (reel: Reel) => {
    if (!user) {
      Toast.show({
        type: 'info',
        text1: 'تنبيه',
        text2: 'يجب تسجيل الدخول للمشاركة',
      });
      return;
    }

    try {
      // CRITICAL: Share reel/video with backend tracking
      const response = await API.blog.shareBlog(reel.id.toString(), { shareType: 'app' });
      const data = response.data || response;
      
      // CRITICAL: Update shares count in local state
      setReels(reels.map(r => 
        r.id === reel.id 
          ? { ...r, sharesCount: data.sharesCount || reel.sharesCount || 0 }
          : r
      ));

      // CRITICAL: Use shareUrl from backend, fallback to default
      const shareUrl = data.shareUrl || data.share_url || `https://altayarvip.com/reels/${reel.id}`;
      
      // CRITICAL: Include video/reel information in share message
      const shareMessage = reel.isReel 
        ? `🎥 ${reel.title}\n\n${reel.content || ''}\n\n${shareUrl}`
        : `${reel.title}\n\n${reel.content || ''}\n\n${shareUrl}`;
      
      await Share.share({
        message: shareMessage,
        title: reel.title,
        url: shareUrl, // CRITICAL: Include URL for better sharing support
      });
      
      Toast.show({
        type: 'success',
        text1: 'تمت المشاركة',
        text2: 'تم مشاركة الريل بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل في المشاركة',
      });
    }
  };

  const handleSave = async (reel: Reel) => {
    if (!user) {
      Toast.show({
        type: 'info',
        text1: 'تنبيه',
        text2: 'يجب تسجيل الدخول للحفظ',
      });
      return;
    }

    try {
      const response = await API.blog.saveBlog(reel.id.toString());
      const data = response.data || response;
      
      setReels(reels.map(r => 
        r.id === reel.id 
          ? { ...r, isSaved: data.isSaved, savedCount: data.savedCount }
          : r
      ));

      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: data.isSaved ? 'تم الحفظ بنجاح' : 'تم إلغاء الحفظ',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل في الحفظ',
      });
    }
  };

  const handleCreateReel = () => {
    if (!user) {
      Toast.show({
        type: 'info',
        text1: 'تنبيه',
        text2: 'يجب تسجيل الدخول لإنشاء ريل',
      });
      return;
    }

    if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'data_entry') {
      Alert.alert(
        'غير مصرح',
        'لا تملك صلاحية لإنشاء ريل. يجب أن تكون أدمن أو مسؤول بيانات.',
        [{ text: 'حسناً' }]
      );
      return;
    }

    navigation.navigate('CreateReel');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const diff = Date.now() - date.getTime();
    const minutes = Math.max(0, Math.floor(diff / (1000 * 60)));
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} س`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} يوم`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} شهر`;
    const years = Math.floor(months / 12);
    return `${years} سنة`;
  };

  const toggleMute = (reelId: number) => {
    setMutedVideos(prev => ({
      ...prev,
      [reelId]: !prev[reelId],
    }));
  };

  const handleVideoProgress = (
    reelId: number,
    progressData: { currentTime: number; playableDuration: number; seekableDuration: number }
  ) => {
    const duration =
      progressData.seekableDuration ||
      progressData.playableDuration ||
      videoDurations[reelId] ||
      0;
    if (!duration) {
      return;
    }
    const progress = Math.max(0, Math.min(1, progressData.currentTime / duration));
    setVideoProgress(prev => {
      if (prev[reelId] === progress) {
        return prev;
      }
      return { ...prev, [reelId]: progress };
    });
  };

  const renderProgressIndicators = () => {
    if (reels.length <= 1) {
      return null;
    }
    return (
      <View style={styles.progressContainer}>
        {reels.map((reel, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const progressValue = isPast ? 1 : isCurrent ? videoProgress[reel.id] || 0 : 0;
          return (
            <View key={`progress-${reel.id}-${index}`} style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressValue * 100}%` }]} />
            </View>
          );
        })}
      </View>
    );
  };

  const toggleVideoPlay = (reelId: number) => {
    setShowInteractionHint(false);
    setPlayingVideos(prev => {
      const isCurrentlyPlaying = !!prev[reelId];
      if (isCurrentlyPlaying) {
        return {};
      }
      return { [reelId]: true };
    });
  };
  
  // CRITICAL: Auto-play video when it becomes active - with proper cleanup and debouncing
  useEffect(() => {
    if (reels.length > 0 && currentIndex >= 0 && currentIndex < reels.length) {
      const currentReel = reels[currentIndex];
      if (currentReel && currentReel.mediaType === 'video') {
        // Only update if reel actually changed
        if (currentReelIdRef.current !== currentReel.id) {
          currentReelIdRef.current = currentReel.id;
          
          // Auto-play active video after a small delay to ensure component is mounted
          const playTimeout = setTimeout(() => {
            setPlayingVideos(prev => {
              // Only update if not already playing this video
              if (prev[currentReel.id]) {
                return prev;
              }
              // Clear all other videos and play only the current one
              const newState: { [key: number]: boolean } = {};
              newState[currentReel.id] = true;
              if (__DEV__) {
                console.log('▶️ [ReelsScreen] Auto-playing video:', {
                  reelId: currentReel.id,
                  index: currentIndex,
                  url: currentReel.mediaUrl,
                });
              }
              return newState;
            });
          }, 150); // Small delay to ensure video component is ready
          
          return () => clearTimeout(playTimeout);
        }
      } else {
        // Pause all videos if current reel is not a video
        currentReelIdRef.current = null;
        setPlayingVideos({});
      }
    }
  }, [currentIndex, reels.length]); // Only depend on currentIndex and reels.length, not full reels array
  
  // CRITICAL: Pause all videos when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Pause all videos when leaving screen
        setPlayingVideos({});
      };
    }, [])
  );

  const renderReel = ({ item, index }: { item: Reel; index: number }) => {
    const isActive = index === currentIndex;
    const isVideo = item.mediaType === 'video';
    const isPlaying = playingVideos[item.id] && isActive;
    const tagsList = Array.isArray(item.tags)
      ? item.tags
      : typeof item.tags === 'string'
        ? item.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
    
    // CRITICAL: Get media URLs array (reels only support videos)
    const mediaUrls = item.mediaUrls || item.media_urls || (item.mediaUrl ? [item.mediaUrl] : []);
    let primaryMediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : null;
    
    // CRITICAL FIX: Ensure video URL is absolute and valid
    if (primaryMediaUrl) {
      primaryMediaUrl = primaryMediaUrl.trim();
      
      // CRITICAL: Build absolute URL if it's relative
      if (!primaryMediaUrl.startsWith('http://') && !primaryMediaUrl.startsWith('https://') && !primaryMediaUrl.startsWith('file://')) {
        // Build absolute URL using buildImageUrl
        const builtUrl = buildImageUrl(primaryMediaUrl);
        if (builtUrl) {
          primaryMediaUrl = builtUrl;
        } else {
          if (__DEV__) {
            console.warn('⚠️ [ReelsScreen] Failed to build video URL:', primaryMediaUrl);
          }
        }
      }
      
      // Log video URL for debugging
      if (__DEV__) {
        console.log('🎥 [ReelsScreen] Video URL:', {
          reelId: item.id,
          url: primaryMediaUrl,
          isAbsolute: primaryMediaUrl.startsWith('http://') || primaryMediaUrl.startsWith('https://'),
          mediaType: item.mediaType,
        });
      }
    }
    
    // CRITICAL: Reels only show videos - filter out non-video items
    if (!isVideo) {
      // This shouldn't happen, but show placeholder if it does
      return (
        <View style={styles.reelContainer}>
          <View style={[styles.reelPlaceholder, { backgroundColor: theme.colors.background }]}>
            <SafeIcon name="videocam" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.errorText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
              الريلز تقبل فيديوهات فقط
            </Text>
          </View>
        </View>
      );
    }
    const isMuted = mutedVideos[item.id] ?? false;
    const followHandler = () =>
      Toast.show({
        type: 'info',
        text1: 'قريباً',
        text2: 'ميزة المتابعة سيتم تفعيلها قريباً',
      });
    const openMoreMenu = () =>
      Alert.alert('خيارات الريل', 'اختر الإجراء المطلوب', [
        {
          text: item.isSaved ? 'إلغاء الحفظ' : 'حفظ الريل',
          onPress: () => handleSave(item),
        },
        {
          text: 'مشاركة',
          onPress: () => handleShare(item),
        },
        { text: 'إلغاء', style: 'cancel' },
      ]);
    
    return (
      <View style={styles.reelContainer}>
        <TouchableWithoutFeedback onPress={() => toggleVideoPlay(item.id)}>
        <View style={[styles.mediaContainer, { backgroundColor: 'transparent' }]}>
          {primaryMediaUrl && isVideo ? null : (
            <View style={[styles.reelPlaceholder, { backgroundColor: theme.colors.background }]}>
              <SafeIcon name="videocam" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.errorText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                {!primaryMediaUrl ? 'لا يوجد فيديو' : 'الريلز تقبل فيديوهات فقط'}
              </Text>
            </View>
          )}
            {renderProgressIndicators()}
            <View style={[styles.overlayShade, styles.overlayShadeTop]} />
            <View style={[styles.overlayShade, styles.overlayShadeBottom]} />
            {!isPlaying && isVideo && (
              <View style={styles.playStateBadge}>
                <SafeIcon name="play-arrow" size={48} color="#FFFFFF" />
                <Text style={styles.playStateText}>اضغط للتشغيل</Text>
        </View>
            )}
            {showInteractionHint && isActive && (
              <View style={styles.hintBadge}>
                <SafeIcon name="touch-app" size={20} color="#FFFFFF" />
                <Text style={styles.hintText}>اضغط لإيقاف/تشغيل</Text>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.topOverlay}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <SafeIcon name="play-circle-filled" size={18} color="#FFFFFF" />
              <Text style={styles.brandText}>Altayar Reels</Text>
            </View>
            <TouchableOpacity style={styles.liveBadge} activeOpacity={0.8}>
              <SafeIcon name="fiber-manual-record" size={10} color="#FF3040" />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.muteButton}
              onPress={() => toggleMute(item.id)}
              activeOpacity={0.8}
            >
              <SafeIcon name={isMuted ? 'volume-off' : 'volume-up'} size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.muteButton}
              onPress={openMoreMenu}
              activeOpacity={0.8}
            >
              <SafeIcon name="more-vert" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionRail}>
          <View style={styles.actionProfile}>
            <View style={styles.actionAvatar}>
              <Text style={styles.avatarText}>
                {item.author?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.quickFollowButton} onPress={followHandler}>
              <SafeIcon name="add" size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrapper, item.isLiked && styles.actionIconActive]}>
            <SafeIcon
              name={item.isLiked ? 'favorite' : 'favorite-border'}
                size={24}
                color={item.isLiked ? '#FFFFFF' : '#FFFFFF'}
            />
            </View>
            <Text style={styles.actionText}>{formatNumber(item.likesCount || 0)}</Text>
            <Text style={styles.actionLabel}>إعجاب</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleComment(item)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrapper}>
              <SafeIcon name="chat-bubble-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{formatNumber(item.commentsCount || 0)}</Text>
            <Text style={styles.actionLabel}>تعليق</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrapper}>
              <SafeIcon name="share" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{formatNumber(item.sharesCount || 0)}</Text>
            <Text style={styles.actionLabel}>مشاركة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSave(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrapper, item.isSaved && styles.actionIconActive]}>
            <SafeIcon
              name={item.isSaved ? 'bookmark' : 'bookmark-border'}
                size={24}
                color="#FFFFFF"
            />
            </View>
            <Text style={styles.actionText}>{formatNumber(item.savedCount || 0)}</Text>
            <Text style={styles.actionLabel}>{item.isSaved ? 'محفوظ' : 'حفظ'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleMute(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrapper}>
              <SafeIcon name="music-note" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{isMuted ? 'صامت' : 'صوت'}</Text>
            <Text style={styles.actionLabel}>الصوت</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomOverlay}>
          <View style={styles.authorRow}>
            <View style={[styles.avatarLarge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {item.author?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{item.author?.name || 'مستخدم'}</Text>
              <Text style={styles.timestampText}>{formatRelativeTime(item.created_at)}</Text>
            </View>
            <TouchableOpacity style={styles.followButton} onPress={followHandler} activeOpacity={0.8}>
              <SafeIcon name="add" size={18} color="#000000" />
              <Text style={styles.followButtonText}>تابع</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metaBadges}>
            <View style={styles.metaBadge}>
              <SafeIcon name="visibility" size={16} color="#FFFFFF" />
              <Text style={styles.metaBadgeText}>{formatNumber(item.viewsCount || 0)} مشاهدة</Text>
            </View>
            {item.destination ? (
              <View style={styles.metaBadge}>
                <SafeIcon name="place" size={16} color="#FFFFFF" />
                <Text style={styles.metaBadgeText}>{item.destination}</Text>
              </View>
            ) : null}
          </View>
          {tagsList.length > 0 && (
            <View style={styles.tagList}>
              {tagsList.map(tag => (
                <View key={`${item.id}-${tag}`} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.reelTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.content && (
            <Text style={styles.reelContent} numberOfLines={3}>
              {item.content}
            </Text>
          )}
          <View style={styles.audioPill}>
            <SafeIcon name="music-note" size={18} color="#FFFFFF" />
            <Text style={styles.audioText} numberOfLines={1}>
              {item.title || 'الصوت الأصلي - Altayar'}
            </Text>
            <SafeIcon name="chevron-right" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => handleComment(item)}
              activeOpacity={0.85}
            >
              <SafeIcon name="play-arrow" size={20} color="#000000" />
              <Text style={styles.primaryCtaText}>عرض التفاصيل</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryCta}
              onPress={() => handleShare(item)}
              activeOpacity={0.85}
            >
              <SafeIcon name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCreateReelButton = () => {
    if (!canCreateReel) {
      return null;
    }

    return (
      <View style={styles.reelContainer}>
        <View style={styles.createReelContainer}>
          <SafeIcon name="videocam" size={80} color="#FFFFFF" />
          <Text style={styles.createReelTitle}>أنشئ ريل جديد</Text>
          <Text style={styles.createReelSubtitle}>شارك لحظاتك مع العالم</Text>
          <TouchableOpacity
            style={[styles.createReelButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateReel}
          >
            <Text style={styles.createReelButtonText}>إنشاء ريل</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      const previousIndex = currentIndex;
      
      // CRITICAL: Only update if index actually changed to prevent loops
      if (newIndex !== previousIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
      
      const activeReel = reels[newIndex];
      if (activeReel && activeReel.mediaType === 'video') {
          // Use setTimeout to prevent state updates during render
          setTimeout(() => {
        setPlayingVideos(prev => {
              // Only update if not already playing
              if (prev[activeReel.id]) {
                return prev;
              }
          const newState: { [key: number]: boolean } = {};
          newState[activeReel.id] = true;
              if (__DEV__) {
                console.log('🔄 [ReelsScreen] Switched to new reel:', {
                  newIndex,
                  previousIndex,
                  reelId: activeReel.id,
                });
              }
          return newState;
        });
          }, 50); // Small delay to prevent rapid updates
      } else {
        setPlayingVideos({});
        }
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Prepare data with create button at the end
  const dataWithCreateButton = useMemo(() => {
    if (!canCreateReel) {
      return reels;
    }
    return [...reels, { id: -1 } as Reel];
  }, [reels, canCreateReel]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['top']}>
        <LoadingSpinner text="جاري تحميل الريلز..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['top']}>
      {/* Persistent single video player behind items */}
      <ReelsViewportPlayer
        uri={reels[currentIndex]?.mediaUrl}
        playing={!!(reels[currentIndex] && playingVideos[reels[currentIndex].id])}
        muted={!!(reels[currentIndex] && mutedVideos[reels[currentIndex].id])}
        onLoad={(data: any) => {
          if (reels[currentIndex]?.id && data?.duration) {
            setVideoDurations(prev => ({ ...prev, [reels[currentIndex]!.id]: data.duration }));
          }
        }}
        onProgress={(progressData) => {
          if (reels[currentIndex]?.id) {
            handleVideoProgress(reels[currentIndex]!.id, progressData);
          }
        }}
        onError={(error) => {
          if (__DEV__) {
            console.error('❌ [ReelsScreen] Viewport player error:', error);
          }
          Toast.show({
            type: 'error',
            text1: 'خطأ في تشغيل الفيديو',
            text2: `فشل تحميل الفيديو: ${error?.error?.code || error?.code || error?.message || 'خطأ غير معروف'}`,
          });
          setPlayingVideos({});
        }}
      />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SafeIcon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reels</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'قريباً',
                text2: 'بحث الريلز سيتم إطلاقه قريباً',
              })
            }
            style={styles.headerActionButton}
          >
            <SafeIcon name="search" size={24} color="#FFFFFF" />
        </TouchableOpacity>
          {canCreateReel && (
            <TouchableOpacity onPress={handleCreateReel} style={styles.headerActionButton}>
              <SafeIcon name="videocam" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {reels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <SafeIcon name="videocam" size={64} color="#FFFFFF" />
          <Text style={styles.emptyText}>لا توجد ريلز متاحة</Text>
          {canCreateReel && (
            <TouchableOpacity
              style={[styles.createReelButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCreateReel}
            >
              <Text style={styles.createReelButtonText}>إنشاء ريل جديد</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={dataWithCreateButton}
          renderItem={({ item, index }) => {
            if (item.id === -1) {
              return renderCreateReelButton();
            }
            return renderReel({ item, index });
          }}
          keyExtractor={(item, index) => item.id === -1 ? 'create-button' : item.id.toString()}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'ios'}
          getItemLayout={(_, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          extraData={[currentIndex, playingVideos, mutedVideos]}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    backgroundColor: '#000000',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  reelMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  reelPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  deferredVideoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  deferredVideoText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  },
  overlayShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 160,
    zIndex: 1,
  },
  overlayShadeTop: {
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayShadeBottom: {
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  playStateBadge: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 5,
  },
  playStateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hintBadge: {
    position: 'absolute',
    bottom: 220,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  brandText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionRail: {
    position: 'absolute',
    right: 12,
    bottom: 110,
    alignItems: 'center',
    gap: 18,
    zIndex: 6,
  },
  actionProfile: {
    alignItems: 'center',
    gap: 6,
  },
  actionAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  quickFollowButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionIconActive: {
    backgroundColor: '#FF3040',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tagChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorMeta: {
    flex: 1,
    marginHorizontal: 12,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  timestampText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  followButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  reelTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reelContent: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginTop: 12,
  },
  audioText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 12,
    gap: 8,
  },
  primaryCtaText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryCta: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  createReelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  createReelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  createReelSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  createReelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  createReelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
    zIndex: 6,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});

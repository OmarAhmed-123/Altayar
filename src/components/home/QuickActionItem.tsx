import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, Easing, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { AnimatedCard } from './../animations/AnimatedCard';
import { useTheme } from './../../hooks/useTheme';
import { getExpressiveImage } from './../../services/expressiveImageService';
import { ensureStringUri, getDefaultFallbackImage } from './../../utils/imageUriHelper';
import { FastImage } from './../common/FastImage';

interface QuickActionItemProps {
  item: {
    id: number;
    title: string;
    icon: string;
    imageCategory: string;
  };
  onPress: () => void;
}

export const QuickActionItem: React.FC<QuickActionItemProps> = ({ item, onPress }) => {
  const { theme } = useTheme();
  const [actionImage, setActionImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [imageScaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const loadImage = async () => {
      try {
        setImageLoading(true);
        // Map imageCategory to category for getExpressiveImage
        let category = item.imageCategory;
        if (item.imageCategory.includes('booking')) {
          category = 'booking';
        } else if (item.imageCategory.includes('trip')) {
          category = 'trip';
        } else if (item.imageCategory.includes('review')) {
          category = 'review';
        } else if (item.imageCategory.includes('profile')) {
          category = 'profile';
        }
        
        // Use optimized smaller size (120x120) for faster loading
        const imageUrl = await getExpressiveImage(category, 120, 120);
        const safeUri = ensureStringUri(imageUrl, `https://via.placeholder.com/120x120/E60012/FFFFFF?text=${encodeURIComponent(item.title)}`);
        setActionImage(safeUri);
      } catch (error) {
        console.error(`Error loading action image for ${item.title}:`, error);
        // Fallback to placeholder
        const fallbackUrl = `https://via.placeholder.com/120x120/E60012/FFFFFF?text=${encodeURIComponent(item.title)}`;
        setActionImage(ensureStringUri(fallbackUrl, fallbackUrl));
      } finally {
        setImageLoading(false);
        // Start image fade-in animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(imageScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };
    loadImage();
  }, [item.imageCategory, item.title, fadeAnim, imageScaleAnim]);

  // Continuous pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleImageError = () => {
    // Fallback to placeholder
    setActionImage(`https://via.placeholder.com/120x120/E60012/FFFFFF?text=${encodeURIComponent(item.title)}`);
  };

  return (
    <Animated.View
      style={[
        styles.quickAction,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <AnimatedCard
          style={
            [
              styles.quickActionButton,
              {
                transform: [{ scale: pulseAnim }],
              },
            ] as StyleProp<ViewStyle>
          }
          animationType="pulse"
        >
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ scale: imageScaleAnim }],
              },
            ]}
          >
            {(() => {
              const safeUri = ensureStringUri(actionImage);
              if (!safeUri || imageLoading) {
                return (
                  <View style={[styles.quickActionButton, styles.fallbackContainer, { backgroundColor: theme.colors.primary }]}>
                    {imageLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.fallbackText}>{item.title.charAt(0)}</Text>
                    )}
                  </View>
                );
              }
              return (
                <FastImage 
                  source={safeUri} 
                  style={styles.quickActionImage} 
                  resizeMode="cover"
                  onError={handleImageError}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => {
                    setImageLoading(false);
                  }}
                  fallback={getDefaultFallbackImage()}
                />
              );
            })()}
          </Animated.View>
        </AnimatedCard>
      </TouchableOpacity>
      <Text style={styles.quickActionText}>{item.title}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  quickAction: {
    alignItems: 'center',
    marginRight: 24,
    width: 100,
  },
  quickActionButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  fallbackContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  fallbackText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickActionImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#F5F5F5',
  },
  quickActionText: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.2,
  },
});

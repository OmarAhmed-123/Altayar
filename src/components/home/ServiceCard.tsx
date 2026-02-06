import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, Animated, Easing, View, ActivityIndicator } from 'react-native';
import { AnimatedCard } from './../animations/AnimatedCard';
import { getExpressiveImage } from './../../utils/imageApiHelper';

interface ServiceCardProps {
  item: {
    id: number;
    title: string;
    description: string;
    category: string;
    imageUrl?: string;
  };
  onPress: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ item, onPress }) => {
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [imageScaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    const loadServiceImage = async () => {
      try {
        setImageLoading(true);
        
        if (item.imageUrl) {
          setServiceImage(item.imageUrl);
        } else {
          // Use optimized smaller size (150x150) for faster loading
          const imageUrl = getExpressiveImage(item.category, 150, 150);
          setServiceImage(imageUrl);
        }
      } catch (error) {
        console.error(`Error loading service image for ${item.title}:`, error);
        // Fallback to placeholder
        setServiceImage(`https://via.placeholder.com/150x150/E60012/FFFFFF?text=${encodeURIComponent(item.title)}`);
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
    loadServiceImage();
  }, [item.category, item.title, item.imageUrl, fadeAnim, imageScaleAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
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
    setServiceImage(`https://via.placeholder.com/150x150/E60012/FFFFFF?text=${encodeURIComponent(item.title)}`);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <AnimatedCard
        style={styles.card}
        animationType="scale"
        onPress={onPress}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Animated.View
            style={[
              styles.imageContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: imageScaleAnim }],
              },
            ]}
          >
            {serviceImage && !imageLoading ? (
              <Image
                source={{ uri: serviceImage }}
                style={styles.serviceImage}
                resizeMode="cover"
                onError={handleImageError}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => {
                  setImageLoading(false);
                }}
              />
            ) : (
              <View style={[styles.serviceImage, styles.placeholder]}>
                {imageLoading ? (
                  <ActivityIndicator size="small" color="#E60012" />
                ) : (
                  <Text style={styles.placeholderText}>{item.title.charAt(0)}</Text>
                )}
              </View>
            )}
          </Animated.View>
          <Text style={styles.serviceTitle}>{item.title}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </TouchableOpacity>
      </AnimatedCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 18,
  },
  card: {
    width: 170,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  cardContent: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    minHeight: 200,
  },
  imageContainer: {
    marginBottom: 14,
  },
  serviceImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: '#F5F5F5',
  },
  placeholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#999999',
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
});

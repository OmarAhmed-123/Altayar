import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, Image, StyleSheet, Animated, Easing } from 'react-native';
import { useAuthStore } from './../../stores/authStore';
import { useTheme } from './../../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import { getFallbackAvatarUri, resolveUserAvatarUri } from '../../utils/avatarHelper';

export const ProfileTabButton: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Continuous pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePress = () => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to profile
    setTimeout(() => {
      navigation.navigate('Profile' as never);
    }, 150);
  };

  const fallbackAvatarUri = useMemo(
    () => getFallbackAvatarUri(user, theme.colors.primary),
    [user, theme.colors.primary]
  );
  const [avatarUri, setAvatarUri] = useState(
    resolveUserAvatarUri(user?.avatar, fallbackAvatarUri)
  );

  useEffect(() => {
    setAvatarUri(resolveUserAvatarUri(user?.avatar, fallbackAvatarUri));
  }, [user?.avatar, fallbackAvatarUri]);

  return (
    <Animated.View
      style={[
        styles.imageContainer,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
          resizeMode="cover"
          onError={() => {
            setAvatarUri(fallbackAvatarUri);
          }}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: 70,
    height: 70,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchable: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#0078D4',
    opacity: 0.4,
  },
});


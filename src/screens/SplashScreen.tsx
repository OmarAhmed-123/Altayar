import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from './../stores/authStore';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.5));
  const [logoOpacity] = React.useState(new Animated.Value(0));
  const [textOpacity] = React.useState(new Animated.Value(0));
  const [loadingBarWidth] = React.useState(new Animated.Value(0));
  const [loadingBarOpacity] = React.useState(new Animated.Value(0));
  const [logoRotate] = React.useState(new Animated.Value(0));
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Start animations sequence
    Animated.sequence([
      // Logo appears with scale and fade
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Loading bar appears and fills
      Animated.parallel([
        Animated.timing(loadingBarOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(loadingBarWidth, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
      // Text appears
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimationComplete(true);
    });

    // Start logo rotation animation (continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [
    fadeAnim,
    scaleAnim,
    logoOpacity,
    loadingBarOpacity,
    loadingBarWidth,
    textOpacity,
    logoRotate,
  ]);

  // Navigate after animation completes and auth state is ready
  useEffect(() => {
    if (animationComplete && !isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          (navigation as any).replace('MainTabs');
        } else {
          (navigation as any).replace('Login');
        }
      }, 500); // Small delay to ensure smooth transition

      return () => clearTimeout(timer);
    }
  }, [animationComplete, isLoading, isAuthenticated, navigation]);

  const loadingBarInterpolate = loadingBarWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const rotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoImageContainer,
            {
              opacity: logoOpacity,
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <Image
            source={require('./../assets/images/altayarvip.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
            },
          ]}
        >
          <Text style={styles.logoText}>ALTAYARVIP</Text>
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>HERE, THERE, AND EVERYWHERE</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.loadingBarContainer,
            {
              opacity: loadingBarOpacity,
            },
          ]}
        >
          <View style={styles.loadingBarBackground}>
            <Animated.View
              style={[
                styles.loadingBarFill,
                {
                  width: loadingBarInterpolate,
                },
              ]}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0078D4',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoImageContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  taglineText: {
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 2,
    fontWeight: '600',
  },
  loadingBarContainer: {
    width: 250,
    marginTop: 20,
  },
  loadingBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
});

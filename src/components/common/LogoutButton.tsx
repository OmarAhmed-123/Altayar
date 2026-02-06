import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Easing, Alert } from 'react-native';
import { useAuthStore } from './../../stores/authStore';
import { useTheme } from './../../hooks/useTheme';
import { SafeIcon } from './../../utils/iconHelper';

export const LogoutButton: React.FC = () => {
  const { logout } = useAuthStore();
  const { theme } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [opacityAnim] = useState(new Animated.Value(1));

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            // Start exit animation
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]).start(async () => {
              // Logout after animation
              await logout();
              
              // Reset animations for next time
              scaleAnim.setValue(1);
              opacityAnim.setValue(1);
              
              // Navigation will be handled automatically by AppNavigator
              // based on isAuthenticated state - it will show AuthStack
              // which has Splash as initialRouteName
            });
          },
        },
      ]
    );
  };

  return (
    <Animated.View
      style={[
        styles.button,
        {
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.buttonContent}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <SafeIcon name="logout" size={20} color={theme.colors.error} />
        </Animated.View>
        <Text style={[styles.buttonText, { color: theme.colors.error }]}>
          تسجيل الخروج
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(230, 0, 18, 0.1)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});


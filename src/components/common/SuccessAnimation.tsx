import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal } from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { SafeIcon } from './../../utils/iconHelper';

interface SuccessAnimationProps {
  visible: boolean;
  message?: string;
  onClose?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  message = 'تمت العملية بنجاح',
  onClose,
}) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let checkmarkTimeout: ReturnType<typeof setTimeout> | null = null;
    let autoCloseTimeout: ReturnType<typeof setTimeout> | null = null;

    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      checkmarkScale.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate checkmark with delay
      checkmarkTimeout = setTimeout(() => {
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Auto close after 3 seconds
      if (onClose) {
        autoCloseTimeout = setTimeout(() => {
          onClose();
        }, 3000);
      }
    }

    return () => {
      if (checkmarkTimeout) {
        clearTimeout(checkmarkTimeout);
      }
      if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
      }
    };
  }, [visible, scaleAnim, opacityAnim, checkmarkScale, onClose]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '20' }]}>
            <Animated.View
              style={[
                styles.checkmarkContainer,
                {
                  transform: [{ scale: checkmarkScale }],
                },
              ]}
            >
              <SafeIcon name="check-circle" size={80} color={theme.colors.success} />
            </Animated.View>
          </View>
          <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
    maxWidth: '80%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});


import React, { useRef, useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Image } from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { getIconImageUrl } from './../../utils/imageUtils';
import { SafeIcon } from './../../utils/iconHelper';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: string;
  label: string;
  animated?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  label,
  animated = false,
}) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [iconImage, setIconImage] = useState<string | null>(null);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const url = await getIconImageUrl(icon, 20, 20);
        setIconImage(url);
      } catch (error) {
        console.error('Error loading FAB icon:', error);
      }
    };
    loadIcon();
  }, [icon]);

  useEffect(() => {
    if (animated) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [animated, scaleValue]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: theme.colors.primary,
      borderRadius: 30,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    icon: {
      marginRight: 8,
    },
    iconImage: {
      width: 20,
      height: 20,
    },
    label: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity style={styles.container} onPress={onPress}>
        {iconImage ? (
          <Image source={{ uri: iconImage }} style={[styles.icon, styles.iconImage]} resizeMode="contain" />
        ) : (
          <SafeIcon name={icon} size={20} color="#FFFFFF" style={styles.icon} />
        )}
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

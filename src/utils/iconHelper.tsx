/**
 * Icon Helper Utility
 * Provides fallback mechanism for icons to prevent Chinese character display issues
 */

import React from 'react';
import { Platform, Image, Text, ImageSourcePropType, StyleProp, ImageStyle, TextStyle, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * Check if vector icons are properly loaded
 */
export const areIconsLoaded = (): boolean => {
  try {
    // Try to get a simple icon to test if fonts are loaded
    const testIcon = Icon.getImageSourceSync('home', 20, '#000000');
    return testIcon !== null && testIcon !== undefined;
  } catch (error) {
    return false;
  }
};

/**
 * Safe Icon Component Wrapper
 * Falls back to text or image if icons fail to load
 */
export interface SafeIconProps {
  name: string;
  size?: number;
  color?: string;
  type?: 'MaterialIcons' | 'MaterialCommunityIcons' | 'FontAwesome' | 'Ionicons' | 'Feather';
  fallbackText?: string;
  fallbackImage?: ImageSourcePropType;
  style?: StyleProp<ImageStyle | TextStyle>;
}

export const SafeIcon: React.FC<SafeIconProps> = ({
  name,
  size = 24,
  color = '#000000',
  type = 'MaterialIcons',
  fallbackText,
  fallbackImage,
  style,
}) => {
  // Use the appropriate icon library
  let IconComponent: any;
  try {
    switch (type) {
      case 'MaterialIcons':
        IconComponent = require('react-native-vector-icons/MaterialIcons').default;
        break;
      case 'MaterialCommunityIcons':
        IconComponent = require('react-native-vector-icons/MaterialCommunityIcons').default;
        break;
      case 'FontAwesome':
        IconComponent = require('react-native-vector-icons/FontAwesome').default;
        break;
      case 'Ionicons':
        IconComponent = require('react-native-vector-icons/Ionicons').default;
        break;
      case 'Feather':
        IconComponent = require('react-native-vector-icons/Feather').default;
        break;
      default:
        IconComponent = require('react-native-vector-icons/MaterialIcons').default;
    }
  } catch (error) {
    console.warn(`Failed to load icon type: ${type}`, error);
    // Fallback to MaterialIcons if type fails
    try {
      IconComponent = require('react-native-vector-icons/MaterialIcons').default;
    } catch (fallbackError) {
      console.error('Failed to load MaterialIcons fallback:', fallbackError);
      // If all else fails, return fallback
      if (fallbackImage) {
        return (
          <Image 
            source={fallbackImage} 
            style={[{ width: size, height: size }, style]} 
            resizeMode="contain" 
          />
        );
      }
      if (fallbackText) {
        return (
          <Text style={[{ fontSize: size, color, textAlign: 'center' }, style]}>
            {fallbackText}
          </Text>
        );
      }
      return <View style={[{ width: size, height: size }, style]} />;
    }
  }

  // Try to render the icon
  try {
    if (IconComponent) {
      return <IconComponent name={name} size={size} color={color} style={style} />;
    }
  } catch (error) {
    console.warn(`Failed to render icon: ${name} (${type})`, error);
  }

  // Fallback to image if icon rendering fails and image provided
  if (fallbackImage) {
    return (
      <Image 
        source={fallbackImage} 
        style={[{ width: size, height: size }, style]} 
        resizeMode="contain" 
      />
    );
  }

  // Fallback to text if icon rendering fails and text provided
  if (fallbackText) {
    return (
      <Text style={[{ fontSize: size, color, textAlign: 'center' }, style]}>
        {fallbackText}
      </Text>
    );
  }

  // Return empty view if no fallback
  return <View style={[{ width: size, height: size }, style]} />;
};

/**
 * Preload all icon fonts to prevent Chinese character issues
 */
export const preloadIcons = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Force load MaterialIcons font
      const MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
      
      // Check if loadFont method exists (it might not in newer versions)
      if (MaterialIcons && typeof MaterialIcons.loadFont === 'function') {
        try {
          await MaterialIcons.loadFont();
          console.log('✅ MaterialIcons font loaded successfully');
        } catch (loadError) {
          console.warn('⚠️ MaterialIcons.loadFont() failed, fonts should be auto-loaded via assets');
        }
      } else {
        // For newer versions, fonts should be auto-loaded via assets
        // Just verify the font is available
        console.log('ℹ️ Icons should be auto-loaded via assets');
      }
      
      // Also try to preload other common icon sets
      try {
        const FontAwesome = require('react-native-vector-icons/FontAwesome').default;
        if (FontAwesome && typeof FontAwesome.loadFont === 'function') {
          await FontAwesome.loadFont();
        }
      } catch (e) {
        // Ignore
      }
      
      return true;
    }
    return true;
  } catch (error) {
    console.warn('Failed to preload icons:', error);
    // Don't fail the app if icons can't be preloaded
    return false;
  }
};

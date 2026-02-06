import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { useLanguage } from './../../hooks/useLanguage';
import { useNavigation } from '@react-navigation/native';
import { getExpressiveImages } from './../../services/expressiveImageService';
import { ensureStringUri } from './../../utils/imageUriHelper';
import { SafeIcon } from './../../utils/iconHelper';

export const MoreScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [menuItemImages, setMenuItemImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadMenuImages = async () => {
      try {
        // Map screen names to categories
        const categoryMap: Record<string, string> = {
          'settings': 'settings',
          'language': 'language',
          'colortheme': 'theme',
          'reviews': 'reviews',
          'bookings': 'bookings',
          'trips': 'trips',
          'memberships': 'memberships',
          'profile': 'profile',
          'paymentstats': 'stats',
        };
        
        const categories = Object.values(categoryMap);
        const images = await getExpressiveImages(categories, 24, 24);
        
        // Map back to screen names
        const mappedImages: Record<string, string> = {};
        Object.keys(categoryMap).forEach(screen => {
          const category = categoryMap[screen];
          if (images[category]) {
            mappedImages[screen] = images[category];
          }
        });
        
        setMenuItemImages(mappedImages);
      } catch (error) {
        console.error('Error loading menu images:', error);
      }
    };
    loadMenuImages();
  }, []);

  const menuItems = [
    { id: 1, title: 'الإعدادات', icon: 'settings', screen: 'Settings', drawer: true },
    { id: 2, title: 'اللغة', icon: 'language', screen: 'Language', drawer: true },
    { id: 3, title: 'المظهر', icon: 'palette', screen: 'ColorTheme', drawer: true },
    { id: 4, title: 'التقييمات', icon: 'star', screen: 'Reviews', drawer: true },
    { id: 5, title: 'الحجوزات', icon: 'book-online', screen: 'Bookings', drawer: true },
    { id: 6, title: 'رحلاتي', icon: 'route', screen: 'Trips', drawer: true },
    { id: 7, title: 'العضويات', icon: 'card-membership', screen: 'Memberships', drawer: true },
    { id: 8, title: 'الملف الشخصي', icon: 'person', screen: 'Profile', drawer: false },
    { id: 9, title: 'إحصائيات الدفع', icon: 'bar-chart', screen: 'PaymentStats', drawer: true },
    { id: 10, title: 'التحليلات', icon: 'analytics', screen: 'Analytics', drawer: true },
  ];

  const handleMenuItemPress = (screen: string, drawer: boolean) => {
    if (drawer) {
      // Navigate to drawer screen
      (navigation as any).getParent()?.navigate(screen);
    } else {
      // Navigate to tab screen
      (navigation as any).navigate(screen);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>المزيد</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleMenuItemPress(item.screen, item.drawer)}
          >
            <View style={styles.menuItemLeft}>
              {(() => {
                const screenKey = item.screen.toLowerCase();
                const categoryMap: Record<string, string> = {
                  'settings': 'settings',
                  'language': 'language',
                  'colortheme': 'theme',
                  'reviews': 'reviews',
                  'bookings': 'bookings',
                  'trips': 'trips',
                  'memberships': 'memberships',
                  'profile': 'profile',
                  'paymentstats': 'stats',
                };
                const category = categoryMap[screenKey] || screenKey;
                return menuItemImages[category] ? (
                  <Image
                    source={{ uri: ensureStringUri(menuItemImages[category]) }}
                    style={styles.menuItemIcon}
                    resizeMode="contain"
                  />
                ) : (
                  <SafeIcon name={item.icon as any} size={24} color={theme.colors.primary} />
                );
              })()}
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{item.title}</Text>
            </View>
            <SafeIcon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    width: 24,
    height: 24,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

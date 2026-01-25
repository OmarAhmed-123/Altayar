import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Login' as never);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.8,
    },
  });

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://via.placeholder.com/120x120/FFFFFF/6366F1?text=AT' }} 
        style={styles.logo} 
      />
      <Text style={styles.title}>Altayar</Text>
      <Text style={styles.subtitle}>رحلاتك تبدأ معنا</Text>
    </View>
  );
};

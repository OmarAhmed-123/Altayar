import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { externalApiService } from '../../services/externalApiService';
import { geolocationService } from '../../services/geolocationService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SafeIcon } from '../../utils/iconHelper';
import Toast from 'react-native-toast-message';
// Note: expo-location is optional. If not installed, location features will be limited.
// You can install it with: npm install expo-location
// For now, we'll use a fallback approach

export const WeatherScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const loadWeather = useCallback(
    async (lat: number, lon: number) => {
      setLoading(true);
      try {
        const [currentResponse, forecastResponse] = await Promise.all([
          externalApiService.getCurrentWeather(lat, lon),
          externalApiService.getWeatherForecast(lat, lon, 5),
        ]);

        if (currentResponse.success) {
          setCurrentWeather(currentResponse.data);
        }
        if (forecastResponse.success) {
          setForecast(Array.isArray(forecastResponse.data) ? forecastResponse.data : []);
        }
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: t('error'),
          text2: error.message || t('failed_to_load_weather'),
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  const getCurrentLocation = useCallback(async () => {
    try {
      // Try to use expo-location if available
      let Location: any;
      try {
        Location = require('expo-location');
      } catch {
        // expo-location not installed, use geolocation service instead
        const locationResponse = await geolocationService.getCurrentLocationInfo();
        if (locationResponse.success && locationResponse.data) {
          const loc = locationResponse.data;
          if (loc.latitude && loc.longitude) {
            setLatitude(loc.latitude.toString());
            setLongitude(loc.longitude.toString());
            loadWeather(loc.latitude, loc.longitude);
            return;
          }
        }
        Toast.show({
          type: 'info',
          text1: t('info'),
          text2: t('please_enter_coordinates_manually'),
        });
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: t('error'),
          text2: t('location_permission_denied'),
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      loadWeather(location.coords.latitude, location.coords.longitude);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: error.message || t('failed_to_get_location'),
      });
    }
  }, [loadWeather, t]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);


  const handleSearch = () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('please_enter_valid_coordinates'),
      });
      return;
    }
    loadWeather(lat, lon);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (latitude && longitude) {
      loadWeather(parseFloat(latitude), parseFloat(longitude));
    } else {
      getCurrentLocation();
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <SafeIcon name="partly-sunny" size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>{t('weather')}</Text>
        <Text style={styles.headerSubtitle}>{t('current_weather_and_forecast')}</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder={t('latitude')}
            placeholderTextColor={theme.colors.textSecondary}
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder={t('longitude')}
            placeholderTextColor={theme.colors.textSecondary}
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.searchActions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleSearch}
          >
            <SafeIcon name="search" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t('search')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.info }]}
            onPress={getCurrentLocation}
          >
            <SafeIcon name="location" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t('current_location')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      ) : currentWeather ? (
        <>
          <View style={[styles.currentWeather, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.temperature, { color: theme.colors.text }]}>
              {currentWeather.temperature}°
            </Text>
            <Text style={[styles.condition, { color: theme.colors.textSecondary }]}>
              {currentWeather.condition}
            </Text>
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetail}>
                <SafeIcon name="water" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.weatherDetailText, { color: theme.colors.textSecondary }]}>
                  {currentWeather.humidity}%
                </Text>
              </View>
              <View style={styles.weatherDetail}>
                <SafeIcon name="airplane" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.weatherDetailText, { color: theme.colors.textSecondary }]}>
                  {currentWeather.windSpeed} km/h
                </Text>
              </View>
            </View>
          </View>

          {forecast.length > 0 && (
            <View style={styles.forecastContainer}>
              <Text style={[styles.forecastTitle, { color: theme.colors.text }]}>
                {t('forecast')}
              </Text>
              {forecast.map((item, index) => (
                <View
                  key={index}
                  style={[styles.forecastItem, { backgroundColor: theme.colors.surface }]}
                >
                  <Text style={[styles.forecastDate, { color: theme.colors.text }]}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.forecastCondition, { color: theme.colors.textSecondary }]}>
                    {item.condition}
                  </Text>
                  <Text style={[styles.forecastTemp, { color: theme.colors.text }]}>
                    {item.temperature.min}° / {item.temperature.max}°
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  searchContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  searchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  currentWeather: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  condition: {
    fontSize: 18,
    marginBottom: 16,
  },
  weatherDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherDetailText: {
    fontSize: 14,
  },
  forecastContainer: {
    padding: 16,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  forecastDate: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  forecastCondition: {
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: '600',
  },
});


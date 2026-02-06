import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { externalAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

export const ExternalApiServicesScreen: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'weather' | 'maps' | 'flights' | 'hotels'>('weather');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [flightSearchData, setFlightSearchData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: '1',
  });
  const [hotelSearchData, setHotelSearchData] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
  });
  const tabStyles = useMemo(
    () => ({
      activeTab: { backgroundColor: theme.colors.primary },
      activeText: { color: '#FFFFFF' },
      inactiveText: { color: theme.colors.text },
    }),
    [theme.colors.primary, theme.colors.text],
  );

  const handleGetWeather = async () => {
    try {
      setLoading(true);
      // Use default location (Cairo) for demo
      const response = await externalAPI.getCurrentWeather(30.0444, 31.2357);
      setWeatherData(response.data || response);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم تحميل بيانات الطقس',
      });
    } catch (error: any) {
      console.error('Error searching flights:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل بيانات الطقس',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFlights = async () => {
    if (!flightSearchData.origin || !flightSearchData.destination || !flightSearchData.departureDate) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      setLoading(true);
      await externalAPI.searchFlights({
        origin: flightSearchData.origin,
        destination: flightSearchData.destination,
        departureDate: flightSearchData.departureDate,
        returnDate: flightSearchData.returnDate || undefined,
        passengers: parseInt(flightSearchData.passengers, 10) || 1,
      });
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم البحث عن الرحلات',
      });
      // Handle flight results
    } catch (error: any) {
      console.error('Error searching hotels:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل البحث عن الرحلات',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchHotels = async () => {
    if (!hotelSearchData.location || !hotelSearchData.checkIn || !hotelSearchData.checkOut) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      setLoading(true);
      await externalAPI.searchHotels({
        location: hotelSearchData.location,
        checkIn: hotelSearchData.checkIn,
        checkOut: hotelSearchData.checkOut,
        guests: parseInt(hotelSearchData.guests, 10) || 1,
      });
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم البحث عن الفنادق',
      });
      // Handle hotel results
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل البحث عن الفنادق',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>خدمات خارجية</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          استخدم خدمات الطقس والخرائط والرحلات والفنادق
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'weather' && tabStyles.activeTab,
          ]}
          onPress={() => setActiveTab('weather')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'weather' ? tabStyles.activeText : tabStyles.inactiveText,
            ]}
          >
            الطقس
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'maps' && tabStyles.activeTab,
          ]}
          onPress={() => setActiveTab('maps')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'maps' ? tabStyles.activeText : tabStyles.inactiveText,
            ]}
          >
            الخرائط
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'flights' && tabStyles.activeTab,
          ]}
          onPress={() => setActiveTab('flights')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'flights' ? tabStyles.activeText : tabStyles.inactiveText,
            ]}
          >
            الرحلات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'hotels' && tabStyles.activeTab,
          ]}
          onPress={() => setActiveTab('hotels')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'hotels' ? tabStyles.activeText : tabStyles.inactiveText,
            ]}
          >
            الفنادق
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'weather' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>الطقس الحالي</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleGetWeather}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <SafeIcon name="wb-sunny" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>الحصول على الطقس</Text>
                </>
              )}
            </TouchableOpacity>
            {weatherData && (
              <View style={styles.weatherInfo}>
                <Text style={[styles.weatherTemp, { color: theme.colors.text }]}>
                  {weatherData.temperature || weatherData.temp}°C
                </Text>
                <Text style={[styles.weatherDescription, { color: theme.colors.textSecondary }]}>
                  {weatherData.description || weatherData.condition}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'flights' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>بحث عن الرحلات</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>من *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                value={flightSearchData.origin}
                onChangeText={(text) => setFlightSearchData({ ...flightSearchData, origin: text })}
                placeholder="مطار المغادرة"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>إلى *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                value={flightSearchData.destination}
                onChangeText={(text) => setFlightSearchData({ ...flightSearchData, destination: text })}
                placeholder="مطار الوصول"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>تاريخ المغادرة *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                value={flightSearchData.departureDate}
                onChangeText={(text) => setFlightSearchData({ ...flightSearchData, departureDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>تاريخ العودة</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                value={flightSearchData.returnDate}
                onChangeText={(text) => setFlightSearchData({ ...flightSearchData, returnDate: text })}
                placeholder="YYYY-MM-DD (اختياري)"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSearchFlights}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <SafeIcon name="flight" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>بحث</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'hotels' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>بحث عن الفنادق</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>الموقع *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                value={hotelSearchData.location}
                onChangeText={(text) => setHotelSearchData({ ...hotelSearchData, location: text })}
                placeholder="المدينة أو الموقع"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>تاريخ الوصول *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                value={hotelSearchData.checkIn}
                onChangeText={(text) => setHotelSearchData({ ...hotelSearchData, checkIn: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>تاريخ المغادرة *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                value={hotelSearchData.checkOut}
                onChangeText={(text) => setHotelSearchData({ ...hotelSearchData, checkOut: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSearchHotels}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <SafeIcon name="hotel" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>بحث</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'maps' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>خدمات الخرائط</Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              يمكنك استخدام خدمات الخرائط للحصول على تفاصيل الأماكن والاتجاهات
            </Text>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
              <SafeIcon name="map" size={24} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                هذه الخدمات متاحة عبر API في الباك اند. يمكن دمجها في شاشات أخرى حسب الحاجة.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  weatherInfo: {
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  weatherTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  weatherDescription: {
    fontSize: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});


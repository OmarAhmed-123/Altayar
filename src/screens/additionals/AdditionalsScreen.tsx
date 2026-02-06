import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './../../hooks/useTheme';
import { API } from './../../services/apiClient';
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import { SafeIcon } from './../../utils/iconHelper';
import Toast from 'react-native-toast-message';

interface Additional {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export const AdditionalsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [additionals, setAdditionals] = useState<Additional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdditionals = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await API.additional.getAdditionals();
      const additionalsData = Array.isArray(response) ? response : (response.data || []);
      setAdditionals(additionalsData);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل الخدمات الإضافية',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdditionals();
  }, [loadAdditionals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAdditionals();
  }, [loadAdditionals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const renderAdditional = ({ item }: { item: Additional }) => (
    <TouchableOpacity
      style={[styles.additionalCard, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
        <SafeIcon
          name={item.icon || 'add-circle'}
          size={32}
          color={theme.colors.primary}
        />
      </View>
      
      <View style={styles.additionalInfo}>
        <Text style={[styles.additionalName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={[styles.additionalDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.additionalFooter}>
          <Text style={[styles.additionalCategory, { color: theme.colors.textSecondary }]}>
            {item.category}
          </Text>
          <Text style={[styles.additionalPrice, { color: theme.colors.primary }]}>
            {formatCurrency(item.price)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل الخدمات الإضافية..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SafeIcon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>الخدمات الإضافية</Text>
        <View style={styles.placeholder} />
      </View>

      {additionals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <SafeIcon name="add-circle" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            لا توجد خدمات إضافية متاحة
          </Text>
        </View>
      ) : (
        <FlatList
          data={additionals}
          renderItem={renderAdditional}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  additionalCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  additionalInfo: {
    flex: 1,
  },
  additionalName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  additionalDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  additionalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalCategory: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  additionalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});


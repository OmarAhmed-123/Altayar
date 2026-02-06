import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { travelCompanionAPI } from './../../services/apiClient';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
}

interface Itinerary {
  id: number;
  title: string;
  checklist?: ChecklistItem[];
}

export const TravelChecklistScreen: React.FC = () => {
  const { theme } = useTheme();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    loadItineraries();
  }, []);

  const loadItineraries = async () => {
    try {
      setLoading(true);
      const response = await travelCompanionAPI.getUserItineraries({ status: 'upcoming' });
      const itinerariesData = response.data || response || [];
      setItineraries(Array.isArray(itinerariesData) ? itinerariesData : []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل البرامج السياحية',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleChecklistItem = async (itineraryId: number, itemId: string, completed: boolean) => {
    try {
      await travelCompanionAPI.updateChecklistItem(itineraryId, itemId, !completed);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: completed ? 'تم إلغاء إتمام المهمة' : 'تم إتمام المهمة',
      });
      loadItineraries();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحديث المهمة',
      });
    }
  };

  const getProgress = (checklist: ChecklistItem[] = []) => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>قوائم المهام</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadItineraries();
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        {itineraries.map((itinerary) => {
          const checklist = itinerary.checklist || [];
          const progress = getProgress(checklist);
          const isSelected = selectedItinerary?.id === itinerary.id;

          return (
            <View key={itinerary.id} style={[styles.itineraryCard, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity
                style={styles.itineraryHeader}
                onPress={() => setSelectedItinerary(isSelected ? null : itinerary)}
              >
                <View style={styles.itineraryInfo}>
                  <Text style={[styles.itineraryTitle, { color: theme.colors.text }]}>
                    {itinerary.title}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress}%`, backgroundColor: theme.colors.primary },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                      {progress}%
                    </Text>
                  </View>
                </View>
                <SafeIcon
                  name={isSelected ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              {isSelected && checklist.length > 0 && (
                <View style={styles.checklistContainer}>
                  {checklist.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checklistItem,
                        { borderBottomColor: theme.colors.border },
                      ]}
                      onPress={() => handleToggleChecklistItem(itinerary.id, item.id, item.completed)}
                    >
                      <View style={styles.checklistItemContent}>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: item.completed
                                ? theme.colors.primary
                                : 'transparent',
                              borderColor: item.completed
                                ? theme.colors.primary
                                : theme.colors.border,
                            },
                          ]}
                        >
                          {item.completed && (
                            <SafeIcon name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.checklistItemText,
                            {
                              color: item.completed
                                ? theme.colors.textSecondary
                                : theme.colors.text,
                              textDecorationLine: item.completed ? 'line-through' : 'none',
                            },
                          ]}
                        >
                          {item.title}
                        </Text>
                      </View>
                      {item.category && (
                        <View
                          style={[
                            styles.categoryBadge,
                            { backgroundColor: theme.colors.primary + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            {item.category}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itineraryCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  itineraryInfo: {
    flex: 1,
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
  checklistContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  checklistItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistItemText: {
    fontSize: 16,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
});


import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from './../../hooks/useTheme';
import { reportService } from './../../services/reportService';
import Toast from 'react-native-toast-message';
import { SafeIcon } from './../../utils/iconHelper';

const normalizeResponse = <T,>(
  payload: T | { data?: T } | null | undefined,
): T | null => {
  if (payload === null || payload === undefined) {
    return null;
  }
  if (typeof payload === 'object' && 'data' in payload && (payload as any).data !== undefined) {
    return (payload as any).data as T;
  }
  return payload as T;
};

export const UserReportScreen: React.FC = () => {
  const { theme } = useTheme();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportService.getUserReportData();
      const data = normalizeResponse(response);
      setReportData(data);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل تحميل بيانات التقرير',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      const result = await reportService.generateUserReport();
      
      // For React Native, we need to handle the blob differently
      // This is a placeholder - in production, use a library like react-native-fs
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: typeof result === 'string'
          ? 'تم إنشاء رابط التقرير بنجاح'
          : 'تم إنشاء ملف التقرير بنجاح',
      });
      
      // TODO: Implement PDF download/sharing using react-native-fs or similar solution
      // const filePath = `${RNFS.DocumentDirectoryPath}/user-report.pdf`;
      // await RNFS.writeFile(filePath, typeof result === 'string' ? result : blobData, 'base64');
      // await Share.share({ url: `file://${filePath}` });
      
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error.message || 'فشل إنشاء التقرير',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>تقرير المستخدم</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            ملخص شامل لجميع أنشطتك
          </Text>
        </View>

        {reportData && (
          <>
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>الحجوزات</Text>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  إجمالي الحجوزات
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportData.totalBookings || 0}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  الحجوزات المؤكدة
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {reportData.confirmedBookings || 0}
                </Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>المعاملات</Text>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  إجمالي الإنفاق
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportData.totalSpent || 0} EGP
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  النقاط المكتسبة
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {reportData.totalPoints || 0}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  الكاش باك
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {reportData.totalCashback || 0} EGP
                </Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>التقييمات</Text>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  عدد التقييمات
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {reportData.totalReviews || 0}
                </Text>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.pdfButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleGeneratePDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <SafeIcon name="picture-as-pdf" size={24} color="#FFFFFF" />
              <Text style={styles.pdfButtonText}>تحميل التقرير PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  header: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from './../../hooks/useTheme';
// Mock data removed - using real backend data only
import { LoadingSpinner } from './../../components/common/LoadingSpinner';
import Svg, { Path, Text as SvgText, G } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: ChartData[];
  textColor: string;
  containerStyle: StyleProp<ViewStyle>;
  emptyTextStyle: StyleProp<TextStyle>;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  textColor,
  containerStyle,
  emptyTextStyle,
}) => {
  if (!data.length) {
    return (
      <View style={containerStyle}>
        <Text style={emptyTextStyle}>لا توجد بيانات لعرضها حالياً</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value)) || 1;
  const chartWidth = screenWidth - 80;
  const chartHeight = 200;
  const barWidth = chartWidth / data.length - 10;

  return (
    <View style={containerStyle}>
      <Svg width={chartWidth} height={chartHeight}>
        {data.map((item, index) => {
          const barHeight = maxValue === 0 ? 0 : (item.value / maxValue) * (chartHeight - 40);
          const x = index * (barWidth + 10) + 5;
          const y = chartHeight - barHeight - 20;

          return (
            <G key={item.label}>
              <Path
                d={`M ${x} ${chartHeight - 20} L ${x + barWidth} ${chartHeight - 20} L ${x + barWidth} ${y} L ${x} ${y} Z`}
                fill={item.color}
              />
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 5}
                fontSize="12"
                fill={textColor}
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={y - 5}
                fontSize="12"
                fill={textColor}
                textAnchor="middle"
                fontWeight="bold"
              >
                {item.value.toLocaleString()}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

interface PieChartProps {
  data: ChartData[];
  containerStyle: StyleProp<ViewStyle>;
  legendContainerStyle: StyleProp<ViewStyle>;
  legendItemStyle: StyleProp<ViewStyle>;
  legendColorStyle: StyleProp<ViewStyle>;
  legendTextStyle: StyleProp<TextStyle>;
  emptyTextStyle: StyleProp<TextStyle>;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  containerStyle,
  legendContainerStyle,
  legendItemStyle,
  legendColorStyle,
  legendTextStyle,
  emptyTextStyle,
}) => {
  const size = 250;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 80;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data.length || total === 0) {
    return (
      <View style={containerStyle}>
        <Text style={emptyTextStyle}>لا توجد بيانات لعرضها حالياً</Text>
      </View>
    );
  }

  let currentAngle = -90;

  const paths = data.map(item => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    currentAngle = endAngle;

    const labelAngle = (startAngle + angle / 2) * (Math.PI / 180);
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    return { pathData, color: item.color, label: item.label, percentage, labelX, labelY };
  });

  return (
    <View style={containerStyle}>
      <Svg width={size} height={size}>
        {paths.map(path => (
          <G key={path.label}>
            <Path d={path.pathData} fill={path.color} />
            <SvgText
              x={path.labelX}
              y={path.labelY}
              fontSize="12"
              fill="#FFFFFF"
              textAnchor="middle"
              fontWeight="bold"
            >
              {Math.round(path.percentage * 100)}%
            </SvgText>
          </G>
        ))}
      </Svg>
      <View style={legendContainerStyle}>
        {data.map(item => (
          <View key={item.label} style={legendItemStyle}>
            <View style={[legendColorStyle, { backgroundColor: item.color }]} />
            <Text style={legendTextStyle}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const AnalyticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalTrips: 0,
    totalReviews: 0,
    monthlyData: [] as ChartData[],
    categoryData: [] as ChartData[],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Use real backend API - load analytics from backend
      // TODO: Implement real analytics API endpoint
      // For now, use empty data structure
      setAnalyticsData({
        totalBookings: 0,
        totalRevenue: 0,
        totalTrips: 0,
        totalReviews: 0,
        monthlyData: [],
        categoryData: [],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.xl,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      marginRight: '2%',
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    chartSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    chartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: theme.spacing.md,
    },
    emptyChartText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    legendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: theme.spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    legendColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: theme.spacing.xs,
    },
    legendText: {
      fontSize: 14,
      color: theme.colors.text,
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل التحليلات..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>التحليلات والإحصائيات</Text>
          <Text style={styles.subtitle}>عرض شامل لجميع البيانات والإحصائيات</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>إجمالي الحجوزات</Text>
            <Text style={styles.statValue}>{analyticsData.totalBookings}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>إجمالي الإيرادات</Text>
            <Text style={styles.statValue}>{analyticsData.totalRevenue.toLocaleString()} EGP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>إجمالي الرحلات</Text>
            <Text style={styles.statValue}>{analyticsData.totalTrips}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>إجمالي التقييمات</Text>
            <Text style={styles.statValue}>{analyticsData.totalReviews}</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>الإيرادات الشهرية</Text>
          <BarChart
            data={analyticsData.monthlyData}
            textColor={theme.colors.text}
            containerStyle={styles.chartContainer}
            emptyTextStyle={styles.emptyChartText}
          />
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>التوزيع حسب الفئة</Text>
          <PieChart
            data={analyticsData.categoryData}
            containerStyle={styles.chartContainer}
            legendContainerStyle={styles.legendContainer}
            legendItemStyle={styles.legendItem}
            legendColorStyle={styles.legendColor}
            legendTextStyle={styles.legendText}
            emptyTextStyle={styles.emptyChartText}
          />
        </View>
      </ScrollView>
    </View>
  );
};


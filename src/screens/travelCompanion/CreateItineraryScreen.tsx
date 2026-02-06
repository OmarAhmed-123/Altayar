import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../hooks/useTheme';
import { SafeIcon } from '../../utils/iconHelper';
import { travelCompanionAPI } from '../../services/apiClient';
import { tripService } from '../../services/tripService';
import type { ProfileScreenProps } from '../../types/navigation';

type Props = ProfileScreenProps<'CreateItinerary'>;

type Option = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  pricePerNight?: number;
  partner?: string;
};

const DESTINATION_OPTIONS = [
  { id: 'cairo', name: 'القاهرة التاريخية', description: 'جولات الأهرامات ومتحف الحضارة' },
  { id: 'luxor', name: 'الأقصر الملكية', description: 'وادي الملوك ورحلات البالون' },
  { id: 'aswan', name: 'أسوان الساحرة', description: 'فلوكات النيل وزيارة فيلة' },
  { id: 'sharm', name: 'شرم الشيخ', description: 'رياضات مائية ورحلات بحرية' },
];

const ACCOMMODATION_OPTIONS: Option[] = [
  {
    id: 'nileRoyal',
    name: 'فندق النيل الملكي',
    description: 'غرفة مطلة على النيل مع إفطار',
    pricePerNight: 950,
    partner: 'Royal Nile Hotels',
  },
  {
    id: 'oldPalace',
    name: 'منتجع القصر القديم',
    description: 'إقامة كاملة مع دخول الشاطئ الخاص',
    pricePerNight: 1250,
    partner: 'Old Palace Resorts',
  },
  {
    id: 'ecoCamp',
    name: 'مخيم بيئي صحراوي',
    description: 'تجربة صحراوية مع عشاء بدوي',
    pricePerNight: 600,
    partner: 'Desert Echo',
  },
];

const ACTIVITY_OPTIONS: Option[] = [
  { id: 'pyramids', name: 'جولة VIP للأهرامات', price: 420, partner: 'Altayar Experiences' },
  { id: 'nileCruise', name: 'رحلة عشاء في نهر النيل', price: 350, partner: 'Nile Delights' },
  { id: 'diving', name: 'غوص في البحر الأحمر', price: 650, partner: 'Red Sea Divers' },
  { id: 'balloon', name: 'منطاد الأقصر', price: 800, partner: 'Luxor Skies' },
];

const TRANSPORT_OPTIONS: Option[] = [
  { id: 'privateDriver', name: 'سائق خاص طوال الرحلة', price: 320, partner: 'Altayar Chauffeur' },
  { id: 'airportMeet', name: 'استقبال المطار وخدمة VIP', price: 180, partner: 'Airport Elite' },
  { id: 'domesticFlight', name: 'تذاكر طيران داخلية', price: 900, partner: 'Altayar Air' },
];

const MEAL_OPTIONS: Option[] = [
  { id: 'fullBoard', name: 'باقة وجبات كاملة', price: 140 },
  { id: 'fineDining', name: 'عشاء فاخر لشخصين', price: 480 },
  { id: 'streetFood', name: 'جولة أطعمة محلية', price: 220 },
];

const CreateItineraryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    title: route.params?.suggestedDestinations?.[0] ? `رحلة إلى ${route.params.suggestedDestinations[0]}` : '',
    description: '',
    startDate: route.params?.defaultStartDate || '',
    endDate: route.params?.defaultEndDate || '',
    isGroupTrip: false,
    travellersCount: 2,
  });

  const [notes, setNotes] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    route.params?.suggestedDestinations || [],
  );
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customActivities, setCustomActivities] = useState<Option[]>([]);
  const [selectedTransportation, setSelectedTransportation] = useState<string[]>(['privateDriver']);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [shareAfterCreate, setShareAfterCreate] = useState(true);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [pendingMember, setPendingMember] = useState('');
  const [customActivityName, setCustomActivityName] = useState('');
  const [customActivityPrice, setCustomActivityPrice] = useState('');

  const steps = [
    'المعلومات الأساسية',
    'الوجهات والأنشطة',
    'الإقامة والانتقالات',
    'المراجعة والتكلفة',
  ];

  const parsedDates = useMemo(() => {
    const start = new Date(basicInfo.startDate);
    const end = new Date(basicInfo.endDate);
    return {
      start: isNaN(start.getTime()) ? null : start,
      end: isNaN(end.getTime()) ? null : end,
    };
  }, [basicInfo.startDate, basicInfo.endDate]);

  const nights = useMemo(() => {
    if (!parsedDates.start || !parsedDates.end) return 0;
    const diff = parsedDates.end.getTime() - parsedDates.start.getTime();
    if (diff <= 0) return 0;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [parsedDates]);

  const accommodationsCost = useMemo(() => {
    return selectedAccommodations.reduce((sum, id) => {
      const option = ACCOMMODATION_OPTIONS.find(item => item.id === id);
      if (!option || !option.pricePerNight) return sum;
      return sum + option.pricePerNight * Math.max(1, nights) * Math.max(1, basicInfo.travellersCount);
    }, 0);
  }, [selectedAccommodations, nights, basicInfo.travellersCount]);

  const activityCost = useMemo(() => {
    const bundled = [
      ...selectedActivities
        .map(id => ACTIVITY_OPTIONS.find(item => item.id === id))
        .filter(Boolean) as Option[],
      ...customActivities,
    ];
    return bundled.reduce((sum, option) => sum + (option.price || 0) * Math.max(1, basicInfo.travellersCount), 0);
  }, [selectedActivities, customActivities, basicInfo.travellersCount]);

  const transportationCost = useMemo(() => {
    return selectedTransportation.reduce((sum, id) => {
      const option = TRANSPORT_OPTIONS.find(item => item.id === id);
      return sum + (option?.price || 0);
    }, 0);
  }, [selectedTransportation]);

  const mealsCost = useMemo(() => {
    return selectedMeals.reduce((sum, id) => {
      const option = MEAL_OPTIONS.find(item => item.id === id);
      return sum + (option?.price || 0) * Math.max(1, nights) * Math.max(1, basicInfo.travellersCount);
    }, 0);
  }, [selectedMeals, nights, basicInfo.travellersCount]);

  const estimatedCost = useMemo(() => {
    return accommodationsCost + activityCost + transportationCost + mealsCost;
  }, [accommodationsCost, activityCost, transportationCost, mealsCost]);

  const formatCurrency = (value: number) =>
    `${value.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ريال`;

  const toggleSelection = (value: string, selected: string[], setter: (next: string[]) => void) => {
    setter(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return (
        !!basicInfo.title &&
        !!basicInfo.startDate &&
        !!basicInfo.endDate &&
        (!parsedDates.start || !parsedDates.end || parsedDates.end >= parsedDates.start)
      );
    }
    if (currentStep === 1) {
      return selectedDestinations.length > 0;
    }
    if (currentStep === 2) {
      return selectedAccommodations.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      Alert.alert('تنبيه', 'يرجى استكمال بيانات هذه الخطوة قبل المتابعة.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigation.goBack();
      return;
    }
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const addGroupMember = () => {
    if (!pendingMember.trim()) return;
    setGroupMembers(prev => [...prev, pendingMember.trim()]);
    setPendingMember('');
  };

  const removeGroupMember = (name: string) => {
    setGroupMembers(prev => prev.filter(item => item !== name));
  };

  const addCustomActivity = (name: string, priceValue: string) => {
    if (!name || !priceValue) return;
    const price = Number(priceValue);
    if (isNaN(price) || price <= 0) {
      Toast.show({ type: 'error', text1: 'خطأ', text2: 'يرجى إدخال تكلفة صحيحة للنشاط.' });
      return;
    }
    setCustomActivities(prev => [
      ...prev,
      { id: `custom-${prev.length + 1}`, name, price },
    ]);
  };

  const buildChecklist = () => {
    const base = [
      { id: 'documents', title: 'مراجعة الوثائق الشخصية', completed: false },
      { id: 'payments', title: 'تأكيد المدفوعات', completed: false },
    ];
    const activityItems = [...selectedActivities, ...customActivities.map(item => item.id)].map(id => ({
      id: `activity-${id}`,
      title: `تحضير نشاط (${id})`,
      completed: false,
    }));
    return [...base, ...activityItems];
  };

  const handleSaveDraft = async () => {
    if (!canProceed() || !basicInfo.title) {
      Alert.alert('تنبيه', 'يرجى إدخال المعلومات الأساسية قبل حفظ المسودة.');
      return;
    }
    setIsSavingDraft(true);
    try {
      await tripService.createTrip({
        title: basicInfo.title,
        description: basicInfo.description || 'رحلة مخصصة من Altayar VIP',
        startDate: basicInfo.startDate,
        endDate: basicInfo.endDate,
        destinations: selectedDestinations.length ? selectedDestinations : ['غير محدد'],
        isPublic: basicInfo.isGroupTrip,
      });
      Toast.show({
        type: 'success',
        text1: 'تم الحفظ',
        text2: 'تم حفظ الرحلة كمسودة ويمكنك الرجوع لإكمالها لاحقاً.',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل حفظ المسودة',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      Alert.alert('تنبيه', 'يرجى إكمال جميع الحقول المطلوبة.');
      return;
    }
    setIsSubmitting(true);
    try {
      const itineraryPayload = {
        title: basicInfo.title,
        description: basicInfo.description || notes,
        startDate: basicInfo.startDate,
        endDate: basicInfo.endDate,
        destinations: selectedDestinations,
        activities: [
          ...selectedActivities
            .map(id => ACTIVITY_OPTIONS.find(item => item.id === id))
            .filter(Boolean),
          ...customActivities,
        ],
        accommodations: selectedAccommodations
          .map(id => ACCOMMODATION_OPTIONS.find(item => item.id === id))
          .filter(Boolean),
        transportation: selectedTransportation
          .map(id => TRANSPORT_OPTIONS.find(item => item.id === id))
          .filter(Boolean),
        meals: selectedMeals.map(id => MEAL_OPTIONS.find(item => item.id === id)).filter(Boolean),
        emergencyContacts: groupMembers.map(name => ({ name, relation: 'Group Member' })),
        checklist: buildChecklist(),
      };

      const itineraryResponse = await travelCompanionAPI.createCustomItinerary(itineraryPayload as any);
      const createdItinerary = itineraryResponse?.data || itineraryResponse;
      if (shareAfterCreate && createdItinerary?.id) {
        await travelCompanionAPI.shareItinerary(createdItinerary.id, true);
      }

      Toast.show({
        type: 'success',
        text1: 'تم إنشاء الرحلة',
        text2: 'تم إنشاء البرنامج السياحي بنجاح',
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل إنشاء الرحلة',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDestinationOptions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>اختر الوجهات</Text>
      <View style={styles.optionGrid}>
        {DESTINATION_OPTIONS.map(option => {
          const selected = selectedDestinations.includes(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                { borderColor: selected ? theme.colors.primary : theme.colors.border },
              ]}
              onPress={() => toggleSelection(option.id, selectedDestinations, setSelectedDestinations)}
            >
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{option.name}</Text>
              <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                {option.description}
              </Text>
              {selected && (
                <View style={[styles.optionBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Text style={[styles.optionBadgeText, { color: theme.colors.primary }]}>محدد</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderMultiSelectOptions = (
    title: string,
    options: Option[],
    selected: string[],
    setter: (next: string[]) => void,
    showPrice = true,
  ) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {options.map(option => {
        const isSelected = selected.includes(option.id);
        const priceLabel = option.pricePerNight
          ? `${formatCurrency(option.pricePerNight)} / ليلة`
          : option.price
          ? formatCurrency(option.price)
          : undefined;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionRow,
              {
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                backgroundColor: isSelected ? theme.colors.primary + '08' : theme.colors.surface,
              },
            ]}
            onPress={() => toggleSelection(option.id, selected, setter)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{option.name}</Text>
              {option.description && (
                <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                  {option.description}
                </Text>
              )}
              {option.partner && (
                <Text style={[styles.partnerLabel, { color: theme.colors.textSecondary }]}>
                  شريك: {option.partner}
                </Text>
              )}
            </View>
            {showPrice && priceLabel && (
              <Text style={[styles.optionPrice, { color: theme.colors.primary }]}>{priceLabel}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>المعلومات الأساسية</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="عنوان الرحلة"
                placeholderTextColor={theme.colors.textSecondary}
                value={basicInfo.title}
                onChangeText={text => setBasicInfo(prev => ({ ...prev, title: text }))}
              />
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="وصف مختصر (اختياري)"
                placeholderTextColor={theme.colors.textSecondary}
                value={basicInfo.description}
                onChangeText={text => setBasicInfo(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
              <View style={styles.inlineInputs}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inlineInput,
                    { borderColor: theme.colors.border, color: theme.colors.text },
                  ]}
                  placeholder="تاريخ البداية (YYYY-MM-DD)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={basicInfo.startDate}
                  onChangeText={text => setBasicInfo(prev => ({ ...prev, startDate: text }))}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.inlineInput,
                    { borderColor: theme.colors.border, color: theme.colors.text },
                  ]}
                  placeholder="تاريخ النهاية"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={basicInfo.endDate}
                  onChangeText={text => setBasicInfo(prev => ({ ...prev, endDate: text }))}
                />
              </View>
              <View style={styles.inlineInputs}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inlineInput,
                    { borderColor: theme.colors.border, color: theme.colors.text },
                  ]}
                  placeholder="عدد المسافرين"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  value={String(basicInfo.travellersCount)}
                  onChangeText={text =>
                    setBasicInfo(prev => ({
                      ...prev,
                      travellersCount: Math.max(1, Number(text) || 1),
                    }))
                  }
                />
                <View style={[styles.optionRow, { borderWidth: 0 }]}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>رحلة جماعية؟</Text>
                  <Switch
                    value={basicInfo.isGroupTrip}
                    onValueChange={value => setBasicInfo(prev => ({ ...prev, isGroupTrip: value }))}
                    thumbColor={basicInfo.isGroupTrip ? theme.colors.primary : '#f4f3f4'}
                  />
                </View>
              </View>
            </View>
            {basicInfo.isGroupTrip && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>أعضاء الرحلة</Text>
                <View style={styles.inlineInputs}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inlineInput,
                      { borderColor: theme.colors.border, color: theme.colors.text },
                    ]}
                    placeholder="اسم العضو"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={pendingMember}
                    onChangeText={setPendingMember}
                  />
                  <TouchableOpacity
                    style={[styles.addMemberButton, { backgroundColor: theme.colors.primary }]}
                    onPress={addGroupMember}
                  >
                    <SafeIcon name="person-add" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagContainer}>
                  {groupMembers.map(name => (
                    <View key={name} style={[styles.tag, { backgroundColor: theme.colors.primary + '15' }]}>
                      <Text style={[styles.tagText, { color: theme.colors.primary }]}>{name}</Text>
                      <TouchableOpacity onPress={() => removeGroupMember(name)}>
                        <SafeIcon name="close" size={14} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      case 1:
        return (
          <View>
            {renderDestinationOptions()}
            {renderMultiSelectOptions('الأنشطة المختارة', ACTIVITY_OPTIONS, selectedActivities, setSelectedActivities)}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>نشاط مخصص</Text>
              <View style={styles.inlineInputs}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inlineInput,
                    { borderColor: theme.colors.border, color: theme.colors.text },
                  ]}
                  placeholder="اسم النشاط"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={customActivityName}
                  onChangeText={setCustomActivityName}
                />
              </View>
              <View style={styles.inlineInputs}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inlineInput,
                    { borderColor: theme.colors.border, color: theme.colors.text },
                  ]}
                  placeholder="التكلفة"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  value={customActivityPrice}
                  onChangeText={setCustomActivityPrice}
                />
                <TouchableOpacity
                  style={[styles.addMemberButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    addCustomActivity(customActivityName.trim(), customActivityPrice.trim());
                    setCustomActivityName('');
                    setCustomActivityPrice('');
                  }}
                >
                  <SafeIcon name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {customActivities.map(activity => (
                  <View key={activity.id} style={[styles.tag, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                      {activity.name} • {formatCurrency(activity.price || 0)}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setCustomActivities(prev => prev.filter(item => item.id !== activity.id))
                      }
                    >
                      <SafeIcon name="close" size={14} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            {renderMultiSelectOptions('الإقامة', ACCOMMODATION_OPTIONS, selectedAccommodations, setSelectedAccommodations)}
            {renderMultiSelectOptions('وسائل النقل', TRANSPORT_OPTIONS, selectedTransportation, setSelectedTransportation)}
            {renderMultiSelectOptions('الوجبات والإضافات', MEAL_OPTIONS, selectedMeals, setSelectedMeals)}
          </View>
        );
      case 3:
      default:
        return (
          <View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>مراجعة الرحلة</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>العنوان</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{basicInfo.title || '-'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>التواريخ</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{basicInfo.startDate || '-'} → {basicInfo.endDate || '-'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>المسافرون</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {basicInfo.travellersCount} شخص{basicInfo.travellersCount > 1 ? 'اً' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>التكلفة التقديرية</Text>
              <View style={styles.costRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>الإقامة</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(accommodationsCost)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>الأنشطة</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(activityCost)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>النقل</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(transportationCost)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>الوجبات</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(mealsCost)}</Text>
              </View>
              <View style={[styles.costRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 8, paddingTop: 12 }]}>
                <Text style={[styles.summaryLabel, { color: theme.colors.primary, fontWeight: 'bold' }]}>الإجمالي</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>{formatCurrency(estimatedCost)}</Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>خيارات إضافية</Text>
              <View style={styles.optionRow}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>مشاركة الرحلة بعد الإنشاء</Text>
                <Switch
                  value={shareAfterCreate}
                  onValueChange={setShareAfterCreate}
                  thumbColor={shareAfterCreate ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="ملاحظات أو تعليمات خاصة (اختياري)"
                placeholderTextColor={theme.colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
          <SafeIcon name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>إنشاء برنامج رحلة</Text>
        <TouchableOpacity onPress={handleSaveDraft} style={styles.headerIcon}>
          <SafeIcon
            name={isSavingDraft ? 'hourglass' : 'save'}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.stepper}>
        {steps.map((label, index) => (
          <View key={label} style={styles.stepperItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor:
                    index === currentStep
                      ? theme.colors.primary
                      : index < currentStep
                      ? theme.colors.success
                      : theme.colors.border,
                },
              ]}
            >
              <Text style={styles.stepCircleText}>{index + 1}</Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color:
                    index === currentStep
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {renderStepContent()}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleBack}
        >
          <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>
            {currentStep === 0 ? 'إلغاء' : 'رجوع'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.footerButton,
            {
              backgroundColor:
                currentStep === steps.length - 1 ? theme.colors.success : theme.colors.primary,
            },
          ]}
          onPress={currentStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={isSubmitting}
        >
          <Text style={[styles.footerButtonText, { color: '#FFFFFF' }]}>
            {currentStep === steps.length - 1 ? (isSubmitting ? 'جارٍ الإنشاء...' : 'إنهاء') : 'التالي'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepperItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineInput: {
    flex: 1,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    flexBasis: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  partnerLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  optionBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addMemberButton: {
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  footerButton: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CreateItineraryScreen;


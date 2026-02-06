import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
  ComponentType,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import type { DrawerNavigationOptions } from '@react-navigation/drawer';
import type { BottomTabBarButtonProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { getIconImageUrls } from './../utils/imageUtils';
import { ensureStringUri } from './../utils/imageUriHelper';
import { SafeIcon } from './../utils/iconHelper';
import { ProfileTabButton } from './../components/navigation/ProfileTabButton';

// Auth Screens
import { LoginScreen } from './../screens/auth/LoginScreen';
import { RegisterScreen } from './../screens/auth/RegisterScreen';
import { SplashScreen } from './../screens/SplashScreen';

// Home Screens
import { HomeScreen } from './../screens/home/HomeScreen';
import { PackageDetailsScreen } from './../screens/packages/PackageDetailsScreen';
import { PackagesScreen } from './../screens/packages/PackagesScreen';

// Booking Screens
import { BookingsScreen } from './../screens/bookings/BookingsScreen';
import { BookingDetailsScreen } from './../screens/bookings/BookingDetailsScreen';

// Profile Screens
import { ProfileScreen } from './../screens/profile/ProfileScreen';
import { EditProfileScreen } from './../screens/profile/EditProfileScreen';
import { ReportPreviewScreen } from './../screens/report/ReportPreviewScreen';

// Membership Screens
import { MembershipsScreen } from './../screens/memberships/MembershipsScreen';
import { MembershipCardScreen } from './../screens/memberships/MembershipCardScreen';

// Other Screens
import { TripsScreen } from './../screens/trips/TripsScreen';
import { ReviewsScreen } from './../screens/reviews/ReviewsScreen';
import { NotificationsScreen } from './../screens/notifications/NotificationsScreen';
import { SettingsScreen } from './../screens/settings/SettingsScreen';
import { ColorThemeScreen } from './../screens/settings/ColorThemeScreen';
import { LanguageScreen } from './../screens/settings/LanguageScreen';
import { DebugScreen } from './../screens/debug/DebugScreen';
import { OffersScreen } from './../screens/offers/OffersScreen';
import { InboxScreen } from './../screens/inbox/InboxScreen';
import { MoreScreen } from './../screens/more/MoreScreen';
import { PaymentStepsScreen } from './../screens/payments/PaymentStepsScreen';
import { PaymentWebViewScreen } from './../screens/payments/PaymentWebViewScreen';
import { PaymentStatsScreen } from './../screens/payments/PaymentStatsScreen';
import { QRCodeScreen } from './../screens/qrcode/QRCodeScreen';
import { AnalyticsScreen } from './../screens/analytics/AnalyticsScreen';
import { AdminDashboardScreen } from './../screens/admin/AdminDashboardScreen';
import { UsersManagementScreen } from './../screens/admin/UsersManagementScreen';

// New Screens
import { BlogsScreen } from './../screens/blogs/BlogsScreen';
import { BlogDetailsScreen } from './../screens/blogs/BlogDetailsScreen';
import { ChatsListScreen } from './../screens/chat/ChatsListScreen';
import { ChatScreen } from './../screens/chat/ChatScreen';
import { DocumentsScreen } from './../screens/documents/DocumentsScreen';
import { AffiliatesScreen } from './../screens/affiliates/AffiliatesScreen';
import { TravelCompanionScreen } from './../screens/travelCompanion/TravelCompanionScreen';

// Partner Portal Screens
import { PartnerApplicationScreen } from './../screens/partners/PartnerApplicationScreen';
import { PartnersListScreen } from './../screens/partners/PartnersListScreen';
import { PartnerServicesScreen } from './../screens/partners/PartnerServicesScreen';

// Marketing Screens
import { MarketingDashboardScreen } from './../screens/marketing/MarketingDashboardScreen';
import { MarketingCampaignsScreen } from './../screens/marketing/MarketingCampaignsScreen';

// Sales Screens
import { SalesQuotationsScreen } from './../screens/sales/SalesQuotationsScreen';

// Geolocation Screens
import { VisitedLocationsScreen } from './../screens/geolocation/VisitedLocationsScreen';
import { TravelStatisticsScreen } from './../screens/geolocation/TravelStatisticsScreen';

// External API Screens
import { WeatherScreen } from './../screens/external/WeatherScreen';

// Vouchers Screens
import { VouchersScreen } from './../screens/vouchers/VouchersScreen';

// Transactions Screens
import { TransactionsHistoryScreen } from './../screens/transactions/TransactionsHistoryScreen';

// Admin Management Screens
import { AdsManagementScreen } from './../screens/admin/AdsManagementScreen';
import { CommentsManagementScreen } from './../screens/admin/CommentsManagementScreen';
import { TransactionsManagementScreen } from './../screens/admin/TransactionsManagementScreen';
import { VouchersManagementScreen } from './../screens/admin/VouchersManagementScreen';
import { PackagesManagementScreen } from './../screens/admin/PackagesManagementScreen';
import { BookingsManagementScreen } from './../screens/admin/BookingsManagementScreen';
import { MembershipsManagementScreen } from './../screens/admin/MembershipsManagementScreen';
import { BlogsManagementScreen } from './../screens/admin/BlogsManagementScreen';
import { ReviewsManagementScreen } from './../screens/admin/ReviewsManagementScreen';
import { SettingsManagementScreen } from './../screens/admin/SettingsManagementScreen';
import { LocalizationManagementScreen } from './../screens/admin/LocalizationManagementScreen';
import { MarketingAutomationScreen } from './../screens/admin/MarketingAutomationScreen';
import { ExternalApiIntegrationsScreen } from './../screens/admin/ExternalApiIntegrationsScreen';
import { FileManagementStatisticsScreen } from './../screens/admin/FileManagementStatisticsScreen';
import { RecommendationsAnalyticsScreen } from './../screens/admin/RecommendationsAnalyticsScreen';
import { AffiliateCampaignsManagementScreen } from './../screens/admin/AffiliateCampaignsManagementScreen';
import { PartnerServicesManagementScreen } from './../screens/admin/PartnerServicesManagementScreen';
import { TripsManagementScreen } from './../screens/admin/TripsManagementScreen';
import { DocumentsManagementScreen } from './../screens/admin/DocumentsManagementScreen';
import { ChatConversationsManagementScreen } from './../screens/admin/ChatConversationsManagementScreen';
import { NotificationsManagementScreen } from './../screens/admin/NotificationsManagementScreen';
import { TravelCompanionItinerariesManagementScreen } from './../screens/admin/TravelCompanionItinerariesManagementScreen';
import { DashboardAnalyticsScreen } from './../screens/admin/DashboardAnalyticsScreen';

// Settings Screens
import { UserPreferencesScreen } from './../screens/settings/UserPreferencesScreen';
import { OAuthProvidersScreen } from './../screens/settings/OAuthProvidersScreen';

// Affiliates Screens
import { AffiliateEarningsScreen } from './../screens/affiliates/AffiliateEarningsScreen';
import { AffiliatePayoutRequestsScreen } from './../screens/affiliates/AffiliatePayoutRequestsScreen';

// Recommendations Screens
import { RecommendationsScreen } from './../screens/recommendations/RecommendationsScreen';

// Files Screens
import { FileDownloadsScreen } from './../screens/files/FileDownloadsScreen';
import { FileUploadScreen } from './../screens/files/FileUploadScreen';

// Recommendations Screens
import { RecommendationPreferencesScreen } from './../screens/recommendations/RecommendationPreferencesScreen';

// Payments Screens
import { PaymentMethodsScreen } from './../screens/payments/PaymentMethodsScreen';

// Report Screens
import { UserReportScreen } from './../screens/report/UserReportScreen';

// Travel Companion Screens
import { TravelItinerariesScreen } from './../screens/travelCompanion/TravelItinerariesScreen';
import { TravelDocumentsScreen } from './../screens/travelCompanion/TravelDocumentsScreen';
import { TravelChecklistScreen } from './../screens/travelCompanion/TravelChecklistScreen';
import CreateItineraryScreen from './../screens/travelCompanion/CreateItineraryScreen';

// Partner Screens
import { PartnerServicesBookingScreen } from './../screens/partners/PartnerServicesBookingScreen';
import { PartnerBookingsScreen } from './../screens/partners/PartnerBookingsScreen';

// External API Screens
import { ExternalApiServicesScreen } from './../screens/external/ExternalApiServicesScreen';

// Invoice Screen
import { InvoiceScreen } from './../screens/invoice/InvoiceScreen';

// Reels Screen
import { ReelsScreen } from './../screens/reels/ReelsScreen';
import { CreateReelScreen } from './../screens/reels/CreateReelScreen';
import { ImagePreviewScreen } from './../screens/reels/ImagePreviewScreen';

// Additionals Screen
import { AdditionalsScreen } from './../screens/additionals/AdditionalsScreen';

// Static Marketing Screens
import { AboutScreen } from './../screens/static/AboutScreen';
import { ContactScreen } from './../screens/static/ContactScreen';
import { TermsScreen } from './../screens/static/TermsScreen';
import { PrivacyPolicyScreen } from './../screens/static/PrivacyPolicyScreen';

import { notificationService } from './../services/notificationService';
import { useTheme } from './../hooks/useTheme';
import { useAuthStore } from './../stores/authStore';
import type {
  AuthStackParamList,
  HomeStackParamList,
  BookingsStackParamList,
  TripsStackParamList,
  ProfileStackParamList,
  TabParamList,
  DrawerParamList,
} from './../types/navigation';

type TabBarButtonRenderer = NonNullable<BottomTabNavigationOptions['tabBarButton']>;

const ProfileTabBarButton: TabBarButtonRenderer = _props => (
  <View style={styles.profileTabButtonWrapper}>
    <ProfileTabButton />
  </View>
);

interface DrawerContentViewProps extends DrawerContentComponentProps {
  drawerIcons: Record<string, string | number>;
  unreadCount: number;
}

const DrawerContentView: React.FC<DrawerContentViewProps> = ({
  drawerIcons,
  unreadCount,
  ...drawerProps
}) => {
  const { navigation } = drawerProps;
  const { theme } = useTheme();

  return (
    <View style={styles.drawerContentContainer}>
      <View style={[styles.drawerHeader, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <NotificationIconWithBadge
            icon={drawerIcons.notifications}
            color="#FFFFFF"
            size={24}
            badgeColor={theme.colors.error}
            unreadCount={unreadCount}
            badgeStyle={styles.badge}
            badgeTextStyle={styles.badgeText}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qrCodeButton}
          onPress={() => navigation.navigate('QRCode')}
        >
          {renderIconElement(drawerIcons['qr-code'], 'qr-code', '#FFFFFF', 24)}
        </TouchableOpacity>
      </View>
      <DrawerContentScrollView
        {...drawerProps}
        contentContainerStyle={styles.drawerScrollContent}
      >
        <DrawerItemList {...drawerProps} />
      </DrawerContentScrollView>
    </View>
  );
};

const Stack = createStackNavigator<AuthStackParamList>();
type IconSourceValue = string | number | undefined;
type DrawerIconProps = { color: string; size: number; focused: boolean };

interface DrawerIconRendererProps extends DrawerIconProps {
  iconKey: string;
  fallback: string;
}

type DrawerIconFunction = (props: DrawerIconProps) => React.ReactNode;

const renderIconElement = (
  iconValue: IconSourceValue,
  fallback: string,
  color: string,
  size: number,
) => {
  if (iconValue) {
    if (typeof iconValue === 'number') {
      return <Image source={iconValue} style={[styles.iconSize, { width: size, height: size }]} resizeMode="contain" />;
    }
    const iconUri = ensureStringUri(iconValue);
    if (iconUri) {
      return <Image source={{ uri: iconUri }} style={[styles.iconSize, { width: size, height: size }]} resizeMode="contain" />;
    }
  }
  return <SafeIcon name={fallback} size={size} color={color} />;
};

interface NotificationIconWithBadgeProps {
  icon: IconSourceValue;
  color: string;
  size: number;
  badgeColor: string;
  unreadCount: number;
  badgeStyle: StyleProp<ViewStyle>;
  badgeTextStyle: StyleProp<TextStyle>;
}

const NotificationIconWithBadge: React.FC<NotificationIconWithBadgeProps> = ({
  icon,
  color,
  size,
  badgeColor,
  unreadCount,
  badgeStyle,
  badgeTextStyle,
}) => (
  <View style={styles.notificationIconWrapper}>
    {renderIconElement(icon, 'notifications', color, size)}
    {unreadCount > 0 && (
      <View style={[badgeStyle, { backgroundColor: badgeColor }]}>
        <Text style={badgeTextStyle}>{unreadCount > 99 ? '99+' : unreadCount.toString()}</Text>
      </View>
    )}
  </View>
);

const TabIconContext = createContext<Record<string, string | number>>({});
const DrawerIconContext = createContext<Record<string, string | number>>({});
const DrawerBadgeContext = createContext<{ unreadCount: number; badgeColor: string }>({
  unreadCount: 0,
  badgeColor: '#FF0000',
});

type ElevatedRole =
  | 'super_admin'
  | 'admin'
  | 'accountant'
  | 'hr'
  | 'data_entry'
  | 'sales'
  | 'reservations';
type DrawerRole = ElevatedRole | 'customer' | string;

type DrawerScreenConfig = {
  name: keyof DrawerParamList;
  component: ComponentType<any>;
  options: DrawerNavigationOptions;
  allowedRoles?: DrawerRole[];
  listeners?: Record<string, (event: any) => void>;
};

const tabIconNameMap: Record<string, string> = {
  Home: 'home',
  Offers: 'local-offer',
  Profile: 'person',
  Inbox: 'mail',
  More: 'menu',
};

interface TabIconRendererProps {
  routeName: string;
  color: string;
  size: number;
}

const TabBarIconRenderer: React.FC<TabIconRendererProps> = ({ routeName, color, size }) => {
  const tabIcons = useContext(TabIconContext);
  const iconName = tabIconNameMap[routeName] || 'home';
  const iconSource = routeName === 'Home' ? tabIcons.home : tabIcons[iconName];

  return renderIconElement(iconSource, iconName, color, size);
};

type TabIconFunction = NonNullable<BottomTabNavigationOptions['tabBarIcon']>;

const createTabBarIcon = (routeName: keyof typeof tabIconNameMap): TabIconFunction =>
  ({ color, size }) =>
    <TabBarIconRenderer routeName={routeName} color={color} size={size} />;

const tabBarIconHandlers: Record<'Home' | 'Offers' | 'Profile' | 'Inbox' | 'More', TabIconFunction> = {
  Home: createTabBarIcon('Home'),
  Offers: createTabBarIcon('Offers'),
  Profile: () => null,
  Inbox: createTabBarIcon('Inbox'),
  More: createTabBarIcon('More'),
};

const tabScreenOptionsMap: Record<'Home' | 'Offers' | 'Profile' | 'Inbox' | 'More', BottomTabNavigationOptions> = {
  Home: {
    tabBarLabel: 'Home',
    tabBarIcon: tabBarIconHandlers.Home,
  },
  Offers: {
    tabBarLabel: 'Offers',
    tabBarIcon: tabBarIconHandlers.Offers,
  },
  Profile: {
    tabBarLabel: '',
    tabBarIcon: tabBarIconHandlers.Profile,
    tabBarButton: ProfileTabBarButton,
  },
  Inbox: {
    tabBarLabel: 'Inbox',
    tabBarIcon: tabBarIconHandlers.Inbox,
  },
  More: {
    tabBarLabel: 'More',
    tabBarIcon: tabBarIconHandlers.More,
  },
};

const DrawerIconRendererComponent: React.FC<DrawerIconRendererProps> = ({
  iconKey,
  fallback,
  color,
  size,
}) => {
  const drawerIcons = useContext(DrawerIconContext);
  return renderIconElement(drawerIcons[iconKey], fallback, color, size);
};

const createDrawerIcon = (iconKey: string, fallback: string): DrawerIconFunction =>
  props => <DrawerIconRendererComponent iconKey={iconKey} fallback={fallback} {...props} />;

const NotificationDrawerIconRenderer: DrawerIconFunction = ({ color, size }) => {
  const drawerIcons = useContext(DrawerIconContext);
  const { unreadCount, badgeColor } = useContext(DrawerBadgeContext);

  return (
    <NotificationIconWithBadge
      icon={drawerIcons.notifications}
      color={color}
      size={size}
      badgeColor={badgeColor}
      unreadCount={unreadCount}
      badgeStyle={styles.badge}
      badgeTextStyle={styles.badgeText}
    />
  );
};

const standardDrawerIconHandlers = {
  home: createDrawerIcon('home', 'home'),
  star: createDrawerIcon('star', 'star'),
  book: createDrawerIcon('book', 'book'),
  membership: createDrawerIcon('card-membership', 'card-membership'),
  flight: createDrawerIcon('flight', 'flight'),
  settings: createDrawerIcon('settings', 'settings'),
  language: createDrawerIcon('language', 'language'),
  palette: createDrawerIcon('palette', 'palette'),
  payment: createDrawerIcon('payment', 'payment'),
  chart: createDrawerIcon('bar-chart', 'bar-chart'),
  analytics: createDrawerIcon('analytics', 'analytics'),
  qr: createDrawerIcon('qr-code', 'qr-code'),
  mail: createDrawerIcon('mail', 'mail'),
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconSize: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  notificationButton: {
    padding: 8,
  },
  qrCodeButton: {
    padding: 8,
  },
  profileTabButtonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: '50%',
    marginLeft: -35,
    top: -25,
    zIndex: 1000,
  },
  drawerContentContainer: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingTop: 0,
  },
  notificationIconWrapper: {
    position: 'relative',
  },
});

const createSafeIconRenderer = (iconName: string) =>
  ({ color, size }: DrawerIconProps) =>
    <SafeIcon name={iconName} size={size} color={color} />;

const staticDrawerIconRenderers = {
  adminPanel: createSafeIconRenderer('admin-panel-settings'),
  people: createSafeIconRenderer('people'),
  receipt: createSafeIconRenderer('receipt'),
  calculator: createSafeIconRenderer('calculator'),
  localOffer: createSafeIconRenderer('local-offer'),
  documentText: createSafeIconRenderer('document-text'),
  airplane: createSafeIconRenderer('airplane'),
  document: createSafeIconRenderer('document'),
  book: createSafeIconRenderer('book'),
  membership: createSafeIconRenderer('card-membership'),
  giftCard: createSafeIconRenderer('card-giftcard'),
  chatBubbles: createSafeIconRenderer('chatbubbles'),
  business: createSafeIconRenderer('business'),
  star: createSafeIconRenderer('star'),
  megaphone: createSafeIconRenderer('megaphone'),
  location: createSafeIconRenderer('location'),
  statsChart: createSafeIconRenderer('stats-chart'),
  partlySunny: createSafeIconRenderer('partly-sunny'),
  analytics: createSafeIconRenderer('analytics'),
  info: createSafeIconRenderer('information-circle'),
  shield: createSafeIconRenderer('shield-checkmark'),
  phone: createSafeIconRenderer('call'),
};

const HomeStack = createStackNavigator<HomeStackParamList>();
const BookingsStack = createStackNavigator<BookingsStackParamList>();
const TripsStack = createStackNavigator<TripsStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
    initialRouteName="Splash"
  >
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen name="PackageDetails" component={PackageDetailsScreen} />
    <HomeStack.Screen name="Packages" component={PackagesScreen} />
    <HomeStack.Screen name="Blogs" component={BlogsScreen} />
    <HomeStack.Screen name="BlogDetails" component={BlogDetailsScreen} />
  </HomeStack.Navigator>
);

const BookingsStackNavigator = () => (
  <BookingsStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <BookingsStack.Screen name="BookingsMain" component={BookingsScreen} />
    <BookingsStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
    <BookingsStack.Screen name="Invoice" component={InvoiceScreen} />
  </BookingsStack.Navigator>
);

const TripsStackNavigator = () => (
  <TripsStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <TripsStack.Screen name="TripsMain" component={TripsScreen} />
  </TripsStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="Memberships" component={MembershipsScreen} />
    <ProfileStack.Screen name="MembershipCard" component={MembershipCardScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="ColorTheme" component={ColorThemeScreen} />
    <ProfileStack.Screen name="Language" component={LanguageScreen} />
    <ProfileStack.Screen name="About" component={AboutScreen} />
    <ProfileStack.Screen name="Contact" component={ContactScreen} />
    <ProfileStack.Screen name="Terms" component={TermsScreen} />
    <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <ProfileStack.Screen name="Debug" component={DebugScreen} />
    <ProfileStack.Screen name="ReportPreview" component={ReportPreviewScreen} />
    <ProfileStack.Screen name="Documents" component={DocumentsScreen} />
    <ProfileStack.Screen name="Affiliates" component={AffiliatesScreen} />
    <ProfileStack.Screen name="TravelCompanion" component={TravelCompanionScreen} />
    <ProfileStack.Screen name="ChatsList" component={ChatsListScreen} />
    <ProfileStack.Screen name="Chat" component={ChatScreen} />
    <ProfileStack.Screen name="PartnerApplication" component={PartnerApplicationScreen} />
    <ProfileStack.Screen name="PartnersList" component={PartnersListScreen} />
    <ProfileStack.Screen name="PartnerServices" component={PartnerServicesScreen} />
    <ProfileStack.Screen name="VisitedLocations" component={VisitedLocationsScreen} />
    <ProfileStack.Screen name="TravelStatistics" component={TravelStatisticsScreen} />
    <ProfileStack.Screen name="Weather" component={WeatherScreen} />
    <ProfileStack.Screen name="Vouchers" component={VouchersScreen} />
    <ProfileStack.Screen name="TransactionsHistory" component={TransactionsHistoryScreen} />
    <ProfileStack.Screen name="UsersManagement" component={UsersManagementScreen} />
    <ProfileStack.Screen name="AdsManagement" component={AdsManagementScreen} />
    <ProfileStack.Screen name="CommentsManagement" component={CommentsManagementScreen} />
    <ProfileStack.Screen name="TransactionsManagement" component={TransactionsManagementScreen} />
    <ProfileStack.Screen name="VouchersManagement" component={VouchersManagementScreen} />
    <ProfileStack.Screen name="PackagesManagement" component={PackagesManagementScreen} />
    <ProfileStack.Screen name="BookingsManagement" component={BookingsManagementScreen} />
    <ProfileStack.Screen name="MembershipsManagement" component={MembershipsManagementScreen} />
    <ProfileStack.Screen name="BlogsManagement" component={BlogsManagementScreen} />
    <ProfileStack.Screen name="ReviewsManagement" component={ReviewsManagementScreen} />
    <ProfileStack.Screen name="UserPreferences" component={UserPreferencesScreen} />
    <ProfileStack.Screen name="OAuthProviders" component={OAuthProvidersScreen} />
    <ProfileStack.Screen name="AffiliateEarnings" component={AffiliateEarningsScreen} />
    <ProfileStack.Screen name="Recommendations" component={RecommendationsScreen} />
    <ProfileStack.Screen name="FileDownloads" component={FileDownloadsScreen} />
    <ProfileStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    <ProfileStack.Screen name="UserReport" component={UserReportScreen} />
    <ProfileStack.Screen name="FileUpload" component={FileUploadScreen} />
    <ProfileStack.Screen name="TravelItineraries" component={TravelItinerariesScreen} />
    <ProfileStack.Screen name="CreateItinerary" component={CreateItineraryScreen} />
    <ProfileStack.Screen name="TravelDocuments" component={TravelDocumentsScreen} />
    <ProfileStack.Screen name="TravelChecklist" component={TravelChecklistScreen} />
    <ProfileStack.Screen name="RecommendationPreferences" component={RecommendationPreferencesScreen} />
    <ProfileStack.Screen name="AffiliatePayoutRequests" component={AffiliatePayoutRequestsScreen} />
    <ProfileStack.Screen name="PartnerServicesBooking" component={PartnerServicesBookingScreen} />
    <ProfileStack.Screen name="ExternalApiServices" component={ExternalApiServicesScreen} />
    <ProfileStack.Screen name="SettingsManagement" component={SettingsManagementScreen} />
    <ProfileStack.Screen name="LocalizationManagement" component={LocalizationManagementScreen} />
    <ProfileStack.Screen name="MarketingAutomation" component={MarketingAutomationScreen} />
    <ProfileStack.Screen name="ExternalApiIntegrations" component={ExternalApiIntegrationsScreen} />
    <ProfileStack.Screen name="FileManagementStatistics" component={FileManagementStatisticsScreen} />
    <ProfileStack.Screen name="RecommendationsAnalytics" component={RecommendationsAnalyticsScreen} />
    <ProfileStack.Screen name="AffiliateCampaignsManagement" component={AffiliateCampaignsManagementScreen} />
    <ProfileStack.Screen name="PartnerServicesManagement" component={PartnerServicesManagementScreen} />
    <ProfileStack.Screen name="TripsManagement" component={TripsManagementScreen} />
    <ProfileStack.Screen name="DocumentsManagement" component={DocumentsManagementScreen} />
    <ProfileStack.Screen name="ChatConversationsManagement" component={ChatConversationsManagementScreen} />
    <ProfileStack.Screen name="NotificationsManagement" component={NotificationsManagementScreen} />
    <ProfileStack.Screen name="TravelCompanionItinerariesManagement" component={TravelCompanionItinerariesManagementScreen} />
    <ProfileStack.Screen name="DashboardAnalytics" component={DashboardAnalyticsScreen} />
    <ProfileStack.Screen name="PartnerBookings" component={PartnerBookingsScreen} />
    <ProfileStack.Screen name="MarketingCampaigns" component={MarketingCampaignsScreen} />
    <ProfileStack.Screen name="Invoice" component={InvoiceScreen} />
    <ProfileStack.Screen name="Reels" component={ReelsScreen} />
    <ProfileStack.Screen name="CreateReel" component={CreateReelScreen} />
    <ProfileStack.Screen name="ImagePreview" component={ImagePreviewScreen} />
    <ProfileStack.Screen name="BlogDetails" component={BlogDetailsScreen} />
    <ProfileStack.Screen name="Additionals" component={AdditionalsScreen} />
    <ProfileStack.Screen 
      name="PaymentWebView" 
      component={PaymentWebViewScreen}
      options={{
        headerShown: false,
        presentation: 'modal',
      }}
    />
  </ProfileStack.Navigator>
);

const MainTabs = () => {
  const { theme } = useTheme();
  const [tabIcons, setTabIcons] = useState<Record<string, string | number>>({});

  useEffect(() => {
    const loadTabIcons = async () => {
      try {
        const icons = ['local-offer', 'person', 'mail', 'menu'];
        const images = await getIconImageUrls(icons, 24, 24);
        setTabIcons({
          ...images,
          home: require('./../assets/images/icon.png'),
        });
      } catch (error) {
        console.error('Error loading tab icons:', error);
        setTabIcons({
          home: require('./../assets/images/icon.png'),
        });
      }
    };
    loadTabIcons();
  }, []);

  const sharedTabOptions = useMemo<BottomTabNavigationOptions>(
    () => ({
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: theme.colors.border,
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
        position: 'relative',
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600' as TextStyle['fontWeight'],
      } as TextStyle,
      headerShown: false,
    }),
    [theme.colors.border, theme.colors.primary, theme.colors.textSecondary],
  );

  return (
    <TabIconContext.Provider value={tabIcons}>
      <Tab.Navigator screenOptions={sharedTabOptions}>
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={tabScreenOptionsMap.Home}
        />
        <Tab.Screen
          name="Offers"
          component={OffersScreen}
          options={tabScreenOptionsMap.Offers}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={tabScreenOptionsMap.Profile}
        />
        <Tab.Screen
          name="Inbox"
          component={InboxScreen}
          options={tabScreenOptionsMap.Inbox}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={tabScreenOptionsMap.More}
        />
      </Tab.Navigator>
    </TabIconContext.Provider>
  );
};

const MainDrawer = () => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const normalizedRole: DrawerRole = (user?.role as DrawerRole) || 'customer';
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerIcons, setDrawerIcons] = useState<Record<string, string | number>>({});
  const drawerContentRenderer = useCallback(
    (drawerProps: DrawerContentComponentProps) => (
      <DrawerContentView
        {...drawerProps}
        drawerIcons={drawerIcons}
        unreadCount={unreadCount}
      />
    ),
    [drawerIcons, unreadCount],
  );

  useEffect(() => {
    const loadDrawerIcons = async () => {
      try {
        const icons = ['home', 'notifications', 'star', 'book', 'card-membership', 'flight', 'settings', 'language', 'palette', 'payment', 'bar-chart', 'qr-code', 'analytics'];
        const images = await getIconImageUrls(icons, 24, 24);
        // Use local icon for home
        setDrawerIcons({
          ...images,
          home: require('./../assets/images/icon.png'),
        });
      } catch (error) {
        console.error('Error loading drawer icons:', error);
        setDrawerIcons({
          home: require('./../assets/images/icon.png'),
        });
      }
    };
    loadDrawerIcons();
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      const count = (response as any).data?.unreadCount || (response as any).unreadCount || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const handleNotificationsFocus = useCallback(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const drawerScreenConfigs = useMemo<DrawerScreenConfig[]>(
    () => [
      {
        name: 'MainTabs',
        component: MainTabs,
        options: {
          drawerLabel: 'الرئيسية',
          drawerIcon: standardDrawerIconHandlers.home,
        },
      },
      {
        name: 'Notifications',
        component: NotificationsScreen,
        options: {
          drawerLabel: 'الإشعارات',
          drawerIcon: NotificationDrawerIconRenderer,
        },
        listeners: {
          focus: handleNotificationsFocus,
        },
      },
      {
        name: 'Reviews',
        component: ReviewsScreen,
        options: {
          drawerLabel: 'التقييمات',
          drawerIcon: standardDrawerIconHandlers.star,
        },
      },
      {
        name: 'Bookings',
        component: BookingsStackNavigator,
        options: {
          drawerLabel: 'الحجوزات',
          drawerIcon: standardDrawerIconHandlers.book,
        },
      },
      {
        name: 'Memberships',
        component: MembershipsScreen,
        options: {
          drawerLabel: 'العضويات',
          drawerIcon: standardDrawerIconHandlers.membership,
        },
      },
      {
        name: 'Trips',
        component: TripsStackNavigator,
        options: {
          drawerLabel: 'الرحلات',
          drawerIcon: standardDrawerIconHandlers.flight,
        },
      },
      {
        name: 'Settings',
        component: SettingsScreen,
        options: {
          drawerLabel: 'الإعدادات',
          drawerIcon: standardDrawerIconHandlers.settings,
        },
      },
      {
        name: 'Language',
        component: LanguageScreen,
        options: {
          drawerLabel: 'اللغة',
          drawerIcon: standardDrawerIconHandlers.language,
        },
      },
      {
        name: 'ColorTheme',
        component: ColorThemeScreen,
        options: {
          drawerLabel: 'المظهر',
          drawerIcon: standardDrawerIconHandlers.palette,
        },
      },
      {
        name: 'PaymentSteps',
        component: PaymentStepsScreen,
        options: {
          drawerLabel: 'خطوات الدفع',
          drawerIcon: standardDrawerIconHandlers.payment,
        },
      },
      {
        name: 'PaymentWebView',
        component: PaymentWebViewScreen,
        options: {
          drawerLabel: 'صفحة الدفع',
          drawerIcon: standardDrawerIconHandlers.payment,
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        },
      },
      {
        name: 'PaymentStats',
        component: PaymentStatsScreen,
        options: {
          drawerLabel: 'إحصائيات الدفع',
          drawerIcon: standardDrawerIconHandlers.chart,
        },
        allowedRoles: ['super_admin', 'admin', 'accountant'],
      },
      {
        name: 'Analytics',
        component: AnalyticsScreen,
        options: {
          drawerLabel: 'التحليلات',
          drawerIcon: standardDrawerIconHandlers.analytics,
        },
        allowedRoles: ['super_admin', 'admin', 'accountant'],
      },
      {
        name: 'AdminDashboard',
        component: AdminDashboardScreen,
        options: {
          drawerLabel: 'لوحة الأدمن',
          drawerIcon: staticDrawerIconRenderers.adminPanel,
        },
        allowedRoles: ['super_admin', 'admin'],
      },
      {
        name: 'HRUsersManagement',
        component: UsersManagementScreen,
        options: {
          drawerLabel: 'لوحة HR - المستخدمون',
          drawerIcon: staticDrawerIconRenderers.people,
        },
        allowedRoles: ['hr'],
      },
      {
        name: 'AccountingTransactions',
        component: TransactionsHistoryScreen,
        options: {
          drawerLabel: 'حركة المعاملات',
          drawerIcon: staticDrawerIconRenderers.receipt,
        },
        allowedRoles: ['accountant', 'sales'],
      },
      {
        name: 'AccountingTransactionsManagement',
        component: TransactionsManagementScreen,
        options: {
          drawerLabel: 'إدارة المعاملات',
          drawerIcon: staticDrawerIconRenderers.calculator,
        },
        allowedRoles: ['accountant', 'sales'],
      },
      {
        name: 'DataEntryPackages',
        component: PackagesManagementScreen,
        options: {
          drawerLabel: 'إدخال الباقات',
          drawerIcon: staticDrawerIconRenderers.localOffer,
        },
        allowedRoles: ['data_entry'],
      },
      {
        name: 'DataEntryBlogs',
        component: BlogsManagementScreen,
        options: {
          drawerLabel: 'إدخال المدونات',
          drawerIcon: staticDrawerIconRenderers.documentText,
        },
        allowedRoles: ['data_entry'],
      },
      {
        name: 'DataEntryTrips',
        component: TripsManagementScreen,
        options: {
          drawerLabel: 'إدخال الرحلات',
          drawerIcon: staticDrawerIconRenderers.airplane,
        },
        allowedRoles: ['data_entry'],
      },
      {
        name: 'DataEntryDocuments',
        component: DocumentsManagementScreen,
        options: {
          drawerLabel: 'إدخال المستندات',
          drawerIcon: staticDrawerIconRenderers.document,
        },
        allowedRoles: ['data_entry'],
      },
      {
        name: 'AgentBookingsManagement',
        component: BookingsManagementScreen,
        options: {
          drawerLabel: 'حجوزات العملاء',
          drawerIcon: staticDrawerIconRenderers.book,
        },
        allowedRoles: ['sales', 'reservations'],
      },
      {
        name: 'AgentMembershipsManagement',
        component: MembershipsManagementScreen,
        options: {
          drawerLabel: 'عضويات العملاء',
          drawerIcon: staticDrawerIconRenderers.membership,
        },
        allowedRoles: ['sales', 'reservations'],
      },
      {
        name: 'AgentVouchersManagement',
        component: VouchersManagementScreen,
        options: {
          drawerLabel: 'قسائم العملاء',
          drawerIcon: staticDrawerIconRenderers.giftCard,
        },
        allowedRoles: ['sales', 'reservations'],
      },
      {
        name: 'SalesQuotations',
        component: SalesQuotationsScreen,
        options: {
          drawerLabel: 'عروض الأسعار',
          drawerIcon: staticDrawerIconRenderers.documentText,
        },
        allowedRoles: ['sales', 'reservations'],
      },
      {
        name: 'QRCode',
        component: QRCodeScreen,
        options: {
          drawerLabel: 'QR Code العضوية',
          drawerIcon: standardDrawerIconHandlers.qr,
        },
      },
      {
        name: 'MembershipCard',
        component: MembershipCardScreen,
        options: {
          drawerLabel: 'بطاقة العضوية',
          drawerIcon: standardDrawerIconHandlers.membership,
        },
      },
      {
        name: 'Blogs',
        component: BlogsScreen,
        options: {
          drawerLabel: 'المدونات',
          drawerIcon: staticDrawerIconRenderers.documentText,
        },
      },
      {
        name: 'About',
        component: AboutScreen,
        options: {
          drawerLabel: 'من نحن',
          drawerIcon: staticDrawerIconRenderers.info,
        },
      },
      {
        name: 'Contact',
        component: ContactScreen,
        options: {
          drawerLabel: 'تواصل معنا',
          drawerIcon: staticDrawerIconRenderers.phone,
        },
      },
      {
        name: 'Terms',
        component: TermsScreen,
        options: {
          drawerLabel: 'الشروط والأحكام',
          drawerIcon: staticDrawerIconRenderers.document,
        },
      },
      {
        name: 'PrivacyPolicy',
        component: PrivacyPolicyScreen,
        options: {
          drawerLabel: 'سياسة الخصوصية',
          drawerIcon: staticDrawerIconRenderers.shield,
        },
      },
      {
        name: 'Chat',
        component: ChatsListScreen,
        options: {
          drawerLabel: 'المحادثات',
          drawerIcon: staticDrawerIconRenderers.chatBubbles,
        },
      },
      {
        name: 'Documents',
        component: DocumentsScreen,
        options: {
          drawerLabel: 'المستندات',
          drawerIcon: staticDrawerIconRenderers.document,
        },
      },
      {
        name: 'Affiliates',
        component: AffiliatesScreen,
        options: {
          drawerLabel: 'الإحالات',
          drawerIcon: staticDrawerIconRenderers.people,
        },
      },
      {
        name: 'TravelCompanion',
        component: TravelCompanionScreen,
        options: {
          drawerLabel: 'رفقة السفر',
          drawerIcon: staticDrawerIconRenderers.airplane,
        },
      },
      {
        name: 'PartnerApplication',
        component: PartnerApplicationScreen,
        options: {
          drawerLabel: 'تطبيق شراكة',
          drawerIcon: staticDrawerIconRenderers.business,
        },
      },
      {
        name: 'PartnersList',
        component: PartnersListScreen,
        options: {
          drawerLabel: 'قائمة الشركاء',
          drawerIcon: staticDrawerIconRenderers.people,
        },
      },
      {
        name: 'PartnerServices',
        component: PartnerServicesScreen,
        options: {
          drawerLabel: 'خدمات الشركاء',
          drawerIcon: staticDrawerIconRenderers.star,
        },
      },
      {
        name: 'MarketingDashboard',
        component: MarketingDashboardScreen,
        options: {
          drawerLabel: 'لوحة التسويق',
          drawerIcon: staticDrawerIconRenderers.megaphone,
        },
      },
      {
        name: 'VisitedLocations',
        component: VisitedLocationsScreen,
        options: {
          drawerLabel: 'المواقع المزارة',
          drawerIcon: staticDrawerIconRenderers.location,
        },
      },
      {
        name: 'TravelStatistics',
        component: TravelStatisticsScreen,
        options: {
          drawerLabel: 'إحصائيات السفر',
          drawerIcon: staticDrawerIconRenderers.statsChart,
        },
      },
      {
        name: 'Weather',
        component: WeatherScreen,
        options: {
          drawerLabel: 'الطقس',
          drawerIcon: staticDrawerIconRenderers.partlySunny,
        },
      },
    ],
    [handleNotificationsFocus],
  );

  const visibleDrawerScreens = useMemo(
    () =>
      drawerScreenConfigs.filter(
        config =>
          !config.allowedRoles || config.allowedRoles.includes(normalizedRole),
      ),
    [drawerScreenConfigs, normalizedRole],
  );

  return (
    <DrawerIconContext.Provider value={drawerIcons}>
      <DrawerBadgeContext.Provider value={{ unreadCount, badgeColor: theme.colors.error }}>
        <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600' as TextStyle['fontWeight'],
        } as TextStyle,
        // Disable animations to avoid worklets issues
        drawerType: 'front',
        overlayColor: 'transparent',
        swipeEnabled: false,
      }}
        drawerContent={drawerContentRenderer}
      >
        {visibleDrawerScreens.map(screen => (
          <Drawer.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
            options={screen.options}
            listeners={screen.listeners as any}
          />
        ))}
      </Drawer.Navigator>
      </DrawerBadgeContext.Provider>
    </DrawerIconContext.Provider>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, loadUser } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Load user on mount - only once
    if (!hasInitialized) {
      const initializeAuth = async () => {
        try {
          await loadUser();
        } catch (error) {
          console.error('Error initializing auth:', error);
          // If loadUser fails, still allow navigation to proceed
          // User will be redirected to login if not authenticated
        } finally {
          // Always set initializing to false after a short delay
          // This ensures SplashScreen has time to show
          setTimeout(() => {
            setIsInitializing(false);
            setHasInitialized(true);
          }, 500);
        }
      };

      initializeAuth();
    }
  }, [loadUser, hasInitialized]);

  // Show loading screen only during initial load (not during normal loading or auth state changes)
  // This prevents refresh when login state changes
  if (isInitializing && !hasInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0078D4" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
};

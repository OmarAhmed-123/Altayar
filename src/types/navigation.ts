import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { CompositeScreenProps } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeMain: undefined;
  PackageDetails: { packageId: string };
  Packages: undefined;
  Blogs: undefined;
  BlogDetails: { blogId: string };
};

// Bookings Stack
export type BookingsStackParamList = {
  BookingsMain: undefined;
  BookingDetails: { bookingId: string };
  Invoice: { bookingId: string };
};

// Trips Stack
export type TripsStackParamList = {
  TripsMain: undefined;
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Memberships: undefined;
  MembershipCard: { membershipId: string };
  Settings: undefined;
  ColorTheme: undefined;
  Language: undefined;
  Debug: undefined;
  ReportPreview: undefined;
  Documents: undefined;
  Affiliates: undefined;
  TravelCompanion: undefined;
  ChatsList: undefined;
  Chat: { chatId?: string; userId?: string };
  PartnerApplication: undefined;
  PartnersList: undefined;
  PartnerServices: undefined;
  MarketingDashboard: undefined;
  VisitedLocations: undefined;
  TravelStatistics: undefined;
  Weather: undefined;
  Vouchers: undefined;
  TransactionsHistory: undefined;
  UsersManagement: undefined;
  AdsManagement: undefined;
  CommentsManagement: undefined;
  TransactionsManagement: undefined;
  VouchersManagement: undefined;
  PackagesManagement: undefined;
  BookingsManagement: undefined;
  MembershipsManagement: undefined;
  BlogsManagement: undefined;
  ReviewsManagement: undefined;
  UserPreferences: undefined;
  OAuthProviders: undefined;
  AffiliateEarnings: undefined;
  Recommendations: undefined;
  FileDownloads: undefined;
  PaymentMethods: undefined;
  UserReport: undefined;
  FileUpload: undefined;
  TravelItineraries: undefined;
  TravelDocuments: undefined;
  TravelChecklist: undefined;
  CreateItinerary: {
    suggestedDestinations?: string[];
    defaultStartDate?: string;
    defaultEndDate?: string;
  };
  RecommendationPreferences: undefined;
  AffiliatePayoutRequests: undefined;
  PartnerServicesBooking: undefined;
  ExternalApiServices: undefined;
  SettingsManagement: undefined;
  LocalizationManagement: undefined;
  MarketingAutomation: undefined;
  ExternalApiIntegrations: undefined;
  FileManagementStatistics: undefined;
  RecommendationsAnalytics: undefined;
  AffiliateCampaignsManagement: undefined;
  PartnerServicesManagement: undefined;
  TripsManagement: undefined;
  DocumentsManagement: undefined;
  ChatConversationsManagement: undefined;
  NotificationsManagement: undefined;
  TravelCompanionItinerariesManagement: undefined;
  DashboardAnalytics: undefined;
  PartnerBookings: undefined;
  MarketingCampaigns: undefined;
  ImagePreview: { imageUrl: string; title?: string };
  BlogDetails: { blogId: string };
  Invoice: { bookingId: string };
  Reels: undefined;
  CreateReel: undefined;
  Additionals: undefined;
  About: undefined;
  Contact: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  PaymentWebView: {
    paymentUrl: string;
    transactionId: number | null;
    amount?: number;
    onPaymentSuccess?: () => void;
    onPaymentFailed?: () => void;
  };
};

// Tab Navigator
export type TabParamList = {
  Home: undefined;
  Offers: undefined;
  Profile: undefined;
  Inbox: undefined;
  More: undefined;
};

// Drawer Navigator
export type DrawerParamList = {
  MainTabs: undefined;
  Notifications: undefined;
  Reviews: undefined;
  Bookings: undefined;
  Memberships: undefined;
  Trips: undefined;
  Settings: undefined;
  Language: undefined;
  ColorTheme: undefined;
  PaymentSteps: undefined;
  PaymentWebView: {
    paymentUrl: string;
    transactionId: number | null;
    amount?: number;
    onPaymentSuccess?: () => void;
    onPaymentFailed?: () => void;
  };
  PaymentStats: undefined;
  QRCode: undefined;
  MembershipCard: { membershipId: string };
  Analytics: undefined;
  AdminDashboard: undefined;
  Blogs: undefined;
  Chat: undefined;
  Documents: undefined;
  Affiliates: undefined;
  TravelCompanion: undefined;
  PartnerApplication: undefined;
  PartnersList: undefined;
  PartnerServices: undefined;
  MarketingDashboard: undefined;
  VisitedLocations: undefined;
  TravelStatistics: undefined;
  Weather: undefined;
  HRUsersManagement: undefined;
  AccountingTransactions: undefined;
  AccountingTransactionsManagement: undefined;
  DataEntryPackages: undefined;
  DataEntryBlogs: undefined;
  DataEntryTrips: undefined;
  DataEntryDocuments: undefined;
  AgentBookingsManagement: undefined;
  AgentMembershipsManagement: undefined;
  AgentVouchersManagement: undefined;
  SalesQuotations: undefined;
  Invoice: { bookingId: string };
  Reels: undefined;
  CreateReel: undefined;
  Additionals: undefined;
  About: undefined;
  Contact: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Screen Props Types
export type AuthScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

export type HomeScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  StackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<TabParamList>
>;

export type BookingsScreenProps<T extends keyof BookingsStackParamList> = CompositeScreenProps<
  StackScreenProps<BookingsStackParamList, T>,
  BottomTabScreenProps<TabParamList>
>;

export type TripsScreenProps<T extends keyof TripsStackParamList> = CompositeScreenProps<
  StackScreenProps<TripsStackParamList, T>,
  BottomTabScreenProps<TabParamList>
>;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  StackScreenProps<ProfileStackParamList, T>,
  BottomTabScreenProps<TabParamList>
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  DrawerScreenProps<DrawerParamList>
>;

export type DrawerScreenPropsType<T extends keyof DrawerParamList> = DrawerScreenProps<
  DrawerParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}


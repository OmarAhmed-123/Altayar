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
};

// Bookings Stack
export type BookingsStackParamList = {
  BookingsMain: undefined;
  BookingDetails: { bookingId: string };
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
};

// Tab Navigator
export type TabParamList = {
  Home: undefined;
  Bookings: undefined;
  Trips: undefined;
  Profile: undefined;
};

// Drawer Navigator
export type DrawerParamList = {
  MainTabs: undefined;
  Notifications: undefined;
  Reviews: undefined;
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

export type DrawerScreenProps<T extends keyof DrawerParamList> = DrawerScreenProps<
  DrawerParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}


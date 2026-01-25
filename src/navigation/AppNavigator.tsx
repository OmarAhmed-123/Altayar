import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { SplashScreen } from '../screens/SplashScreen';

// Home Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { PackageDetailsScreen } from '../screens/packages/PackageDetailsScreen';
import { PackagesScreen } from '../screens/packages/PackagesScreen';

// Booking Screens
import { BookingsScreen } from '../screens/bookings/BookingsScreen';
import { BookingDetailsScreen } from '../screens/bookings/BookingDetailsScreen';

// Profile Screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';

// Membership Screens
import { MembershipsScreen } from '../screens/memberships/MembershipsScreen';
import { MembershipCardScreen } from '../screens/memberships/MembershipCardScreen';

// Other Screens
import { TripsScreen } from '../screens/trips/TripsScreen';
import { ReviewsScreen } from '../screens/reviews/ReviewsScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ColorThemeScreen } from '../screens/settings/ColorThemeScreen';
import { LanguageScreen } from '../screens/settings/LanguageScreen';
import { DebugScreen } from '../screens/debug/DebugScreen';

import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import type {
  AuthStackParamList,
  HomeStackParamList,
  BookingsStackParamList,
  TripsStackParamList,
  ProfileStackParamList,
  TabParamList,
  DrawerParamList,
} from '../types/navigation';

const Stack = createStackNavigator<AuthStackParamList>();
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
    <ProfileStack.Screen name="Debug" component={DebugScreen} />
  </ProfileStack.Navigator>
);

const MainTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Bookings':
              iconName = 'book-online';
              break;
            case 'Trips':
              iconName = 'route';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'الرئيسية' }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingsStackNavigator}
        options={{ tabBarLabel: 'الحجوزات' }}
      />
      <Tab.Screen 
        name="Trips" 
        component={TripsStackNavigator}
        options={{ tabBarLabel: 'رحلاتي' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'الملف الشخصي' }}
      />
    </Tab.Navigator>
  );
};

const MainDrawer = () => {
  const { theme } = useTheme();

  return (
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
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ 
          drawerLabel: 'الرئيسية',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          drawerLabel: 'الإشعارات',
          drawerIcon: ({ color, size }) => (
            <Icon name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Reviews" 
        component={ReviewsScreen}
        options={{ 
          drawerLabel: 'التقييمات',
          drawerIcon: ({ color, size }) => (
            <Icon name="star" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
};

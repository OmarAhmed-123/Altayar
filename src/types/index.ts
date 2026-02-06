import { TextStyle } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    h5: TextStyle;
    h6: TextStyle;
    body1: TextStyle;
    body2: TextStyle;
    caption: TextStyle;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'hr' | 'sales' | 'reservations' | 'data_entry' | 'accountant' | 'agent' | 'support' | 'customer';
  membership_id?: number;
  points: number;
  cashback: number;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for frontend
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  createdBy?: number | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'customer' | 'admin' | 'super_admin' | 'hr' | 'sales' | 'reservations' | 'data_entry' | 'accountant' | 'agent' | 'support';
}

export interface Package {
  id: number;
  name: string;
  description: string;
  days: number;
  nights: number;
  price: number;
  services: string[];
  images: string[];
  is_exclusive: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields for frontend
  title?: string;
  duration?: number;
  location?: string;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
}

export interface Booking {
  id: number;
  user_id: number;
  booking_type: 'tour' | 'nile_cruise' | 'flight_ticket' | 'hotel_booking' | 'transfer' | 'nile_trip' | 'general_tour';
  details: {
    packageId?: number;
    participants?: number;
    startDate?: string;
    endDate?: string;
    specialRequests?: string;
    [key: string]: any;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for frontend
  package?: Package;
  totalAmount?: number;
  participants?: number;
  startDate?: string;
  endDate?: string;
  specialRequests?: string;
  bookingType?: 'tour' | 'nile_cruise' | 'flight_ticket' | 'hotel_booking' | 'transfer' | 'nile_trip' | 'general_tour';
}

export interface Membership {
  id: number;
  name: string;
  price: number;
  points: number;
  benefits: string[];
  pdf_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields for frontend
  description?: string;
  level?: number;
  pointsMultiplier?: number;
  cashbackRate?: number;
  isActive?: boolean;
}

export interface Review {
  id: number;
  user_id: number;
  package_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for frontend
  userId?: string;
  packageId?: string;
  isVerified?: boolean;
  helpfulCount?: number;
  isHelpful?: boolean;
}

export interface Trip {
  id: number;
  user_id: number;
  title: string;
  start_date?: string;
  end_date?: string;
  destinations: string[];
  destination?: string;
  location?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  // Computed fields for frontend
  userId?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
}

export interface Notification {
  id: number;
  user_id: number;
  sender_id?: number;
  type: 'offer' | 'booking_status' | 'membership_upgrade' | 'voucher_gift' | 'ad_popup' | 'chat_message' | 'general';
  title: string;
  message: string;
  is_read: boolean;
  reference_id?: number;
  created_at: string;
  updated_at: string;
  // Computed fields for frontend
  userId?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Voucher {
  id: number;
  user_id: number;
  code: string;
  type: 'dinner' | 'breakfast' | 'spa' | 'gym' | 'dental_cleaning' | 'makeup' | 'manual_gift';
  value: number;
  description?: string;
  issued_by?: number;
  expires_at?: string;
  is_used: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'membership_purchase' | 'booking_payment' | 'cashback_earned' | 'points_spent' | 'manual_deposit' | 'invoice_payment';
  amount: number;
  points_change: number;
  cashback_change: number;
  related_booking_id?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  social_media: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  currency: string;
  timezone: string;
  maintenance_mode: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalPackages: number;
  activeMemberships: number;
  pendingBookings: number;
  monthlyRevenue: number;
  userGrowth: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface RealtimeAnalytics {
  onlineUsers: number;
  activeBookings: number;
  recentSignups: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

export interface UserEngagement {
  averageSessionTime: number;
  pageViews: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{
    page: string;
    views: number;
  }>;
}

export interface RecentActivity {
  id: number;
  type: 'booking' | 'user' | 'payment' | 'review';
  description: string;
  timestamp: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

// Partner Portal Types
export interface Partner {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  business_type: string;
  services?: string[];
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  approved_at?: string;
  approved_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerService {
  id: number;
  partner_id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  duration?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Marketing Types
export interface MarketingCampaign {
  id: number;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  target_criteria?: any;
  content: any;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Geolocation Types
export interface VisitedLocation {
  id: number;
  user_id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  country: string;
  city?: string;
  visit_type?: string;
  booking_id?: number;
  visit_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TravelStatistics {
  totalLocations: number;
  countriesVisited: number;
  citiesVisited: number;
  totalDistance: number;
  averageStayDuration: number;
  favoriteDestinations: Array<{
    location: string;
    visitCount: number;
  }>;
}

// External API Types
export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon?: string;
}
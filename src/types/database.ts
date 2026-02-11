// Custom types for the application

export type AppRole = 'super_admin' | 'admin' | 'staff' | 'customer';
export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Package {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_hours: number;
  min_staff: number;
  max_sqft: number | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory;
}

export interface Booking {
  id: string;
  booking_number: string;
  package_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_user_id: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  pincode: string;
  floor_number: number | null;
  property_sqft: number | null;
  scheduled_date: string;
  scheduled_time: string;
  status: BookingStatus;
  special_instructions: string | null;
  base_price: number;
  addon_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  report_before: string | null;
  required_staff_count: number;
  panchayath_id: string | null;
  package?: Package;
  staff_assignments?: StaffAssignment[];
  payments?: Payment[];
  rating?: Rating;
}

export interface StaffAssignment {
  id: string;
  booking_id: string;
  staff_user_id: string;
  assigned_at: string;
  staff?: Profile;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: string | null;
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface StaffDetails {
  id: string;
  user_id: string;
  is_available: boolean;
  skills: string[] | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

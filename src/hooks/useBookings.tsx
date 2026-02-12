import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Booking, BookingStatus } from '@/types/database';

interface CreateBookingData {
  package_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  pincode?: string;
  floor_number?: number;
  property_sqft?: number;
  panchayath_id?: string;
  landmark?: string;
  scheduled_date: string;
  scheduled_time: string;
  special_instructions?: string;
  base_price: number;
  addon_price?: number;
  total_price: number;
}

export function useBookings(filters?: { status?: BookingStatus; staffId?: string }) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          package:packages(*, category:service_categories(*))
        `)
        .order('scheduled_date', { ascending: true });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
  });
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          package:packages(*, category:service_categories(*))
        `)
        .eq('id', bookingId)
        .single();
      
      if (error) throw error;
      return data as Booking;
    },
    enabled: !!bookingId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const { data: result, error } = await supabase.rpc('create_booking', {
        p_customer_name: data.customer_name,
        p_customer_phone: data.customer_phone,
        p_panchayath_id: data.panchayath_id || null,
        p_landmark: data.landmark || null,
        p_property_sqft: data.property_sqft || null,
        p_scheduled_date: data.scheduled_date,
        p_scheduled_time: data.scheduled_time,
        p_special_instructions: data.special_instructions || null,
        p_base_price: data.base_price,
        p_addon_price: data.addon_price || 0,
        p_total_price: data.total_price,
        p_package_id: data.package_id || null,
      });
      
      if (error) throw error;
      return result as unknown as { id: string; booking_number: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: BookingStatus }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useBookingByNumber(bookingNumber: string) {
  return useQuery({
    queryKey: ['booking-number', bookingNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          package:packages(*, category:service_categories(*))
        `)
        .eq('booking_number', bookingNumber)
        .single();
      
      if (error) throw error;
      return data as Booking;
    },
    enabled: !!bookingNumber,
  });
}

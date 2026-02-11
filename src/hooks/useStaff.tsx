import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffMember {
  user_id: string;
  is_available: boolean;
  skills: string[] | null;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
  panchayath_assignments?: {
    panchayath_id: string;
    ward_numbers: number[];
    panchayath?: { name: string };
  }[];
}

export function useStaffList() {
  return useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      // Get all users with staff role
      const { data: staffRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'staff');
      
      if (rolesError) throw rolesError;
      if (!staffRoles?.length) return [];

      const staffUserIds = staffRoles.map(r => r.user_id);

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .in('user_id', staffUserIds);
      
      if (profilesError) throw profilesError;

      // Get staff details
      const { data: details, error: detailsError } = await supabase
        .from('staff_details')
        .select('user_id, is_available, skills')
        .in('user_id', staffUserIds);
      
      if (detailsError) throw detailsError;

      // Get panchayath assignments
      const { data: assignments, error: assignError } = await supabase
        .from('staff_panchayath_assignments')
        .select('staff_user_id, panchayath_id, ward_numbers, panchayath:panchayaths(name)')
        .in('staff_user_id', staffUserIds);
      
      if (assignError) throw assignError;

      // Combine data
      return staffUserIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const detail = details?.find(d => d.user_id === userId);
        const userAssignments = assignments?.filter(a => a.staff_user_id === userId) || [];
        
        return {
          user_id: userId,
          is_available: detail?.is_available ?? true,
          skills: detail?.skills ?? null,
          profile: profile ? {
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
          } : undefined,
          panchayath_assignments: userAssignments.map(a => ({
            panchayath_id: a.panchayath_id,
            ward_numbers: a.ward_numbers,
            panchayath: a.panchayath as unknown as { name: string },
          })),
        } as StaffMember;
      });
    },
  });
}

export function useStaffByPanchayath(panchayathId: string | null) {
  return useQuery({
    queryKey: ['staff-by-panchayath', panchayathId],
    queryFn: async () => {
      if (!panchayathId) return [];
      
      const { data: assignments, error } = await supabase
        .from('staff_panchayath_assignments')
        .select('staff_user_id')
        .eq('panchayath_id', panchayathId);
      
      if (error) throw error;
      if (!assignments?.length) return [];

      const staffIds = assignments.map(a => a.staff_user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', staffIds);
      
      if (profilesError) throw profilesError;
      return profiles || [];
    },
    enabled: !!panchayathId,
  });
}

export function useAssignStaffToBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookingId, staffUserIds }: { bookingId: string; staffUserIds: string[] }) => {
      // Delete existing assignments
      await supabase
        .from('booking_staff_assignments')
        .delete()
        .eq('booking_id', bookingId);
      
      // Insert new assignments
      const inserts = staffUserIds.map(staffUserId => ({
        booking_id: bookingId,
        staff_user_id: staffUserId,
        status: 'pending',
      }));
      
      const { error } = await supabase
        .from('booking_staff_assignments')
        .insert(inserts);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
    },
  });
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase
        .from('booking_staff_assignments')
        .update({ status })
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
    },
  });
}

export function useMyJobs(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-jobs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get assignments for this staff
      const { data: assignments, error: assignError } = await supabase
        .from('booking_staff_assignments')
        .select('id, booking_id, status, assigned_at')
        .eq('staff_user_id', userId);
      
      if (assignError) throw assignError;
      if (!assignments?.length) return [];

      const bookingIds = assignments.map(a => a.booking_id);
      
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`*, package:packages(*, category:service_categories(*))`)
        .in('id', bookingIds);
      
      if (bookingsError) throw bookingsError;

      return assignments.map(assignment => {
        const booking = bookings?.find(b => b.id === assignment.booking_id);
        return {
          ...assignment,
          booking,
        };
      });
    },
    enabled: !!userId,
  });
}

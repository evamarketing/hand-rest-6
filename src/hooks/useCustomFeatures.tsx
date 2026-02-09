import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomFeature {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

type CustomFeatureInput = Omit<CustomFeature, 'id' | 'created_at' | 'updated_at'>;

export function useCustomFeatures() {
  return useQuery<CustomFeature[]>({
    queryKey: ['custom_features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_features')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as CustomFeature[];
    },
  });
}

export function useAllCustomFeatures() {
  return useQuery<CustomFeature[]>({
    queryKey: ['custom_features', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_features')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as CustomFeature[];
    },
  });
}

export function useCreateCustomFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomFeatureInput) => {
      const { data, error } = await supabase.from('custom_features').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_features'] }),
  });
}

export function useUpdateCustomFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CustomFeatureInput & { id: string }) => {
      const { data, error } = await supabase.from('custom_features').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_features'] }),
  });
}

export function useDeleteCustomFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_features').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_features'] }),
  });
}

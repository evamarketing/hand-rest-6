import { useState } from 'react';
import { Search, Users, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { usePanchayaths } from '@/hooks/usePanchayaths';
import { useQuery } from '@tanstack/react-query';

function useCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      // Get all profiles with customer role
      const { data: customerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'customer');

      if (!customerRoles?.length) return [];

      const customerUserIds = customerRoles.map(r => r.user_id);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*, panchayath:panchayaths(name)')
        .in('user_id', customerUserIds);

      if (error) throw error;
      return profiles || [];
    },
  });
}

export function CustomersTab() {
  const [search, setSearch] = useState('');
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>('all');
  const { data: customers, isLoading } = useCustomers();
  const { data: panchayaths } = usePanchayaths();

  const filtered = customers?.filter(c => {
    const matchesSearch =
      !search ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchesPanchayath =
      selectedPanchayath === 'all' || c.panchayath_id === selectedPanchayath;
    return matchesSearch && matchesPanchayath;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <Badge variant="outline" className="text-sm">
          {filtered.length} registered
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="pl-10"
          />
        </div>
        <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Panchayaths" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Panchayaths</SelectItem>
            {panchayaths?.filter(p => p.is_active).map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Panchayath</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.full_name}</TableCell>
                      <TableCell>{customer.phone || '—'}</TableCell>
                      <TableCell>{(customer.panchayath as any)?.name || '—'}</TableCell>
                      <TableCell>{customer.ward_number ? `Ward ${customer.ward_number}` : '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y">
            {isLoading ? (
              <p className="text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No customers found</p>
            ) : (
              filtered.map(customer => (
                <div key={customer.id} className="p-4">
                  <p className="font-medium">{customer.full_name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Phone className="w-3 h-3" />
                    <span>{customer.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{(customer.panchayath as any)?.name || '—'}</span>
                    {customer.ward_number && <span>• Ward {customer.ward_number}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered: {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Package, 
  Settings,
  LogOut,
  Plus,
  Search,
  Filter,
  Eye,
  UserPlus,
  DollarSign,
  TrendingUp,
  Clock,
  Puzzle,
  Sparkles,
  MapPin,
  Shield,
  Lock,
  Home
} from 'lucide-react';
import { useMyPermissions, type PermissionTab } from '@/hooks/useAdminPermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { usePackages } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/handrest-logo.jpeg';
import { PackagesTab } from '@/components/admin/PackagesTab';
import { AddonsTab } from '@/components/admin/AddonsTab';
import { CustomFeaturesTab } from '@/components/admin/CustomFeaturesTab';
import { PanchayathsTab } from '@/components/admin/PanchayathsTab';
import { StaffManagementTab } from '@/components/admin/StaffManagementTab';
import { BookingDetailDialog } from '@/components/admin/BookingDetailDialog';
import { PermissionManagementTab } from '@/components/admin/PermissionManagementTab';
import { CustomersTab } from '@/components/admin/CustomersTab';
import type { Booking, BookingStatus } from '@/types/database';

const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

type Tab = 'dashboard' | 'bookings' | 'customers' | 'staff' | 'packages' | 'addons' | 'custom_features' | 'panchayaths' | 'permissions' | 'settings';

function LoginForm({ onLogin }: { onLogin: (email: string, password: string, loginType: 'email' | 'mobile') => Promise<void> }) {
  const [loginType, setLoginType] = useState<'email' | 'mobile'>('email');
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(emailOrMobile, password, loginType);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <img src={logo} alt="HandRest" className="h-20 mx-auto mb-4 rounded-xl" />
            <CardTitle className="text-2xl text-brand-navy">Admin Dashboard</CardTitle>
            <p className="text-muted-foreground">HandRest Cleaning Solutions</p>
          </CardHeader>
          <CardContent>
            {/* Login Type Toggle */}
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={loginType === 'email' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setLoginType('email')}
              >
                Super Admin (Email)
              </Button>
              <Button
                type="button"
                variant={loginType === 'mobile' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setLoginType('mobile')}
              >
                Admin (Mobile)
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {loginType === 'email' ? 'Email' : 'Mobile Number'}
                </label>
                <input
                  type={loginType === 'email' ? 'email' : 'tel'}
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  placeholder={loginType === 'email' ? 'superadmin@handrest.com' : '9876543210'}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function DashboardTab() {
  const { data: bookings } = useBookings();
  const { data: packages } = usePackages();
  
  const todayBookings = bookings?.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.scheduled_date === today;
  }) || [];
  
  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];
  const totalRevenue = bookings?.reduce((sum, b) => sum + b.total_price, 0) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Bookings</p>
                <p className="text-3xl font-bold text-brand-navy">{todayBookings.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand-light-blue flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-teal" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingBookings.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Packages</p>
                <p className="text-3xl font-bold text-brand-navy">{packages?.length || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand-light-blue flex items-center justify-center">
                <Package className="w-6 h-6 text-brand-teal" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.slice(0, 5).map(booking => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.booking_number}</TableCell>
                  <TableCell>{booking.customer_name}</TableCell>
                  <TableCell>{booking.package?.name}</TableCell>
                  <TableCell>{new Date(booking.scheduled_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[booking.status]}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{booking.total_price.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function BookingsTab() {
  const { data: bookings, isLoading } = useBookings();
  const updateStatus = useUpdateBookingStatus();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredBookings = bookings?.filter(b => 
    b.booking_number.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_phone.includes(search)
  ) || [];

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateStatus.mutateAsync({ bookingId, status });
      toast({ title: 'Status updated successfully' });
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const openBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking number, name, or phone..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No bookings found</TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map(booking => (
                    <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openBookingDetail(booking)}>
                      <TableCell className="font-medium">{booking.booking_number}</TableCell>
                      <TableCell>{booking.customer_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{booking.customer_phone}</p>
                          <p className="text-muted-foreground">{booking.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{booking.package?.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(booking.scheduled_date).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{booking.scheduled_time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[booking.status]}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{booking.total_price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y">
            {isLoading ? (
              <p className="text-center py-8">Loading...</p>
            ) : filteredBookings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No bookings found</p>
            ) : (
              filteredBookings.map(booking => (
                <div
                  key={booking.id}
                  className="p-4 cursor-pointer active:bg-muted/50"
                  onClick={() => openBookingDetail(booking)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{booking.booking_number}</span>
                    <Badge className={statusColors[booking.status] + ' text-xs'}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="font-medium">{booking.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{booking.customer_phone}</p>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(booking.scheduled_date).toLocaleDateString()} • {booking.scheduled_time}
                    </span>
                    <span className="font-bold text-brand-teal">₹{booking.total_price.toLocaleString()}</span>
                  </div>
                  {booking.package?.name && (
                    <p className="text-xs text-muted-foreground mt-1">{booking.package.name}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <BookingDetailDialog
        booking={selectedBooking}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

// StaffTab now uses StaffManagementTab component

// PackagesTab and AddonsTab are now imported from components/admin

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { user, profile, signIn, signOut, loading: authLoading, role } = useAuth();
  const { toast } = useToast();
  const { canViewTab, hasPermission } = useMyPermissions();

  const handleLogin = async (emailOrMobile: string, password: string, loginType: 'email' | 'mobile') => {
    let email = emailOrMobile;
    
    // If logging in with mobile, look up the email from profiles
    if (loginType === 'mobile') {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', emailOrMobile)
        .single();
      
      if (profileError || !profileData) {
        toast({
          title: 'Login Failed',
          description: 'No account found with this mobile number',
          variant: 'destructive',
        });
        return;
      }
      email = profileData.email;
    }
    
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-pulse">
          <img src={logo} alt="HandRest" className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const allNavItems = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Dashboard', permTab: 'dashboard' as PermissionTab },
    { id: 'bookings' as const, icon: Calendar, label: 'Bookings', permTab: 'bookings' as PermissionTab },
    { id: 'customers' as const, icon: UserPlus, label: 'Customers', permTab: 'bookings' as PermissionTab },
    { id: 'staff' as const, icon: Users, label: 'Staff', permTab: 'staff' as PermissionTab },
    { id: 'packages' as const, icon: Package, label: 'Packages', permTab: 'packages' as PermissionTab },
    { id: 'addons' as const, icon: Puzzle, label: 'Add-ons', permTab: 'addons' as PermissionTab },
    { id: 'custom_features' as const, icon: Sparkles, label: 'Custom Features', permTab: 'custom_features' as PermissionTab },
    { id: 'panchayaths' as const, icon: MapPin, label: 'Panchayaths', permTab: 'panchayaths' as PermissionTab },
    ...(role === 'super_admin' ? [{ id: 'permissions' as const, icon: Shield, label: 'Permissions', permTab: null }] : []),
    { id: 'settings' as const, icon: Settings, label: 'Settings', permTab: 'settings' as PermissionTab },
  ];

  // Filter nav items based on permissions (super_admin sees everything, admins see permitted tabs)
  const navItems = allNavItems.filter(item => {
    if (role === 'super_admin') return true;
    if (!item.permTab) return false; // permissions tab only for super_admin
    return canViewTab(item.permTab);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-3 bg-brand-navy text-white">
        <div className="flex items-center gap-3">
          <img src={logo} alt="HandRest" className="h-8 rounded-lg" />
          <span className="font-medium text-sm">Admin</span>
        </div>
        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={signOut}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden overflow-x-auto bg-brand-navy px-2 pb-2">
        <div className="flex gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                activeTab === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-brand-navy text-white flex-col">
        <div className="p-6">
          <img src={logo} alt="HandRest" className="h-12 rounded-lg mb-2" />
          <p className="text-sm text-white/70">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 px-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeTab === item.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{profile?.full_name || 'Admin'}</p>
              <p className="text-xs text-white/50">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full text-white/70 hover:text-white hover:bg-white/10"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {activeTab === 'dashboard' && canViewTab('dashboard') && <DashboardTab />}
        {activeTab === 'bookings' && canViewTab('bookings') && <BookingsTab />}
        {activeTab === 'customers' && canViewTab('bookings') && <CustomersTab />}
        {activeTab === 'staff' && canViewTab('staff') && <StaffManagementTab />}
        {activeTab === 'packages' && canViewTab('packages') && <PackagesTab />}
        {activeTab === 'addons' && canViewTab('addons') && <AddonsTab />}
        {activeTab === 'custom_features' && canViewTab('custom_features') && <CustomFeaturesTab />}
        {activeTab === 'panchayaths' && canViewTab('panchayaths') && <PanchayathsTab />}
        {activeTab === 'permissions' && role === 'super_admin' && <PermissionManagementTab />}
        {activeTab === 'settings' && canViewTab('settings') && (
          <div className="text-center py-12 text-muted-foreground">
            Settings coming soon...
          </div>
        )}
        {/* Show access denied if admin doesn't have permission */}
        {role === 'admin' && activeTab !== 'permissions' && !canViewTab(activeTab as PermissionTab) && (
          <div className="text-center py-12">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Access Restricted</p>
            <p className="text-muted-foreground">You don't have permission to access this section.</p>
          </div>
        )}
      </main>

      {/* Floating Home Button */}
      <Button
        variant="hero"
        size="icon"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-elevated"
        onClick={() => navigate('/')}
      >
        <Home className="w-6 h-6" />
      </Button>
    </div>
  );
}

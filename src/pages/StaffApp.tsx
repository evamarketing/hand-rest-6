import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Phone, CheckCircle2, XCircle,
  LogOut, User, DollarSign, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useMyJobs, useUpdateAssignmentStatus } from '@/hooks/useStaff';
import { useUpdateBookingStatus } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StaffLoginForm } from '@/components/staff/StaffLoginForm';
import { StaffSignupForm } from '@/components/staff/StaffSignupForm';
import logo from '@/assets/handrest-logo.jpeg';

export default function StaffApp() {
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const { user, profile, signIn, signOut, loading: authLoading } = useAuth();
  const { data: myJobs, isLoading: jobsLoading } = useMyJobs(user?.id);
  const updateAssignment = useUpdateAssignmentStatus();
  const updateBookingStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  const handleLogin = async (mobile: string, password: string) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    const fakeEmail = `${cleanMobile}@staff.handrest.local`;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('phone', cleanMobile)
      .single();
    const email = profileData?.email || fakeEmail;
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleAccept = async (assignmentId: string, bookingId: string) => {
    try {
      await updateAssignment.mutateAsync({ assignmentId, status: 'accepted' });
      toast({ title: 'Job Accepted', description: 'You have accepted this job.' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    }
  };

  const handleReject = async (assignmentId: string) => {
    try {
      await updateAssignment.mutateAsync({ assignmentId, status: 'rejected' });
      toast({ title: 'Job Rejected' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    }
  };

  const handleStartJob = async (bookingId: string) => {
    try {
      await updateBookingStatus.mutateAsync({ bookingId, status: 'in_progress' });
      toast({ title: 'Job Started' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    }
  };

  const handleCompleteJob = async (bookingId: string) => {
    try {
      await updateBookingStatus.mutateAsync({ bookingId, status: 'completed' });
      toast({ title: 'Job Completed' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
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
    if (authView === 'signup') {
      return <StaffSignupForm onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <StaffLoginForm onLogin={handleLogin} onSwitchToSignup={() => setAuthView('signup')} />;
  }

  const pendingJobs = myJobs?.filter(j => j.status === 'pending') || [];
  const acceptedJobs = myJobs?.filter(j => j.status === 'accepted') || [];
  const completedJobs = myJobs?.filter(j => j.booking?.status === 'completed') || [];
  const totalEarned = completedJobs.reduce((sum, j) => sum + (j.booking?.total_price || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-navy text-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="HandRest" className="h-10 rounded-lg" />
            <div>
              <p className="font-semibold">Staff Portal</p>
              <p className="text-xs text-white/70">{profile?.full_name || user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-white hover:bg-white/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-brand-light-blue border-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-brand-navy">{pendingJobs.length}</p>
              <p className="text-xs text-muted-foreground">New Jobs</p>
            </CardContent>
          </Card>
          <Card className="bg-accent/20 border-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-brand-navy">{acceptedJobs.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="bg-accent/10 border-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-brand-navy">₹{totalEarned.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Earned</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="new" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="new" className="flex-1">New ({pendingJobs.length})</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Active ({acceptedJobs.length})</TabsTrigger>
            <TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
          </TabsList>

          {/* New Jobs - Accept/Reject */}
          <TabsContent value="new" className="space-y-4">
            {jobsLoading ? (
              <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : pendingJobs.length > 0 ? (
              pendingJobs.map(job => (
                <JobCard key={job.id} job={job}>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="hero"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAccept(job.id, job.booking_id)}
                      disabled={updateAssignment.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleReject(job.id)}
                      disabled={updateAssignment.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                  {job.booking?.report_before && (
                    <p className="text-xs text-destructive mt-2">
                      ⏰ Respond before: {new Date(job.booking.report_before).toLocaleString()}
                    </p>
                  )}
                </JobCard>
              ))
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No new job assignments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Active Jobs */}
          <TabsContent value="active" className="space-y-4">
            {acceptedJobs.length > 0 ? (
              acceptedJobs.map(job => (
                <JobCard key={job.id} job={job}>
                  <div className="flex gap-2 mt-3">
                    {job.booking?.status === 'assigned' && (
                      <Button variant="hero" size="sm" className="flex-1" onClick={() => handleStartJob(job.booking_id)}>
                        Start Job
                      </Button>
                    )}
                    {job.booking?.status === 'in_progress' && (
                      <Button variant="hero" size="sm" className="flex-1" onClick={() => handleCompleteJob(job.booking_id)}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </JobCard>
              ))
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active jobs</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Earnings */}
          <TabsContent value="earnings" className="space-y-4">
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="w-10 h-10 text-brand-teal mx-auto mb-2" />
                <p className="text-3xl font-bold text-brand-navy">₹{totalEarned.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Earnings ({completedJobs.length} jobs)</p>
              </CardContent>
            </Card>

            {completedJobs.map(job => (
              <JobCard key={job.id} job={job}>
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Earned</span>
                  <span className="font-bold text-brand-teal">₹{(job.booking?.total_price || 0).toLocaleString()}</span>
                </div>
              </JobCard>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function JobCard({ job, children }: { job: any; children?: React.ReactNode }) {
  const booking = job.booking;
  if (!booking) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-foreground">{booking.booking_number}</p>
              <p className="text-sm text-muted-foreground">{booking.package?.name}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {booking.status?.replace('_', ' ')}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3 h-3" />
              <a href={`tel:${booking.customer_phone}`} className="text-brand-teal">{booking.customer_phone}</a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{booking.address_line1}, {booking.city}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
              <Clock className="w-3 h-3 ml-1" />
              <span>{booking.scheduled_time}</span>
            </div>
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

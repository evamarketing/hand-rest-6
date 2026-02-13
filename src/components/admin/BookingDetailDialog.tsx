import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Phone, Mail, User, Users, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUpdateBookingStatus } from '@/hooks/useBookings';
import { useStaffByPanchayath, useAssignStaffToBooking } from '@/hooks/useStaff';
import { usePanchayaths } from '@/hooks/usePanchayaths';
import { supabase } from '@/integrations/supabase/client';
import type { Booking, BookingStatus } from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';

const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface BookingDetailDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailDialog({ booking, open, onOpenChange }: BookingDetailDialogProps) {
  const { toast } = useToast();
  const updateStatus = useUpdateBookingStatus();
  const assignStaff = useAssignStaffToBooking();
  const { data: panchayaths } = usePanchayaths();
  const queryClient = useQueryClient();
  
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>('');
  const [reportBefore, setReportBefore] = useState('');
  const [requiredStaffCount, setRequiredStaffCount] = useState(2);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [earningPerStaff, setEarningPerStaff] = useState(0);
  const [bonusPerStaff, setBonusPerStaff] = useState(0);
  const [finishing, setFinishing] = useState(false);

  // Reset and pre-fill when booking changes
  if (booking && booking.id !== lastBookingId) {
    setLastBookingId(booking.id);
    setSelectedPanchayath(booking.panchayath_id || '');
    setSelectedStaff([]);
    setReportBefore('');
    setRequiredStaffCount(booking.required_staff_count || 2);
    setEarningPerStaff(0);
    setBonusPerStaff(0);
    setFinishing(false);
  }

  const { data: availableStaff } = useStaffByPanchayath(selectedPanchayath || null);

  if (!booking) return null;

  const handleConfirmBooking = async () => {
    if (!selectedPanchayath || !reportBefore) {
      toast({ title: 'Please select panchayath and report-before time', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          panchayath_id: selectedPanchayath,
          report_before: new Date(reportBefore).toISOString(),
          required_staff_count: requiredStaffCount,
          status: 'confirmed' as BookingStatus,
        })
        .eq('id', booking.id);
      
      if (error) throw error;
      
      toast({ title: 'Booking confirmed! Staff in this panchayath can now see and accept this job.' });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onOpenChange(false);
    } catch {
      toast({ title: 'Failed to confirm booking', variant: 'destructive' });
    }
  };

  const handleAssignStaff = async () => {
    if (selectedStaff.length === 0) {
      toast({ title: 'Please select at least one staff member', variant: 'destructive' });
      return;
    }

    try {
      await assignStaff.mutateAsync({ bookingId: booking.id, staffUserIds: selectedStaff });
      await updateStatus.mutateAsync({ bookingId: booking.id, status: 'assigned' });
      toast({ title: `Assigned ${selectedStaff.length} staff members` });
      onOpenChange(false);
    } catch {
      toast({ title: 'Failed to assign staff', variant: 'destructive' });
    }
  };

  const handleFinishJob = async () => {
    if (earningPerStaff <= 0) {
      toast({ title: 'Please enter earning amount per staff', variant: 'destructive' });
      return;
    }

    setFinishing(true);
    try {
      // Get all accepted staff for this booking
      const { data: assignments, error: aErr } = await supabase
        .from('booking_staff_assignments')
        .select('staff_user_id')
        .eq('booking_id', booking.id)
        .eq('status', 'accepted');

      if (aErr) throw aErr;

      if (assignments && assignments.length > 0) {
        const totalPerStaff = earningPerStaff + bonusPerStaff;
        // Insert earnings for each staff
        const earningInserts = assignments.map(a => ({
          booking_id: booking.id,
          staff_user_id: a.staff_user_id,
          amount: totalPerStaff,
          status: 'pending',
        }));

        const { error: eErr } = await supabase
          .from('staff_earnings')
          .insert(earningInserts);

        if (eErr) throw eErr;
      }

      toast({ title: 'Job finalized! Earnings recorded for staff.' });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-earnings'] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Failed to finalize', description: err.message, variant: 'destructive' });
    } finally {
      setFinishing(false);
    }
  };

  const toggleStaff = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
    );
  };

  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isCompleted = booking.status === 'completed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Booking {booking.booking_number}</span>
            <Badge className={statusColors[booking.status]}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{booking.customer_phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{booking.customer_email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{booking.address_line1}, {booking.city}</span>
            </div>
            {booking.panchayath_id && panchayaths && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Panchayath:</span>
                <span className="font-medium">{panchayaths.find(p => p.id === booking.panchayath_id)?.name || 'Unknown'}</span>
              </div>
            )}
          </div>

          {/* Schedule & Package */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>{booking.scheduled_time}</span>
            </div>
            <p className="font-medium">{booking.package?.name}</p>
            <p className="text-lg font-bold text-brand-teal">₹{booking.total_price.toLocaleString()}</p>
          </div>

          {/* Step 1: Admin verifies - set panchayath, report-before, staff count */}
          {isPending && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Verify & Confirm Booking
              </h3>

              <div>
                <Label>Service Area (Panchayath) *</Label>
                <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select panchayath" />
                  </SelectTrigger>
                  <SelectContent>
                    {panchayaths?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Report Before (Deadline for staff) *</Label>
                <Input
                  type="datetime-local"
                  value={reportBefore}
                  onChange={e => setReportBefore(e.target.value)}
                />
              </div>

              <div>
                <Label>Required Staff Count *</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={requiredStaffCount}
                  onChange={e => setRequiredStaffCount(Number(e.target.value))}
                />
              </div>

              <Button variant="hero" className="w-full" onClick={handleConfirmBooking}>
                Confirm Booking
              </Button>
            </div>
          )}

          {/* Step 2: Assign staff (optional manual override) */}
          {isConfirmed && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Staff Assignment (Need {booking.required_staff_count || 2} staff)
              </h3>
              
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium">✓ Job is now visible to staff in this panchayath</p>
                <p className="text-blue-600 mt-1">Staff can self-accept. When {booking.required_staff_count || 2} staff accept, the booking auto-assigns.</p>
              </div>

              {!booking.panchayath_id ? (
                <p className="text-sm text-muted-foreground">No panchayath set.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground font-medium">
                    Or manually assign staff:
                  </p>
                  
                  {availableStaff && availableStaff.length > 0 ? (
                    <div className="space-y-2">
                      {availableStaff.map(staff => (
                        <label
                          key={staff.user_id}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedStaff.includes(staff.user_id)}
                            onCheckedChange={() => toggleStaff(staff.user_id)}
                          />
                          <div>
                            <p className="font-medium">{staff.full_name}</p>
                            <p className="text-sm text-muted-foreground">{staff.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">No staff available in this panchayath.</p>
                  )}

                  <Button 
                    variant="hero" 
                    className="w-full" 
                    onClick={handleAssignStaff}
                    disabled={selectedStaff.length === 0 || assignStaff.isPending}
                  >
                    Assign {selectedStaff.length} Staff Member{selectedStaff.length !== 1 ? 's' : ''}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Finish completed job and record earnings */}
          {isCompleted && (
            <div className="border rounded-lg p-4 space-y-4 border-green-200 bg-green-50/50">
              <h3 className="font-semibold flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-4 h-4" />
                Finalize Job & Record Earnings
              </h3>

              <div>
                <Label>Fixed Earning Per Staff (₹) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={earningPerStaff}
                  onChange={e => setEarningPerStaff(Number(e.target.value))}
                  placeholder="Enter amount per staff member"
                />
                <p className="text-xs text-muted-foreground mt-1">Base earning from custom features staff contribution</p>
              </div>

              <div>
                <Label>Bonus Per Staff (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={bonusPerStaff}
                  onChange={e => setBonusPerStaff(Number(e.target.value))}
                  placeholder="Optional bonus amount"
                />
              </div>

              {(earningPerStaff > 0 || bonusPerStaff > 0) && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>Base Earning:</span><span>₹{earningPerStaff.toLocaleString()}</span></div>
                  {bonusPerStaff > 0 && <div className="flex justify-between"><span>Bonus:</span><span>₹{bonusPerStaff.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Total Per Staff:</span><span>₹{(earningPerStaff + bonusPerStaff).toLocaleString()}</span></div>
                </div>
              )}

              <Button 
                variant="hero" 
                className="w-full" 
                onClick={handleFinishJob}
                disabled={finishing || earningPerStaff <= 0}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                {finishing ? 'Finalizing...' : 'Finish & Record Earnings'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

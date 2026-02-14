import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookings } from '@/hooks/useBookings';
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
  BarChart3,
  TrendingUp,
  IndianRupee,
  CalendarDays,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Star,
} from 'lucide-react';
import type { BookingStatus } from '@/types/database';

const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function ReportsTab() {
  const { data: bookings } = useBookings();

  const stats = useMemo(() => {
    if (!bookings?.length) return null;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const thisMonthBookings = bookings.filter(b => b.scheduled_date.startsWith(thisMonth));
    const lastMonthBookings = bookings.filter(b => b.scheduled_date.startsWith(lastMonthStr));
    const todayBookings = bookings.filter(b => b.scheduled_date === today);

    const completedBookings = bookings.filter(b => b.status === 'completed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const pendingBookings = bookings.filter(b => b.status === 'pending');

    const totalRevenue = completedBookings.reduce((s, b) => s + b.total_price, 0);
    const thisMonthRevenue = thisMonthBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.total_price, 0);
    const lastMonthRevenue = lastMonthBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.total_price, 0);

    const avgOrderValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;
    const completionRate = bookings.length > 0 ? (completedBookings.length / bookings.length) * 100 : 0;
    const cancellationRate = bookings.length > 0 ? (cancelledBookings.length / bookings.length) * 100 : 0;

    // Revenue by status
    const revenueByStatus: Record<string, { count: number; revenue: number }> = {};
    bookings.forEach(b => {
      if (!revenueByStatus[b.status]) revenueByStatus[b.status] = { count: 0, revenue: 0 };
      revenueByStatus[b.status].count++;
      revenueByStatus[b.status].revenue += b.total_price;
    });

    // Top customers
    const customerMap: Record<string, { name: string; phone: string; count: number; total: number }> = {};
    bookings.forEach(b => {
      const key = b.customer_phone;
      if (!customerMap[key]) customerMap[key] = { name: b.customer_name, phone: b.customer_phone, count: 0, total: 0 };
      customerMap[key].count++;
      customerMap[key].total += b.total_price;
    });
    const topCustomers = Object.values(customerMap).sort((a, b) => b.count - a.count).slice(0, 5);

    // Daily booking trend (last 7 days)
    const dailyTrend: { date: string; count: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayBookings = bookings.filter(b => b.scheduled_date === dateStr);
      dailyTrend.push({
        date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        count: dayBookings.length,
        revenue: dayBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.total_price, 0),
      });
    }

    return {
      totalBookings: bookings.length,
      todayCount: todayBookings.length,
      thisMonthCount: thisMonthBookings.length,
      lastMonthCount: lastMonthBookings.length,
      completedCount: completedBookings.length,
      cancelledCount: cancelledBookings.length,
      pendingCount: pendingBookings.length,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      avgOrderValue,
      completionRate,
      cancellationRate,
      revenueByStatus,
      topCustomers,
      dailyTrend,
    };
  }, [bookings]);

  if (!stats) {
    return <div className="text-center py-12 text-muted-foreground">Loading reports...</div>;
  }

  const revenueGrowth = stats.lastMonthRevenue > 0
    ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-xl font-bold text-blue-600">{stats.totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Order Value</p>
                <p className="text-xl font-bold text-purple-600">₹{Math.round(stats.avgOrderValue).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-xl font-bold text-orange-600">{stats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month Comparison & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Monthly Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">This Month</p>
                  <p className="text-xs text-muted-foreground">{stats.thisMonthCount} bookings</p>
                </div>
                <p className="text-lg font-bold text-green-600">₹{stats.thisMonthRevenue.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Last Month</p>
                  <p className="text-xs text-muted-foreground">{stats.lastMonthCount} bookings</p>
                </div>
                <p className="text-lg font-bold text-muted-foreground">₹{stats.lastMonthRevenue.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <p className="text-sm font-medium">Revenue Growth</p>
                <Badge className={Number(revenueGrowth) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {revenueGrowth}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Booking Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.revenueByStatus).map(([status, data]) => (
                <div key={status} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[status as BookingStatus] + ' text-xs'}>
                      {status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{data.count} bookings</span>
                  </div>
                  <span className="text-sm font-semibold">₹{data.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {stats.dailyTrend.map((day) => (
              <div key={day.date} className="text-center">
                <div
                  className="mx-auto w-full bg-primary/10 rounded-lg flex items-end justify-center mb-1"
                  style={{ height: '80px' }}
                >
                  <div
                    className="w-full bg-primary rounded-lg transition-all"
                    style={{
                      height: `${Math.max(8, (day.count / Math.max(...stats.dailyTrend.map(d => d.count), 1)) * 72)}px`,
                    }}
                  />
                </div>
                <p className="text-xs font-medium">{day.count}</p>
                <p className="text-[10px] text-muted-foreground">{day.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4" /> Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Bookings</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topCustomers.map((c, i) => (
                  <TableRow key={c.phone}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{c.count}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">₹{c.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" /> Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">Pending Bookings</span>
                </div>
                <span className="font-bold text-yellow-700">{stats.pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-bold text-green-700">{stats.completedCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Cancelled</span>
                </div>
                <span className="font-bold text-red-700">{stats.cancelledCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Today's Bookings</span>
                </div>
                <span className="font-bold text-blue-700">{stats.todayCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Cancellation Rate</span>
                </div>
                <span className="font-bold text-muted-foreground">{stats.cancellationRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

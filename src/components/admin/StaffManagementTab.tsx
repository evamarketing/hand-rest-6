import { Users, MapPin, Phone, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useStaffList } from '@/hooks/useStaff';

export function StaffManagementTab() {
  const { data: staffList, isLoading } = useStaffList();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Panchayath(s)</TableHead>
                <TableHead>Wards</TableHead>
                <TableHead>Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : !staffList?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No staff registered yet. Staff can register via the Staff Portal.</p>
                  </TableCell>
                </TableRow>
              ) : (
                staffList.map(staff => (
                  <TableRow key={staff.user_id}>
                    <TableCell className="font-medium">{staff.profile?.full_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {staff.profile?.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {staff.panchayath_assignments?.map((a, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {a.panchayath?.name || 'Unknown'}
                          </Badge>
                        ))}
                        {(!staff.panchayath_assignments?.length) && <span className="text-muted-foreground text-sm">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {staff.panchayath_assignments?.map((a, i) => (
                        <span key={i} className="text-sm">
                          {a.ward_numbers?.join(', ') || '-'}
                          {i < (staff.panchayath_assignments?.length || 0) - 1 ? ' | ' : ''}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>
                      {staff.is_available ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

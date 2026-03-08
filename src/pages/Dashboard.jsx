import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Bed, 
  CalendarCheck, 
  Users, 
  DollarSign, 
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import UserLayout from '@/components/user/UserLayout';
import StatsCard from '@/components/admin/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 50),
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['guests'],
    queryFn: () => base44.entities.Guest.list(),
  });

  // Calculate stats
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const bookedRooms = rooms.filter(r => r.status === 'booked').length;
  const totalGuests = guests.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  // Recent bookings
  const recentBookings = bookings.slice(0, 5);

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: '保留中' },
    confirmed: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: '確認済み' },
    cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'キャンセル' },
    completed: { icon: CheckCircle2, color: 'bg-blue-100 text-blue-700', label: '完了' },
  };

  return (
    <ProtectedRoute>
      <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="総客室数" 
          value={totalRooms} 
          icon={Bed} 
          color="amber"
        />
        <StatsCard 
          title="空室数" 
          value={availableRooms} 
          icon={Bed} 
          color="emerald"
        />
        <StatsCard 
          title="保留中の予約" 
          value={pendingBookings} 
          icon={CalendarCheck} 
          color="blue"
        />
        <StatsCard 
          title="総ゲスト数" 
          value={totalGuests} 
          icon={Users} 
          color="purple"
        />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">最近の予約</CardTitle>
            <Link 
              to={createPageUrl('AdminBookings')}
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length === 0 ? (
                <p className="text-slate-500 text-center py-8">予約はまだありません</p>
              ) : (
                recentBookings.map((booking, index) => {
                  const status = statusConfig[booking.status] || statusConfig.pending;
                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-600 font-semibold">
                            {booking.guest_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{booking.guest_name}</p>
                          <p className="text-sm text-slate-500">
                            {booking.check_in && format(new Date(booking.check_in), 'MMM d')} - 
                            {booking.check_out && format(new Date(booking.check_out), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Room Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">客室状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-slate-700">空室</span>
                </div>
                <span className="text-2xl font-semibold text-slate-900">{availableRooms}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-slate-700">予約済み</span>
                </div>
                <span className="text-2xl font-semibold text-slate-900">{bookedRooms}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-slate-500 rounded-full" />
                  <span className="text-slate-700">メンテナンス</span>
                </div>
                <span className="text-2xl font-semibold text-slate-900">
                  {rooms.filter(r => r.status === 'maintenance').length}
                </span>
              </div>
            </div>

            <Link 
              to={createPageUrl('AdminRooms')}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              客室を管理 <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
    </ProtectedRoute>
  );
}
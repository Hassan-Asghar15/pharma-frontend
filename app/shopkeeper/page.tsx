'use client';

import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2, Package, Clock, CheckCircle, Trophy, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// --- Type Definitions ---
interface RecentOrder { _id: string; seller: { name: string }; status: string; createdAt: string; }
interface TopSeller { _id: string; name: string; count: number; }
interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: RecentOrder[];
  topSellers: TopSeller[];
}

// --- SWR Fetcher ---
const fetcher = async ([url, token]: [string, string | null]) => {
  if (!token) throw new Error("Not authorized");
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

// --- Reusable UI Components for this page ---

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <Card className="dark:bg-gray-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    </CardContent>
  </Card>
);

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500 hover:bg-yellow-500/80';
    case 'completed': return 'bg-green-600 hover:bg-green-600/80';
    case 'shipped': return 'bg-indigo-500 hover:bg-indigo-500/80';
    default: return 'bg-gray-500 hover:bg-gray-500/80';
  }
};

// --- Main Dashboard Component ---
export default function ShopkeeperDashboardPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  const { data: stats, error, isLoading } = useSWR<DashboardStats>(
    token ? [`${apiUrl}/api/orders/stats`, token] : null,
    fetcher,
    { revalidateOnFocus: false } // Optional: prevent re-fetching every time you click the window
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Failed to load dashboard data.</div>;
  }

  if (!stats) {
    return <div className="text-center text-gray-500">No data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Orders Placed" value={stats.totalOrders} icon={<ShoppingBag className="h-4 w-4 text-gray-500" />} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={<Clock className="h-4 w-4 text-gray-500" />} />
        <StatCard title="Completed Orders" value={stats.completedOrders} icon={<CheckCircle className="h-4 w-4 text-gray-500" />} />
      </div>

      {/* Bottom Row: Recent Orders and Top Distributors */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Recent Orders Card */}
        <Card className="lg:col-span-4 dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map(order => (
                  <div key={order._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                        Order to <span className="font-bold">{order.seller?.name || 'N/A'}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(order.createdAt), "dd MMMM yyyy")}
                      </p>
                    </div>
                    <Badge className={`text-white capitalize text-xs ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">You haven't placed any recent orders.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Distributors Card */}
        <Card className="lg:col-span-3 dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Top Distributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topSellers.length > 0 ? (
                stats.topSellers.map((seller, index) => (
                  <div key={seller._id} className="flex items-center">
                    <Trophy className={`h-5 w-5 mr-4 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      'text-yellow-700'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{seller.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{seller.count} orders</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No ordering trends yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
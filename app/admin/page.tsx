'use client';

import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Loader2, Users, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// --- Type Definitions for Dashboard Data ---
interface User { _id: string; name: string; email: string; role: string; }
interface Order { _id: string; }
interface Product { _id: string; }
interface DashboardData {
  users: User[];
  orders: Order[];
  products: Product[];
}

// --- SWR Fetcher for multiple endpoints ---
const fetcher = async ([urls, token]: [string[], string | null]): Promise<DashboardData> => {
  if (!token) throw new Error("Not authorized");
  const headers = { Authorization: `Bearer ${token}` };
  const requests = urls.map(url => axios.get(url, { headers }));
  
  const [usersRes, ordersRes, productsRes] = await Promise.all(requests);

  return {
    users: usersRes.data,
    orders: ordersRes.data,
    products: productsRes.data,
  };
};

// --- Reusable Stat Card Component ---
const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// ==========================================================
// Main Admin Dashboard Page Component
// ==========================================================
export default function AdminDashboardPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  const adminUrls = [
      `${apiUrl}/api/admin/users`,
      `${apiUrl}/api/admin/orders`,
      `${apiUrl}/api/admin/products`
  ];

  const { data, error, isLoading } = useSWR<DashboardData>(
    token ? [adminUrls, token] : null,
    fetcher
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Failed to load dashboard data. Please refresh.</div>;
  }

  if (!data) {
    return <div className="text-center text-gray-500">No data available.</div>;
  }

  const recentUsers = data.users.slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Top Row: Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Users" value={data.users.length} icon={<Users className="h-4 w-4 text-gray-500" />} />
        <StatCard title="Total Orders" value={data.orders.length} icon={<ShoppingCart className="h-4 w-4 text-gray-500" />} />
        <StatCard title="Total Products" value={data.products.length} icon={<Package className="h-4 w-4 text-gray-500" />} />
      </div>

      {/* Main Content: Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Joined Users</CardTitle>
          <CardDescription>The last 5 users to join the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.length > 0 ? (
              recentUsers.map(user => (
                <div key={user._id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No users found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
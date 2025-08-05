'use client';

import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Loader2, Users, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// --- Type Definitions for Dashboard Data ---
interface User { _id: string; name:string; email: string; role: string; createdAt: string; }
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

// --- Reusable Stat Card Component (Error Fixed) ---
const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
      {/* ✅ FIX: The icon is decorative. Wrapping it is a type-safe way to hide it from screen readers. */}
      <div aria-hidden="true">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
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
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50 p-6 text-center text-red-600">
        Failed to load dashboard data. Please check your connection and refresh.
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-gray-500">No data available.</div>;
  }
  
  // Sort users by creation date to be certain we get the newest ones
  const recentUsers = data.users
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Row: Quick Stats - This grid is already responsive */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Users" value={data.users.length} icon={<Users className="h-5 w-5 text-gray-500" />} />
        <StatCard title="Total Orders" value={data.orders.length} icon={<ShoppingCart className="h-5 w-5 text-gray-500" />} />
        <StatCard title="Total Products" value={data.products.length} icon={<Package className="h-5 w-5 text-gray-500" />} />
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
                // This layout stacks on mobile and becomes a row on larger screens
                <div 
                  key={user._id} 
                  className="flex flex-col items-start gap-2 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                    {user.role}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent users found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
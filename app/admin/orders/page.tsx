'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- Type Definitions (Unchanged) ---
interface User { _id: string; name: string; role: string; }
interface Product { _id: string; name: string; }
interface OrderItem { productId: Product; quantity: number; }
interface Order {
  _id: string;
  buyer: User;
  seller: User;
  items: OrderItem[];
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'completed';
  createdAt: string;
}

// --- SWR Fetcher Function (Unchanged) ---
const fetcher = async ([url, token]: [string, string | null]): Promise<Order[]> => {
  if (!token) throw new Error("Not authorized");
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  // Ensure newest orders are first
  return res.data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// --- Helper Function for Status Badge Colors (Unchanged) ---
const getStatusBadgeColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
    case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
    case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
  }
};

// ==========================================================
// ✅ NEW: Mobile Order Card Component
// ==========================================================
const OrderCard = ({ order }: { order: Order }) => (
  <Card className="mb-4">
    <CardHeader className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-base">Order #{order._id.slice(-6)}</CardTitle>
          <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'dd MMM yyyy, p')}</p>
        </div>
        <Badge className={`capitalize font-semibold ${getStatusBadgeColor(order.status)}`}>
          {order.status}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="p-4 text-sm space-y-3">
      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Buyer:</span>
        <span>{order.buyer?.name || 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Seller:</span>
        <span>{order.seller?.name || 'N/A'}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Items:</span>
        <ul className="list-disc list-inside mt-1 pl-1">
          {order.items.map((item, idx) => (
            <li key={idx} className="text-gray-700">
              {item.productId?.name || 'Deleted Product'} <span className="text-gray-500">x{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

// ==========================================================
// ✅ MODIFIED: Main View All Orders Page Component
// ==========================================================
export default function ViewAllOrdersPage() {
  const [isMobile, setIsMobile] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const swrKey = token ? [`${apiUrl}/api/admin/orders`, token] : null;

  const { data: orders, error, isLoading } = useSWR<Order[]>(swrKey, fetcher);

  // Safely determine screen size on the client
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500">Failed to load order data.</div>;
  }
  if (!orders || orders.length === 0) {
    return <div className="text-center h-24 text-gray-500">No orders found in the system.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All System Orders</h2>
      
      {/* Conditional Rendering based on screen size */}
      {isMobile ? (
        // --- Mobile View: List of Cards ---
        <div>
          {orders.map((order) => <OrderCard key={order._id} order={order} />)}
        </div>
      ) : (
        // --- Desktop View: Table ---
        <div className="border rounded-lg bg-white dark:bg-gray-800 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-xs text-gray-500">#{order._id.slice(-6)}</TableCell>
                  <TableCell>
                      <div className="font-medium">{order.buyer?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500 capitalize">{order.buyer?.role || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                      <div className="font-medium">{order.seller?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500 capitalize">{order.seller?.role || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                      <ul className="list-disc list-inside text-sm">
                          {order.items.map((item, idx) => (
                              <li key={idx} className="text-gray-700">
                                  {item.productId?.name || 'Deleted Product'} <span className="text-gray-500">x{item.quantity}</span>
                              </li>
                          ))}
                      </ul>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                      {format(new Date(order.createdAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`capitalize font-semibold ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
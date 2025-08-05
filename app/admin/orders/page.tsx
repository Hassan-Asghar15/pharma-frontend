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

// --- Type Definitions ---
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

// --- SWR Fetcher Function ---
const fetcher = async ([url, token]: [string, string | null]): Promise<Order[]> => {
  if (!token) throw new Error("Not authorized");
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

// --- Helper Function for Status Badge Colors ---
const getStatusBadgeColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// ==========================================================
// Main View All Orders Page Component
// ==========================================================
export default function ViewAllOrdersPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const swrKey = token ? [`${apiUrl}/api/admin/orders`, token] : null;

  const { data: orders, error, isLoading } = useSWR<Order[]>(swrKey, fetcher);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500">Failed to load order data.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">All System Orders</h2>
      <div className="border rounded-lg bg-white">
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
            {orders && orders.length > 0 ? orders.map((order) => (
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
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-gray-500">No orders found in the system.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
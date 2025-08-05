'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, CheckCircle, Truck, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- Type Definitions ---
interface User { name: string; }
interface Product { name: string; }
interface OrderItem { productId: Product; quantity: number; }
interface Order {
  _id: string;
  seller: User;
  items: OrderItem[];
  createdAt: string;
  status: 'shipped' | 'completed';
  isShippedBySeller: boolean;
  isConfirmedByBuyer: boolean;
}

// --- Reusable SWR fetcher ---
const fetcher = async ([url, token]: [string, string | null]) => {
  if (!token) throw new Error("Not authorized");
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export default function ShopkeeperDeliveryPage() {
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: orders, error, isLoading } = useSWR<Order[]>(
    isClient && token ? [`${apiUrl}/api/orders/my`, token] : null,
    fetcher
  );

  const deliveryOrders = orders?.filter(o => o.status === 'shipped' || o.status === 'completed');

  // ✅ THIS FUNCTION IS NOW COMPLETE
  const handleConfirmDelivery = async (orderId: string) => {
    if (!token) {
      toast.error("You must be logged in to confirm delivery.");
      return;
    }
    setLoadingOrderId(orderId);
    try {
      await axios.put(
        `${apiUrl}/api/orders/confirm-delivery/${orderId}`,
        {}, // No data needs to be sent in the body
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Delivery confirmed successfully!");
      // This tells SWR to re-fetch the order list, which will update the UI
      mutate([`${apiUrl}/api/orders/my`, token]);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || "Failed to confirm delivery.";
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const renderContent = () => {
    if (!isClient || isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-500 py-20">Error loading your deliveries. Please try again later.</div>;
    }

    if (!deliveryOrders || deliveryOrders.length === 0) {
      return (
        <div className="text-center py-20 flex flex-col items-center">
            <Truck className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No Deliveries in Transit</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Orders that have been shipped by distributors will appear here.</p>
        </div>
      );
    }

    // ✅ THE JSX FOR DISPLAYING ORDERS IS NOW COMPLETE
    return (
      <div className="space-y-4">
        {deliveryOrders.map(order => (
          <div key={order._id} className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Order #{order._id.slice(-6)} from {order.seller?.name || 'Distributor'}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                        {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm")}
                    </p>
                </div>
                {/* Status Indicator */}
                {order.isConfirmedByBuyer ? (
                    <div className="flex items-center text-green-500 font-semibold text-sm">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Received
                    </div>
                ) : order.isShippedBySeller ? (
                    <div className="flex items-center text-blue-500 dark:text-blue-400 text-sm font-medium">
                        <Truck className="w-4 h-4 mr-1.5" /> In Transit
                    </div>
                ) : (
                    <div className="flex items-center text-gray-500 text-sm font-medium">
                        <Warehouse className="w-4 h-4 mr-1.5" /> Awaiting Shipment
                    </div>
                )}
            </div>
            {/* Action Button: Confirm Delivery */}
            {order.isShippedBySeller && !order.isConfirmedByBuyer && (
                <div className="mt-4 border-t pt-4 dark:border-gray-600">
                    <Button 
                        onClick={() => handleConfirmDelivery(order._id)} 
                        disabled={loadingOrderId === order._id}
                        className="w-full sm:w-auto"
                    >
                        {loadingOrderId === order._id ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</>
                        ) : (
                            "Confirm Delivery Received"
                        )}
                    </Button>
                </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Delivery Status</h2>
        {renderContent()}
    </div>
  );
}
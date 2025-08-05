"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import axios, { AxiosError } from "axios";
import { format } from "date-fns";
import { CheckCircle, Truck, AlertTriangle } from "lucide-react";

interface Product {
  name: string;
}

interface OrderItem {
  productId: Product;
  quantity: number;
}

interface Buyer {
  name: string;
}

interface Order {
  _id: string;
  buyer: Buyer;
  items: OrderItem[];
  createdAt: string;
  isShippedBySeller: boolean;
  isConfirmedByBuyer: boolean;
}

const fetcher = async ([url, token]: [string, string]): Promise<Order[]> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default function DeliveryStatusPage() {
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const token = isClient ? localStorage.getItem("token") : null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const swrKey = token ? [`${apiUrl}/api/orders/incoming`, token] : null;
  const {
    data: orders,
    error: swrError,
    isLoading,
  } = useSWR<Order[], AxiosError>(swrKey, fetcher);

  const handleMarkAsShipped = async (orderId: string) => {
    setLoadingOrderId(orderId);
    setErrorState(null);
    mutate(
      swrKey,
      (currentOrders: Order[] | undefined) =>
        currentOrders?.map((o: Order) =>
          o._id === orderId ? { ...o, isShippedBySeller: true } : o
        ),
      false
    );

    try {
      await axios.put(
        `${apiUrl}/api/orders/mark-shipped/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mutate(swrKey);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage =
        error.response?.data?.message || "An unknown error occurred.";
      setErrorState(
        `Failed to ship order #${orderId.slice(-5)}: ${errorMessage}`
      );
      mutate(swrKey);
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Delivery Management
      </h2>

      {errorState && (
        <div className="flex items-center p-3 mb-4 text-sm text-red-600 bg-red-100 rounded-lg border border-red-300" role="alert">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="font-medium">{errorState}</span>
        </div>
      )}

      {!isClient ? (
        <p className="text-gray-500">Loading...</p>
      ) : isLoading ? (
        <p className="text-gray-500">Loading orders...</p>
      ) : swrError ? (
        <p className="text-red-500">Error loading orders. Please refresh the page.</p>
      ) : !orders || orders.length === 0 ? (
        <p className="text-gray-500">No incoming orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-900 font-semibold mb-2">
                    Order #{order._id.slice(-5)} from {order.buyer.name}
                  </h3>
                  <ul className="text-gray-700 text-sm mb-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.productId.name} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                  <p className="text-gray-500 text-xs mb-2">
                    {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {order.isShippedBySeller && order.isConfirmedByBuyer ? (
                    <div className="flex items-center justify-end text-green-600 font-semibold text-sm">
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Delivered
                    </div>
                  ) : order.isShippedBySeller ? (
                    <div className="flex items-center justify-end text-yellow-600 text-sm font-medium">
                      <Truck className="w-4 h-4 mr-1.5" /> Shipped
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMarkAsShipped(order._id)}
                      disabled={loadingOrderId === order._id}
                      className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm text-white font-semibold shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {loadingOrderId === order._id
                        ? "Marking..."
                        : "Mark as Shipped"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

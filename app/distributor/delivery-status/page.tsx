"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import axios, { AxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle, Truck, PackageCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Type Definitions ---
interface User { name: string; }
interface Product { name: string; }
interface OrderItem { productId: Product; quantity: number; }
interface OrderAsBuyer { status: string; _id: string; seller: User; items: OrderItem[]; createdAt: string; isShippedBySeller: boolean; isConfirmedByBuyer: boolean; }
interface OrderAsSeller { status: string; _id: string; buyer: User; items: OrderItem[]; createdAt: string; isShippedBySeller: boolean; isConfirmedByBuyer: boolean; }

// --- Reusable SWR Fetcher ---
const fetcher = async ([url, token]: [string, string | null]) => {
    if (!token) throw new Error("Not authorized");
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

// --- Main Component ---
export default function DistributorDeliveryPage() {
    const [isClient, setIsClient] = useState(false);
    const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
    const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const token = isClient ? localStorage.getItem("token") : null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // SWR hook for INCOMING orders (from Companies)
    const incomingKey = token ? [`${apiUrl}/api/orders/my`, token] : null;
    const { data: incomingOrders, error: incomingError, isLoading: isLoadingIncoming } = useSWR<OrderAsBuyer[]>(
        activeTab === 'incoming' && isClient ? incomingKey : null,
        fetcher
    );

    // SWR hook for OUTGOING orders (to Shopkeepers)
    const outgoingKey = token ? [`${apiUrl}/api/orders/incoming`, token] : null;
    const { data: outgoingOrders, error: outgoingError, isLoading: isLoadingOutgoing } = useSWR<OrderAsSeller[]>(
        activeTab === 'outgoing' && isClient ? outgoingKey : null,
        fetcher
    );

    const handleConfirmDelivery = async (orderId: string) => {
        if (!token) return toast.error("You must be logged in.");
        setLoadingOrderId(orderId);
        try {
            await axios.put(`${apiUrl}/api/orders/confirm-delivery/${orderId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Delivery confirmed!");
            mutate(incomingKey);
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            toast.error(error.response?.data?.message || "Confirmation failed.");
        } finally {
            setLoadingOrderId(null);
        }
    };

    const handleMarkAsShipped = async (orderId: string) => {
        if (!token) return toast.error("You must be logged in.");
        setLoadingOrderId(orderId);
        try {
            await axios.put(`${apiUrl}/api/orders/mark-shipped/${orderId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Order marked as shipped!");
            mutate(outgoingKey);
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            toast.error(error.response?.data?.message || "Update failed.");
        } finally {
            setLoadingOrderId(null);
        }
    };

    const renderTabContent = () => {
        if (!isClient) {
            return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
        }

        // --- INCOMING TAB ---
        if (activeTab === 'incoming') {
            if (isLoadingIncoming) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
            if (incomingError) return <p className="text-red-500 text-center py-10">Error loading incoming deliveries.</p>;
            
            const filteredOrders = incomingOrders?.filter(o => o.status === 'shipped' || o.status === 'completed') || [];
            if (filteredOrders.length === 0) return <p className="text-gray-500 text-center py-10">No deliveries in transit from companies.</p>;

            return (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <div key={order._id} className="rounded-lg border bg-white p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <h3 className="font-semibold text-gray-800">Order #{order._id.slice(-6)} from {order.seller?.name || 'Company'}</h3>
                                <p className="text-gray-500 text-xs mt-1">{format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm")}</p>
                            </div>
                            <div className="w-full sm:w-auto flex-shrink-0">
                                {order.isConfirmedByBuyer ? (
                                    <div className="flex items-center justify-end text-green-600 font-semibold text-sm"><CheckCircle className="w-4 h-4 mr-1.5" /> Received</div>
                                ) : (
                                    <Button onClick={() => handleConfirmDelivery(order._id)} disabled={loadingOrderId === order._id} size="sm" className="w-full sm:w-auto">
                                        {loadingOrderId === order._id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</> : "Confirm Delivery"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // --- OUTGOING TAB ---
        if (activeTab === 'outgoing') {
            if (isLoadingOutgoing) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
            if (outgoingError) return <p className="text-red-500 text-center py-10">Error loading outgoing shipments.</p>;

            const filteredOrders = outgoingOrders?.filter(o => o.status === 'approved' || o.status === 'shipped' || o.status === 'completed') || [];
            if (filteredOrders.length === 0) return <p className="text-gray-500 text-center py-10">No approved orders to ship to shopkeepers.</p>;

            return (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <div key={order._id} className="rounded-lg border bg-white p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <h3 className="font-semibold text-gray-800">Order #{order._id.slice(-6)} to {order.buyer?.name || 'Shopkeeper'}</h3>
                                <p className="text-gray-500 text-xs mt-1">{format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm")}</p>
                            </div>
                            <div className="w-full sm:w-auto flex-shrink-0">
                                {order.isShippedBySeller ? (
                                    <div className="flex items-center justify-end text-yellow-600 text-sm font-medium"><Truck className="w-4 h-4 mr-1.5" /> Shipped</div>
                                ) : (
                                    <Button onClick={() => handleMarkAsShipped(order._id)} disabled={loadingOrderId === order._id} size="sm" className="w-full sm:w-auto">
                                        {loadingOrderId === order._id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Shipping...</> : "Mark as Shipped"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Delivery Management</h2>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('outgoing')} className={`whitespace-nowrap flex items-center px-1 py-4 border-b-2 font-medium text-sm ${activeTab === 'outgoing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <Truck className="w-5 h-5 mr-2" /> Outgoing Shipments
                    </button>
                    <button onClick={() => setActiveTab('incoming')} className={`whitespace-nowrap flex items-center px-1 py-4 border-b-2 font-medium text-sm ${activeTab === 'incoming' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <PackageCheck className="w-5 h-5 mr-2" /> Incoming Deliveries
                    </button>
                </nav>
            </div>
            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
}
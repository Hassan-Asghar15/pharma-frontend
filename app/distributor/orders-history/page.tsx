'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import io, { Socket } from 'socket.io-client'; // 👈 Import socket.io

// ✅ Import all necessary UI components and icons
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, MessageSquare, Send, X } from 'lucide-react';

// --- Type Definitions ---
interface OrderItem { productId: { _id: string; name: string; } | null; quantity: number; }
interface Order { _id: string; seller: { _id: string; name: string; role: string; } | null; items: OrderItem[]; status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'completed'; createdAt: string; }
// ✅ Add Message type definition
interface Message { _id: string; senderId: string; receiverId: string; roomId: string; message: string; timestamp: string; }

// --- Helper Functions ---
const getStatusBadgeColor = (status: Order['status']) => { /* ... your existing color logic ... */ };
const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Global socket instance
let socket: Socket | null = null;


// ==========================================================
// Main Page Component
// ==========================================================
export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ✅ Add all state variables needed for the chat modal
  const [chatOpen, setChatOpen] = useState(false);
  const [chatReceiver, setChatReceiver] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ This useEffect handles the main data fetching for orders. It is from your working code.
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("You must be logged in to view your orders.");
        router.push('/auth/login');
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/my`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to fetch orders');
        }
        const data = await res.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []); // Run once on mount

  // ✅ Add useEffect hooks for socket management
  useEffect(() => {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001");
    return () => { if (socket) socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (!socket || !currentRoomId) return;
    socket.emit('joinRoom', { roomId: currentRoomId });
    const handleReceiveMessage = (incomingMessage: Message) => {
      if (incomingMessage.roomId === currentRoomId) {
        setMessages((prev) => [...prev, incomingMessage]);
      }
    };
    socket.on('receiveMessage', handleReceiveMessage);
    return () => {
      if (socket) {
        socket.emit('leaveRoom', { roomId: currentRoomId });
        socket.off('receiveMessage', handleReceiveMessage);
      }
    };
  }, [currentRoomId]);

  useEffect(() => { if (messages.length) { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); } }, [messages]);

  // ✅ Add functions to handle chat operations
  const openChat = async (receiver: { id: string; name: string }) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setChatReceiver(receiver);
    setChatOpen(true);
    setMessages([]);
    try {
      const roomRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/room/${receiver.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!roomRes.ok) throw new Error('Failed to get room ID');
      const { roomId } = await roomRes.json();
      setCurrentRoomId(roomId);
      const messagesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!messagesRes.ok) throw new Error('Failed to fetch messages');
      const data = await messagesRes.json();
      setMessages(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to open chat");
    }
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    const senderId = localStorage.getItem("userId");
    if (!token || !senderId || !newMessage.trim() || !chatReceiver || !currentRoomId) return;
    const payload = { senderId, receiverId: chatReceiver.id, roomId: currentRoomId, message: newMessage };
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setNewMessage("");
    } catch (err) {
      toast.error("Failed to send message.");
    }
  };

  if (loading) { /* ... same as before ... */ }
  if (error) { /* ... same as before ... */ }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center mb-6">
        <Link href="/distributor/browse-companies" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Order History</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-gray-600 dark:text-gray-400">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="relative rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order ID: #{order._id.slice(-6)}</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
                    Order to: {order.seller?.name || "Unknown Company"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Date: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge className={`text-white capitalize ${getStatusBadgeColor(order.status)}`}>
                  {order.status}
                </Badge>
              </div>
              <div className="mt-4 border-t pt-4 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items Ordered:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-800 dark:text-gray-200">
                  {order.items.map((item, index) => (
                    <li key={item.productId?._id || index}>
                      {item.productId?.name || "Product Name Unavailable"} (Qty: {item.quantity})
                    </li>
                  ))}
                </ul>
              </div>

              {/* ✅ UPDATED CHAT BUTTON: This now calls the `openChat` function */}
              {order.seller && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-4 right-4"
                  onClick={() => {
                    // This explicit check tells TypeScript it's safe to proceed.
                    if (order.seller) {
                      openChat({
                        id: order.seller._id,
                        name: order.seller.name || "Unknown Company"
                      });
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Company
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ✅ ADDED CHAT MODAL: This is the JSX for the pop-up chat window */}
      {chatOpen && chatReceiver && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl h-[85vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Chat with {chatReceiver.name}</h2>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {messages.map((msg) => (
                <div key={msg._id} className={`flex flex-col ${localStorage.getItem("userId") === msg.senderId ? "items-end" : "items-start"}`}>
                  <div className={`max-w-md px-4 py-2 rounded-lg text-sm shadow-md ${localStorage.getItem("userId") === msg.senderId ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                    <p>{msg.message}</p>
                    <div className="text-xs mt-1 text-right opacity-70">{formatTimestamp(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t p-3 flex items-center gap-2">
              <input type="text" className="flex-1 border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
              <Button onClick={sendMessage}><Send className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { Order } from "@/types/order";
import { Send, MessageSquare, X } from "lucide-react";
import { formatTimestamp } from "@/utils/formatDate";

let socket: Socket | null = null;

interface Message {
  _id: string; senderId: string; receiverId: string; roomId: string; message: string; timestamp: string;
}

// ✅ Best practice to rename the component for clarity.
export default function DistributorIncomingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatReceiver, setChatReceiver] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // No changes are needed for any of the state, useEffect hooks, or helper functions.
  // They are all perfectly reusable.

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
    } catch (err) {
      console.error("Failed to open chat", err);
    }
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    const senderId = localStorage.getItem("userId");
    if (!token || !senderId || !newMessage.trim() || !chatReceiver || !currentRoomId) return;
    const payload = { senderId, receiverId: chatReceiver.id, roomId: currentRoomId, message: newMessage };
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage("");
    } catch (err) {
      console.error("Network error during sendMessage:", err);
    }
  };
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchIncomingOrders(token); else setLoading(false);
  }, []);

  // ✅ This function calls the same API endpoint, which is correct because the
  // backend automatically handles the user's role.
  const fetchIncomingOrders = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/incoming`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", });
      const data = await res.json();
      setOrders(data);
    } catch (err) { console.error("Error fetching orders:", err); } 
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId: string, status: "approved" | "rejected") => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }), });
      fetchIncomingOrders(token);
    } catch (error) { console.error("Failed to update status", error); }
  };

  useEffect(() => {
    if (messages.length) { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }
  }, [messages]);

  // ✅ The entire JSX can be reused. "Incoming Orders" is still the correct title.
  // The logic for displaying `order.buyer.name` will now correctly show the shopkeeper's name.
  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Incoming Orders</h1>
      {loading ? (<p>Loading...</p>) : orders.length === 0 ? (<p>No incoming orders found.</p>) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="relative rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">Order from: {order.buyer?.name || "Unknown Buyer"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email: {order.buyer?.email || "N/A"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">Role: {order.buyerRole}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status: {order.status}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date: {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => updateStatus(order._id, "approved")} className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm">Approve</button>
                  <button onClick={() => updateStatus(order._id, "rejected")} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm">Reject</button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Items:</p>
                <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-200">
                  {order.items.map((item) => (<li key={item.productId?._id || item.productId?.name}>{(item.productId && item.productId.name) || "Unknown Product"} (Qty: {item.quantity})</li>))}
                </ul>
              </div>
              <button
                className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!order.buyer?._id}
                onClick={() => { if (order.buyer?._id) { openChat({ id: order.buyer._id, name: order.buyer.name || "Unknown Buyer" }); } }}
              >
                <MessageSquare className="inline w-4 h-4 mr-1" /> Chat
              </button>
            </div>
          ))}
        </div>
      )}
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
              <input name="messageInput" type="text" className="flex-1 border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
              <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"><Send className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ✅ FINAL, DEFINITIVE, REAL-TIME VERSION: app/messages/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { Send } from "lucide-react";
import { formatTimestamp } from "@/utils/formatDate";

let socket: Socket | null = null;

interface Message {
  _id: string; senderId: string; receiverId: string; roomId: string; message: string; timestamp: string;
}

interface User {
  _id: string; name: string;
}

export default function CompanyMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [distributors, setDistributors] = useState<User[]>([]);
  const [activeReceiver, setActiveReceiver] = useState<User | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null); // State to hold the correct roomId
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Effect 1: Manages the socket CONNECTION lifecycle
  useEffect(() => {
    socket = io("http://localhost:5001");
    return () => { if (socket) socket.disconnect(); };
  }, []);

  // Effect 2: Manages joining rooms and MESSAGE LISTENERS
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
  }, [currentRoomId]); // Re-runs when you select a new chat

  // Fetch the list of conversations once
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const fetchChatList = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } });
        const data: User[] = await res.json();
        setDistributors(data);
      } catch (err) { console.error("Failed to fetch conversations"); }
    };
    fetchChatList();
  }, []);
  
  // This function runs when a user is clicked in the sidebar
  const handleSelectChat = async (receiver: User) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActiveReceiver(receiver);
    setLoadingMessages(true);
    setMessages([]); // Clear previous conversation

    try {
      // 1. Get the correct, consistent roomId from the backend
      const roomRes = await fetch(`http://localhost:5001/api/messages/room/${receiver._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!roomRes.ok) throw new Error('Failed to get room ID');
      const { roomId } = await roomRes.json();
      setCurrentRoomId(roomId); // This triggers the useEffect to join the room and listen

      // 2. Fetch the message history for that room
      const messagesRes = await fetch(`http://localhost:5001/api/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!messagesRes.ok) throw new Error('Failed to fetch messages');
      const data = await messagesRes.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to load chat:", err);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  const handleSendMessage = async () => {
    const token = localStorage.getItem("token");
    const senderId = localStorage.getItem("userId");
    if (!token || !senderId || !newMessage.trim() || !activeReceiver || !currentRoomId) return;
    
    const payload = { senderId, receiverId: activeReceiver._id, roomId: currentRoomId, message: newMessage };
    
    try {
      await fetch("http://localhost:5001/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setNewMessage(""); // Clear the input; the message will appear via the socket listener
    } catch (err) {
      console.error("Message send failed.", err);
    }
  };

  useEffect(() => {
    if (messages.length) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 shadow rounded-lg flex h-[85vh]">
        {/* Sidebar for distributor list */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white p-4 border-b dark:border-gray-700">Chats</h3>
          <ul className="space-y-1 p-2 overflow-y-auto flex-1">
            {distributors.length > 0 ? (
              distributors.map((d) => (
                <li key={d._id} onClick={() => handleSelectChat(d)} className={`cursor-pointer p-3 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 text-sm ${activeReceiver?._id === d._id ? "bg-blue-200 dark:bg-blue-800 font-semibold" : ""}`}>
                  {d.name}
                </li>
              ))
            ) : (
              <li className="p-3 text-sm text-gray-500">No conversations found.</li>
            )}
          </ul>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {activeReceiver ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Chat with {activeReceiver.name}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                {loadingMessages ? (<p className="m-auto text-gray-500">Loading messages...</p>) : (
                  messages.map((msg) => (
                    <div key={msg._id} className={`flex flex-col ${localStorage.getItem("userId") === msg.senderId ? "items-end" : "items-start"}`}>
                      <div className={`max-w-md px-4 py-2 rounded-lg text-sm shadow-md ${localStorage.getItem("userId") === msg.senderId ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                        <p>{msg.message}</p>
                        <div className="text-xs mt-1 text-right opacity-70">{formatTimestamp(msg.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t p-3 flex items-center gap-2">
                <input name="messageInput" type="text" className="flex-1 border rounded px-3 py-2 dark:bg-gray-700 dark:text-white" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} />
                <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"><Send className="w-5 h-5" /></button>
              </div>
            </>
          ) : (<div className="flex-1 flex items-center justify-center text-gray-500"><p>Select a chat to start messaging.</p></div>)}
        </div>
      </div>
    </main>
  );
}
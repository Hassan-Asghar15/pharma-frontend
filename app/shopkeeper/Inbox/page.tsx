'use client';

import React, { useEffect, useState, useRef, JSX, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { Send, Truck, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// A utility function to format timestamps
const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- Type Definitions ---
interface Message {
  _id: string; senderId: string; receiverId: string; roomId: string; message: string; timestamp: string;
}
interface ConversationPartner {
  _id:string; name: string; role: 'distributor';
}

// Global socket instance
let socket: Socket | null = null;

export default function ShopkeeperInboxPage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [activePartner, setActivePartner] = useState<ConversationPartner | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // Effect 1: Initialize socket and get user ID. Runs ONCE.
  useEffect(() => {
    // Connect to the socket server
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001");
    }

    const userId = localStorage.getItem("userId");
    setMyUserId(userId);

    if (userId) {
      socket.emit('registerUser', userId);
    }
    
    // Disconnect on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // Effect 2: Manage socket message listeners. This is the corrected part.
  useEffect(() => {
    if (!socket) return;
    
    // ✅ FIX: This function handles all incoming messages.
    // It is defined once and attached once to prevent duplicates.
    const handleReceiveMessage = (incomingMessage: Message) => {
        setMessages((prevMessages) => {
            // Check if the incoming message belongs to the currently active room
            // Using a functional update to get the latest `currentRoomId` from state
            if(incomingMessage.roomId === currentRoomId) {
                return [...prevMessages, incomingMessage];
            }
            // If not, just return the previous state
            return prevMessages;
        });
    };

    // Remove any existing listeners before adding a new one to be safe.
    socket.off('receiveMessage');
    socket.on('receiveMessage', handleReceiveMessage);

    // No cleanup function needed here as we want the listener to be active globally
    // as long as the component is mounted.
  }, [currentRoomId]); // Re-run if currentRoomId changes to ensure the check inside is up-to-date.


  // Effect 3: Fetch the list of all conversations
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data: ConversationPartner[] = await res.json();
        setConversations(data);
      } catch (err) { console.error(err); }
    };
    fetchConversations();
  }, []);

  // Effect 4: Scroll to the bottom of the chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handler Functions ---

  const handleSelectChat = useCallback(async (partner: ConversationPartner) => {
    const token = localStorage.getItem("token");
    if (!token || !socket) return;
    
    // Leave the previous room if there was one
    if (currentRoomId) {
        socket.emit('leaveRoom', { roomId: currentRoomId });
    }

    setActivePartner(partner);
    setLoadingMessages(true);
    setMessages([]);

    try {
      const roomRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/room/${partner._id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!roomRes.ok) throw new Error('Failed to get room ID');
      const { roomId } = await roomRes.json();
      
      socket.emit('joinRoom', { roomId }); // Join the new room
      setCurrentRoomId(roomId);

      const messagesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!messagesRes.ok) throw new Error('Failed to fetch messages');
      const data = await messagesRes.json();
      setMessages(data);
    } catch (err) { console.error("Failed to load chat:", err); } 
    finally { setLoadingMessages(false); }
  }, [currentRoomId]);

  const handleSendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!token || !myUserId || !newMessage.trim() || !activePartner || !currentRoomId) return;
    const payload = { senderId: myUserId, receiverId: activePartner._id, roomId: currentRoomId, message: newMessage };
    try {
      // The message is sent to the server, and the server will broadcast it.
      // We no longer need to manually add it to the state here, as the `receiveMessage` listener will handle it.
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setNewMessage("");
    } catch (err) { console.error("Message send failed.", err); }
  };
  
  const handleGoBack = () => {
    if (socket && currentRoomId) {
        socket.emit('leaveRoom', { roomId: currentRoomId });
    }
    setActivePartner(null);
    setCurrentRoomId(null);
    setMessages([]);
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 shadow rounded-lg flex overflow-hidden">
      {/* Sidebar for conversation list - Conditionally hidden on mobile */}
      <div className={`
        ${activePartner ? 'hidden' : 'flex'} 
        md:flex w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex-col
      `}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white p-4 border-b dark:border-gray-700 flex-shrink-0">Conversations</h3>
        <ul className="space-y-1 p-2 overflow-y-auto flex-1">
          {conversations.length > 0 ? (
            conversations.map((partner) => (
              <li 
                key={partner._id} 
                onClick={() => handleSelectChat(partner)} 
                className={`flex items-center gap-3 cursor-pointer p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm ${
                  activePartner?._id === partner._id ? "bg-blue-100 dark:bg-blue-900 font-semibold" : ""
                }`}
              >
                <Truck className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="dark:text-gray-200 truncate">{partner.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">Distributor</p>
                </div>
              </li>
            ))
          ) : (
            <li className="p-3 text-sm text-gray-500">No conversations found.</li>
          )}
        </ul>
      </div>

      {/* Main Chat area - Conditionally hidden on mobile */}
      <div className={`
        ${activePartner ? 'flex' : 'hidden'} 
        md:flex flex-1 flex-col
      `}>
        {activePartner ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={handleGoBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Truck className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white truncate">{activePartner.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-gray-50 dark:bg-gray-900">
              {loadingMessages ? (
                <div className="m-auto flex flex-col items-center gap-2 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span>Loading messages...</span>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id} className={`flex flex-col ${myUserId === msg.senderId ? "items-end" : "items-start"}`}>
                    <div className={`max-w-xl px-4 py-2 rounded-lg text-sm shadow-md ${
                      myUserId === msg.senderId 
                        ? "bg-blue-500 text-white" 
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}>
                      <p className="break-words">{msg.message}</p>
                      <div className="text-xs mt-1 text-right opacity-70">{formatTimestamp(msg.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t p-3 flex items-center gap-2 bg-white dark:bg-gray-800 flex-shrink-0">
              <input 
                type="text" 
                className="flex-1 border rounded px-3 py-2 bg-transparent dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Type your message..." 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} 
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Select a conversation from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
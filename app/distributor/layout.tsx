"use client";

import React, { useState, useEffect, ReactNode, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell, Menu, LogOut, Settings, MessageSquare, LayoutDashboard,
  ShoppingBag, ListOrdered, Truck, Package, ClipboardList, ShoppingCart, Sparkles, Loader2, X
} from "lucide-react";
import { CartProvider, useCart } from "@/context/cartprovider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// --- Type Definitions ---
interface Profile {
  name: string;
  email: string;
  profilePic: string | null;
  _id?: string;
}
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/distributor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/distributor/browse-companies", label: "Browse Products", icon: ShoppingBag },
  { href: "/distributor/add-update-products", label: "Products", icon: Package },
  { href: "/distributor/orders-history", label: "My Orders", icon: ListOrdered },
  { href: "/distributor/incoming-orders", label: "Incoming Orders", icon: ClipboardList },
  { href: "/distributor/delivery-status", label: "Delivery Status", icon: Truck },
  { href: "/distributor/Inbox", label: "Inbox", icon: MessageSquare },
];

function CartIcon() {
  const { cartItems } = useCart();
  return (
    <Link href="/distributor/cart" title="Cart">
      <div className="relative">
        <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {cartItems.length > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-1 text-xs rounded-full">
            {cartItems.length}
          </Badge>
        )}
      </div>
    </Link>
  );
}

// ==========================================================
// Sub-Component: RecommendationsPopup (UPDATED AND FIXED)
// ==========================================================
function RecommendationsPopup({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  useEffect(() => {
    if (!show || !userId || !token) {
        setGrouped({});
        return;
    }

    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const recRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recommendations/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!recRes.ok) throw new Error("Failed to fetch recommendations");
        
        const recData = await recRes.json();
        /*
         * EXPECTED DATA from backend:
         * {
         *   recommendations: [
         *     { productId: "...", productName: "...", sellerId: "...", sellerName: "..." },
         *     ...
         *   ]
         * }
        */

        if (!recData.recommendations || recData.recommendations.length === 0) {
            setGrouped({});
            setIsLoading(false);
            return;
        }

        const namesMap: Record<string, string> = {};
        const groupedData = recData.recommendations.reduce((acc: Record<string, any[]>, recommendation: any) => {
            // Note: The key 'distributorId' from the Node.js response is treated as a generic 'sellerId' here.
            const { distributorId: sellerId, distributorName: sellerName, productId, productName } = recommendation;
            
            if (!sellerId) return acc;

            if (!acc[sellerId]) acc[sellerId] = [];
            acc[sellerId].push({ _id: productId, name: productName });
            
            if (!namesMap[sellerId]) {
                namesMap[sellerId] = sellerName || 'Unknown Company';
            }

            return acc;
        }, {});

        setSellerNames(namesMap);
        setGrouped(groupedData);

      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        setGrouped({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [show, userId, token, onClose]);

  if (!show) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full right-0 mt-2 w-80 max-h-[80vh] bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col"
    >
      <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
        <h3 className="text-md font-semibold text-gray-800 dark:text-white flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-green-500"/> Recommended for You
        </h3>
        <button onClick={onClose} className="text-sm font-medium text-red-500 hover:text-red-600">Close</button>
      </div>
      <div className="flex-grow overflow-y-auto p-3">
        {isLoading ? (
            <div className="flex justify-center items-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recommendations yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([sellerId, products]) => (
              <div key={sellerId} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                <h4 className="text-md font-semibold mb-2 text-blue-600 dark:text-blue-400">
                    {sellerNames[sellerId]}
                </h4>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  {products.map(p => (<li key={p._id}>• {p.name}</li>))}
                </ul>
                <Button
                  onClick={() => alert(`Reordering all from ${sellerNames[sellerId]}`)}
                  className="mt-3 w-full bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  size="sm"
                >
                  Reorder All
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================
// Main Layout Component
// ==========================================================
export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const showCartIcon = pathname.startsWith("/distributor/browse-companies") || pathname.startsWith("/distributor/menu");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const role = localStorage.getItem("role");
      
      if (!token || !userId || role !== 'distributor') {
        return router.push("auth/login");
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("❌ Failed to fetch profile", err);
        handleLogout();
      }
    };
    fetchProfile();
  }, [router]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleLogout = () => {
    localStorage.clear();
    router.push("auth/login");
  };

  const getPageTitle = () => {
    const currentItem = navItems.find(item => pathname === item.href);
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.startsWith("/distributor/menu")) return "Company Products";
    return currentItem ? currentItem.label : "Dashboard";
  };

  return (
    <CartProvider>
      <main className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <div className={`bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"} flex flex-col`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 h-16">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {sidebarOpen ? "PharmaCRM" : <img src="/logo.png" className="mx-auto w-7 h-7" alt="Logo" />}
            </span>
            <button onClick={toggleSidebar}><Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" /></button>
          </div>
          <nav className="flex-1 flex flex-col p-2 space-y-1">
            {navItems.map((item) => (
              <SidebarItem key={item.label} icon={React.createElement(item.icon, {className: "w-5 h-5"})} label={item.label} href={item.href} open={sidebarOpen} isActive={pathname === item.href} />
            ))}
          </nav>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between bg-white dark:bg-gray-800 shadow p-4 h-16">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{getPageTitle()}</h1>
            <div className="flex items-center space-x-4">
              {showCartIcon && <CartIcon />}
              <button className="relative">
                <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-1 text-xs">1</Badge>
              </button>
              <div className="relative">
                <button title="Recommendations" onClick={() => setShowRecommendations(!showRecommendations)}>
                  <Sparkles className="w-6 h-6 text-green-600" />
                </button>
                <RecommendationsPopup show={showRecommendations} onClose={() => setShowRecommendations(false)} />
              </div>
              <Link href="/distributor/Inbox" title="Inbox"><MessageSquare className="w-6 h-6 text-gray-700 dark:text-gray-300" /></Link>
              <div className="flex items-center space-x-2">
                {user?.profilePic ? <img src={user.profilePic} alt="User" className="w-8 h-8 rounded-full object-cover border" /> : <div className="w-8 h-8 rounded-full bg-gray-300" />}
                <span className="text-sm font-medium text-gray-700 dark:text-white hidden sm:block">{user?.name || "..."}</span>
              </div>
              <Link href="/distributor/setting" title="Settings"><Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" /></Link>
              <button onClick={handleLogout} title="Logout"><LogOut className="w-6 h-6 text-red-500" /></button>
            </div>
          </header>

          <div className="p-6 flex-1 overflow-y-auto">{children}</div>

          <footer className="text-center text-sm text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700">
            © {new Date().getFullYear()} PharmaCRM. All rights reserved.
          </footer>
        </div>
      </main>
    </CartProvider>
  );
}

function SidebarItem({ icon, label, href, open, isActive }: { icon: React.ReactNode; label: string; href: string; open: boolean; isActive: boolean }) {
  return (
    <Link href={href}>
      <div className={`flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white dark:bg-blue-700' : 'text-gray-700 dark:text-gray-300'}`}>
        <div className={isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>{icon}</div>
        {open && <span className="font-medium">{label}</span>}
      </div>
    </Link>
  );
}
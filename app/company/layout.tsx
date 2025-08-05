"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Package,
  LogOut,
  Settings,
  MessageSquare,
  ClipboardList,
  LayoutDashboard,
  Truck
} from "lucide-react";

interface Profile {
  name: string;
  email: string;
  profilePic: string | null;
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const router = useRouter();

  // --- All your existing logic is correct and remains unchanged ---
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5001/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) { console.error("❌ Failed to fetch profile", err); }
    };
    fetchProfile();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("auth/login");
  };

  return (
    <main className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {/* Sidebar */}
        <div className={`bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"} flex flex-col`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {sidebarOpen ? "PharmaCRM" : <img src="/logo.png" className="mx-auto w-7 h-7 mb-4" alt="Pharma CRM" />}
            </span>
            <button onClick={toggleSidebar}>
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <nav className="flex flex-col p-2 space-y-2">
            <SidebarItem icon={<LayoutDashboard />} label="Dashboard" href="/company" open={sidebarOpen} />
            <SidebarItem icon={<Package />} label="Products" href="/company/add-update-products" open={sidebarOpen} />
            <SidebarItem icon={<ClipboardList />} label="Orders" href="/company/incoming-orders" open={sidebarOpen} />
            <SidebarItem icon={<Truck />} label="Delivery Status" href="/company/delivery-status" open={sidebarOpen} />
            <SidebarItem icon={<MessageSquare />} label="Inbox" href="/company/inbox" open={sidebarOpen} />
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 shadow p-4">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Company Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="relative" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
              </button>
              <Link href="/company/inbox">
                <MessageSquare className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </Link>
              <div className="flex items-center space-x-2">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="User" className="w-8 h-8 rounded-full object-cover border"/>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300" />
                )}
                <span className="text-sm font-medium text-gray-800">{user?.name || "..."}</span>

              </div>
              <Link href="/company/settings">
                <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </Link>
              <button onClick={handleLogout}>
                <LogOut className="w-6 h-6 text-red-500" />
              </button>
            </div>
          </div>

          {/* ✅ THE FIX IS HERE: Restored the original Notifications JSX */}
          {showNotifications && (
            <div className="absolute top-16 right-6 w-64 bg-white dark:bg-gray-800 shadow-lg rounded p-4 z-50">
              <p className="text-gray-800 dark:text-white font-medium mb-2">Notifications</p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li>Order #123 approved</li>
                <li>Message from Distributor</li>
                <li>Order #122 rejected</li>
              </ul>
            </div>
          )}

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          <footer className="text-center text-sm text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700">
            © {new Date().getFullYear()} PharmaCRM. All rights reserved.
          </footer>
        </div>
    </main>
  );
}

function SidebarItem({ icon, label, href, open }: { icon: React.ReactNode; label: string; href: string; open: boolean }) {
  return (
    <Link href={href}>
      <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
        <div className="text-gray-700 dark:text-gray-300">{icon}</div>
        {open && <span className="text-gray-700 dark:text-gray-300">{label}</span>}
      </div>
    </Link>
  );
}
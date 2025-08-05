'use client';

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell, Menu, LogOut, LayoutDashboard,
  Users, ShoppingCart, Package, Loader2, X
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// --- Type Definitions ---
interface Profile { name: string; email: string; }
interface NavItem { href: string; label: string; icon: React.ElementType; }

// --- Navigation Items Array ---
const navItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Manage Users", icon: Users },
    { href: "/admin/orders", label: "View All Orders", icon: ShoppingCart },
    { href: "/admin/products", label: "View All Products", icon: Package },
];

// --- Sidebar Item Component (Slightly modified for better click handling) ---
function SidebarItem({ icon, label, href, isActive, onClick, expanded }: { icon: React.ReactNode; label: string; href: string; isActive: boolean; onClick?: () => void; expanded: boolean; }) {
  const content = (
    <div
      className={`flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700'
          : 'text-gray-700 dark:text-gray-300'
      }`}
    >
      {icon}
      <span className={`overflow-hidden transition-all ${expanded ? "w-40 ml-3" : "w-0"}`}>
        {label}
      </span>
    </div>
  );

  return href === "#" ? (
    <div onClick={onClick}>{content}</div>
  ) : (
    <Link href={href} onClick={onClick}>
      {content}
    </Link>
  );
}

// ==========================================================
// Main Admin Layout Component
// ==========================================================
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<Profile | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // On mobile, we want the sidebar to be closed by default.
  useEffect(() => {
    setIsClient(true);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    toast.info("You have been logged out.");
    router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== 'admin') {
        toast.error("Access Denied. Redirecting to login.");
        router.push("/auth/login");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setUser(await res.json());
        } else {
          toast.error("Session expired. Please log in again.");
          handleLogout();
        }
      } catch (err) {
        console.error("Failed to fetch admin profile", err);
        toast.error("Failed to connect to the server.");
        handleLogout();
      }
    };

    fetchProfile();
  }, [router, handleLogout]);

  const getPageTitle = () => {
    if (pathname === '/admin') return "Dashboard";
    const currentItem = navItems.find(item => item.href !== '/admin' && pathname.startsWith(item.href));
    return currentItem ? currentItem.label : "Admin Panel";
  };
  
  // Display a loading spinner until the client-side code has run
  // This prevents layout shifts and authentication flashes
  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* --- START: Sidebar --- */}
      {/* Backdrop for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      
      {/* The actual sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-30 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-md
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarOpen ? 'w-64' : 'md:w-20'}
      `}>
        <div className="flex items-center justify-between p-4 border-b h-16">
          <span className={`text-xl font-bold text-gray-800 dark:text-white transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
            Admin Panel
          </span>
          {/* Close button for mobile */}
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md md:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          {navItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={React.createElement(item.icon, { className: 'w-6 h-6 flex-shrink-0' })}
              label={item.label}
              href={item.href}
              isActive={pathname.startsWith(item.href)}
              expanded={sidebarOpen}
              // Close sidebar on navigation on mobile
              onClick={() => { if(window.innerWidth < 768) setSidebarOpen(false) }}
            />
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <SidebarItem
            icon={<LogOut className="w-6 h-6 text-red-500" />}
            label="Logout"
            href="#"
            isActive={false}
            onClick={handleLogout}
            expanded={sidebarOpen}
          />
        </div>
      </aside>
      {/* --- END: Sidebar --- */}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- START: Header --- */}
        <header className="flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm p-4 h-16 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {/* Hamburger menu - always visible */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md text-gray-600 dark:text-gray-300">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative text-gray-600 dark:text-gray-300">
              <Bell className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <img
                src="/admin-profile-icon.jpg"
                alt="Admin Profile"
                className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
              <span className="text-sm font-medium hidden sm:block text-gray-700 dark:text-gray-200">
                {user?.name || "Admin"}
              </span>
            </div>
          </div>
        </header>
        {/* --- END: Header --- */}

        {/* --- START: Main Content --- */}
        <main className="p-4 md:p-6 flex-1 overflow-y-auto">
          {children}
        </main>
        {/* --- END: Main Content --- */}

        <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700">
          © {new Date().getFullYear()} PharmaCRM. All rights reserved.
        </footer>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
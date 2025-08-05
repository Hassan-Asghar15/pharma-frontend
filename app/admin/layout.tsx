'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell, Menu, LogOut, LayoutDashboard,
  Users, ShoppingCart, Package, Loader2
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

// --- Sidebar Item Component ---
function SidebarItem({ icon, label, href, open, isActive, onClick }: { icon: React.ReactNode; label: string; href: string; open: boolean; isActive: boolean; onClick?: () => void; }) {
  const content = (
    <div className={`flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
        isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 dark:text-gray-300'
      }`}
      onClick={onClick}
    >
      <div>{icon}</div>
      {open && <span className="font-medium">{label}</span>}
    </div>
  );
  return href === "#" ? content : <Link href={href}>{content}</Link>;
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

  useEffect(() => {
    setIsClient(true);
    
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
           handleLogout();
        }
      } catch (err) { console.error("Failed to fetch admin profile", err); }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/login");
  };

  const getPageTitle = () => {
    // Correctly handle the base dashboard route
    if (pathname === '/admin') return "Dashboard";
    const currentItem = navItems.find(item => item.href !== '/admin' && pathname.startsWith(item.href));
    return currentItem ? currentItem.label : "Admin Panel";
  };
  
  if (!isClient) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    );
  }

  return (
      <main className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <div className={`bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"} flex flex-col`}>
            <div className="flex items-center justify-between p-4 border-b h-16">
              <span className={`text-xl font-bold ${!sidebarOpen && 'hidden'}`}>Admin Panel</span>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md"><Menu className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 p-2 space-y-1">
              {navItems.map((item) => (
                  <SidebarItem 
                      key={item.label}
                      icon={React.createElement(item.icon, { className: 'w-5 h-5' })} 
                      label={item.label} 
                      href={item.href} 
                      open={sidebarOpen}
                      // Use startsWith for nested routes to stay active
                      isActive={pathname.startsWith(item.href)}
                  />
              ))}
            </nav>
            <div className="p-2 border-t">
                 <SidebarItem 
                    icon={<LogOut className="w-5 h-5 text-red-500"/>} 
                    label="Logout" 
                    href="#" 
                    open={sidebarOpen}
                    isActive={false}
                    onClick={handleLogout}
                  />
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center justify-between bg-white dark:bg-gray-800 shadow p-4 h-16">
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
              <div className="flex items-center space-x-4">
                  {/* ✅ ThemeToggle component has been removed */}
                  <button className="relative"><Bell className="w-6 h-6" /></button>
                  <div className="flex items-center space-x-2">
                    {/* ✅ Replaced the div with an img tag for the profile picture */}
                    <img 
                      src="/admin-profile-icon.jpg" // Assumes the image is in your `public` folder
                      alt="Admin Profile" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                    <span className="text-sm font-medium hidden sm:block">{user?.name || "Admin"}</span>
                  </div>
              </div>
            </header>
            <div className="p-6 flex-1 overflow-y-auto">
              {children}
            </div>
            <footer className="text-center text-sm text-gray-400 py-4 border-t">© {new Date().getFullYear()} PharmaCRM. All rights reserved.</footer>
          </div>
          <Toaster richColors position="top-right" />
      </main>
  );
}
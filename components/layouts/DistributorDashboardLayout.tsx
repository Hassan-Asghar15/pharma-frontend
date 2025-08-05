// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useRouter } from 'next/navigation';
// // Import the icons you need for the sidebar and header
// import { Home, Package, ListOrdered, Inbox, Truck, Bell, MessageSquare, Settings, LogOut } from 'lucide-react';
// import { CartIcon } from '@/components/ui/CartIcon';
// import { ThemeToggle } from '@/components/ui/ThemeToggle';

// // Define the navigation links for the sidebar
// const sidebarNavItems = [
//   { title: "Dashboard", href: "/distributor/dashboard", icon: Home },
//   { title: "Browse Products", href: "/distributor/browse-companies", icon: Package },
//   { title: "My Orders", href: "/distributor/orders", icon: ListOrdered },
//   { title: "Inbox", href: "/distributor/inbox", icon: Inbox },
//   { title: "Delivery Status", href: "/distributor/delivery-status", icon: Truck },
// ];

// export function DistributorDashboardLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const router = useRouter();

//   // Logic to show the cart icon only on relevant pages
//   const showCartIcon = pathname.startsWith('/distributor/browse-companies') || 
//                        pathname.startsWith('/distributor/menu') ||
//                        pathname.startsWith('/distributor/cart');

//   const handleLogout = () => {
//     localStorage.clear();
//     router.push('/auth/login');
//   };

//   return (
//     <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900">
//       {/* Sidebar Navigation */}
//       <aside className="hidden w-64 flex-col border-r bg-white p-4 dark:bg-gray-950 dark:border-gray-800 md:flex">
//         <div className="mb-8 text-2xl font-bold text-gray-900 dark:text-gray-50">PharmaCRM</div>
//         <nav className="flex flex-col space-y-2 flex-grow">
//           {sidebarNavItems.map((item) => (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
//                 pathname.startsWith(item.href)
//                   ? 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
//                   : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
//               }`}
//             >
//               <item.icon className="mr-3 h-5 w-5" />
//               {item.title}
//             </Link>
//           ))}
//         </nav>
//       </aside>

//       {/* Main Content Area */}
//       <div className="flex flex-1 flex-col">
//         {/* Main Header */}
//         <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-950 dark:border-gray-800">
//           <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Distributor Dashboard</h1>
          
//           {/* ✅ THIS SECTION NOW MATCHES YOUR DESIGN */}
//           <div className="flex items-center space-x-4">
//             {/* Conditional Cart Icon from the top header */}
//             {showCartIcon && <CartIcon />}
            
//             {/* Theme Toggle from the top header */}
//             <ThemeToggle />

//             {/* Icons from your main dashboard header */}
//             <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative">
//               <Bell className="h-5 w-5" />
//               {/* Example notification badge */}
//               <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-950"></span>
//             </button>
//             <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
//               <MessageSquare className="h-5 w-5" />
//             </button>
//             {/* This could be a user profile icon/avatar */}
//             <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
//                 {/* Placeholder for an avatar image or initials */}
//             </div>
//             <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
//               <Settings className="h-5 w-5" />
//             </button>
//             <button 
//               onClick={handleLogout} 
//               className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500 dark:text-red-400"
//               aria-label="Logout"
//             >
//               <LogOut className="h-5 w-5" />
//             </button>
//           </div>
//         </header>

//         <main className="flex-1">{children}</main>
//       </div>
//     </div>
//   );
// }
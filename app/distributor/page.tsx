'use client';

import { useEffect, useState } from "react";
import { Users, Package, Clock, CheckCircle, Loader2 } from "lucide-react"; // Importing relevant icons

// Define the shape of the data we expect from the backend for a distributor
interface DistributorStats {
  totalOrders: number;
  approvedOrders: number;
  pendingOrders: number;
  totalShopkeepers: number;
}

// ===================================================================
// StatCard Helper Component (for the four cards)
// ===================================================================
function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl shadow-md p-6 bg-white dark:bg-gray-800 flex items-start justify-between">
      <div>
        <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
        <p className="text-4xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}


// ===================================================================
// Main Page Component (This is what you see in the screenshot)
// ===================================================================
export default function DistributorDashboardPage() {
  // Initialize state with the correct structure and default values
  const [stats, setStats] = useState<DistributorStats>({
    totalOrders: 0,
    approvedOrders: 0,
    pendingOrders: 0,
    totalShopkeepers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // This calls the single, correct endpoint from your backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || "Failed to load dashboard data");
        }

        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        console.error("Failed to load distributor dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  // This is the JSX that renders the "Distributor Overview" section
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Distributor Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Incoming Orders (from Shopkeepers)" 
          value={stats.totalOrders} 
          icon={Package}
          color="text-blue-500 bg-blue-100 dark:bg-blue-900/50" 
        />
        <StatCard 
          title="Total Shopkeeper Clients" 
          value={stats.totalShopkeepers} 
          icon={Users}
          color="text-green-500 bg-green-100 dark:bg-green-900/50" 
        />
        <StatCard 
          title="Pending Shopkeeper Orders" 
          value={stats.pendingOrders} 
          icon={Clock}
          color="text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50" 
        />
        <StatCard 
          title="Approved Shopkeeper Orders" 
          value={stats.approvedOrders} 
          icon={CheckCircle}
          color="text-purple-500 bg-purple-100 dark:bg-purple-900/50" 
        />
      </div>
    </div>
  );
}
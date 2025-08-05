// app/company/page.tsx (Company Dashboard Home)

"use client";

import { useEffect, useState } from "react";

export default function CompanyDashboardPage() {
  const [stats, setStats] = useState({
    totalDistributors: 0,
    totalOrders: 0,
    approvedOrders: 0,
    pendingOrders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchDashboardData = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Overview</h1>

      {loading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Distributors" value={stats.totalDistributors} color="bg-blue-600" />
          <StatCard title="Total Orders" value={stats.totalOrders} color="bg-green-600" />
          <StatCard title="Approved Orders" value={stats.approvedOrders} color="bg-purple-600" />
          <StatCard title="Pending Orders" value={stats.pendingOrders} color="bg-yellow-500" />
        </div>
      )}

      {/* <section className="text-sm text-center text-gray-400 dark:text-gray-500 mt-16">
        © {new Date().getFullYear()} PharmaCRM. All rights reserved.
      </section> */}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg shadow-lg p-6 text-white ${color}`}>
      <h3 className="text-md font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

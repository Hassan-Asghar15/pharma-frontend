'use client';

import React, { useState, useEffect, JSX } from 'react';
import Link from 'next/link';
import { Truck, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

// Define the shape of a Distributor user object
interface Distributor {
  _id: string;
  name: string;
}

// Reusable UI Component for a single distributor card
const DistributorCard = ({ distributor }: { distributor: Distributor }): JSX.Element => (
  <Link href={`/shopkeeper/menu/${distributor._id}`} className="block group">
    <Card className="h-full hover:shadow-xl hover:border-green-600 dark:hover:border-green-500 transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <div className="bg-green-100 dark:bg-gray-800 p-3 rounded-lg">
          <Truck className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">{distributor.name}</CardTitle>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400">
            View Product Catalog →
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  </Link>
);

// The Main Page Component
export default function BrowseDistributorsPage(): JSX.Element {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDistributors = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required. Please log in.");
        setError("Authentication failed.");
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/role/distributor`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Could not fetch distributors.");
        }
        const data = await res.json();
        setDistributors(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDistributors();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-blue-500" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-800 dark:text-red-300">An Error Occurred</h3>
        <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Our Distributor Network
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          Select a trusted distributor to order your supplies.
        </p>
      </div>
      {distributors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {distributors.map((distributor) => (
            <DistributorCard key={distributor._id} distributor={distributor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Distributors Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">No distributors are currently available.</p>
        </div>
      )}
    </div>
  );
}
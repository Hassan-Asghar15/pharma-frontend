'use client'; // This page needs to read the token from localStorage

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Define the shape of a company user
interface Company {
  _id: string;
  name: string;
  email: string;
}

// UI Component for a single company card
const CompanyCard = ({ company }: { company: Company }) => (
  // This link now correctly points to the 'menu' page
  <Link href={`/distributor/menu/${company._id}`} className="block group">
    <Card className="h-full hover:shadow-xl hover:border-blue-600 dark:hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <div className="bg-blue-100 dark:bg-gray-800 p-3 rounded-lg">
          <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">{company.name}</CardTitle>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            View Menu & Place Order →
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  </Link>
);

// The Main Page Component
export default function BrowseCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read the token directly from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError("Authentication failed. Please log in to view companies.");
      setIsLoading(false);
      return;
    }

    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/companies`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Could not fetch company data.");
        }

        const data = await res.json();
        setCompanies(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []); // Runs once on page load

  // --- UI for Loading State ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- UI for Error State ---
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-800 dark:text-red-300">An Error Occurred</h3>
        <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
        <Link href="/auth/login" className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          Go to Login
        </Link>
      </div>
    );
  }

  // --- Main UI for Success State ---
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Our Network of Companies
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Select a trusted partner to browse their product catalog.
          </p>
        </div>

        {companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.map((company) => (
              <CompanyCard key={company._id} company={company} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Companies Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">There are currently no companies available to order from.</p>
          </div>
        )}
      </div>
    </div>
  );
}
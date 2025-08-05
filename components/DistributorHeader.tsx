'use client'; 

import Link from 'next/link';
import { CartIcon } from '@/components/ui/CartIcon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function DistributorHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/distributor/browse-companies" className="text-xl font-bold text-gray-900 dark:text-gray-50">
          Pharma-Distributor
        </Link>
        <nav className="flex items-center space-x-2">
          <ThemeToggle />
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}
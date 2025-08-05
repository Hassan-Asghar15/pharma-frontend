'use client';

import { useCart } from '@/context/cartprovider';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Link 
      href="/distributor/cart" 
      className="relative flex items-center justify-center rounded-full h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="View shopping cart"
    >
      <ShoppingCart className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      
      {totalItems > 0 && (
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
          {totalItems}
        </div>
      )}
    </Link>
  );
};
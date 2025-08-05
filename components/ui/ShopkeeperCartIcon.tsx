'use client';

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useShopkeeperCart } from '@/context/shopkeepercartprovider';
import { Badge } from "@/components/ui/badge";

export function ShopkeeperCartIcon() {
  const { totalItems } = useShopkeeperCart();
  
  return (
    <Link href="/shopkeeper/cart" title="Cart">
      <div className="relative">
        <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {totalItems > 0 && (
           <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-1 text-xs rounded-full">
             {totalItems}
           </Badge>
        )}
      </div>
    </Link>
  );
}
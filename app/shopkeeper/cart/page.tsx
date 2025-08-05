'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useShopkeeperCart, CartItem } from '@/context/shopkeepercartprovider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShopkeeperCartPage() {
  const { cartItems, clearCart, totalItems, updateQuantity, removeFromCart } = useShopkeeperCart();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const groupedByDistributor = cartItems.reduce((acc, item) => {
    const distributorId = item.product.listedBy._id;
    if (!acc[distributorId]) {
      acc[distributorId] = { distributorName: item.product.listedBy.name, items: [] };
    }
    acc[distributorId].items.push(item);
    return acc;
  }, {} as Record<string, { distributorName: string; items: CartItem[] }>);

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("You must be logged in to place an order.");
      router.push('/auth/login');
      return;
    }
    setIsLoading(true);

    const orderPayload = {
      orders: Object.keys(groupedByDistributor).map(distributorId => ({
        seller: distributorId,
        sellerRole: 'distributor', // ✅ The seller is a distributor
        items: groupedByDistributor[distributorId].items.map(cartItem => ({
          productId: cartItem.product._id,
          quantity: cartItem.quantity,
        })),
      })),
    };
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to place orders.");
      }

      toast.success("Order requests sent successfully!");
      clearCart();
      router.push('/shopkeeper/orders-history');
    } catch (error: any) {
      toast.error("Order Failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto text-center py-20 flex flex-col items-center">
        <ShoppingBag className="h-24 w-24 text-gray-300 dark:text-gray-600 mb-6" />
        <h1 className="text-3xl font-bold">Your Cart is Empty</h1>
        <p className="mt-2 text-gray-500">Looks like you haven't added any products yet.</p>
        <Button onClick={() => router.push('/shopkeeper/browse-distributors')} className="mt-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Link href="/shopkeeper/browse-products" className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-4xl font-bold">Review Your Order</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedByDistributor).map(([distributorId, group]) => (
            <Card key={distributorId} className="dark:bg-gray-800/50">
              <CardHeader><CardTitle>Order Request for: {group.distributorName}</CardTitle></CardHeader>
              <CardContent className="divide-y dark:divide-gray-700">
                {group.items.map(item => (
                  <div key={item.product._id} className="flex flex-wrap justify-between items-center py-4 gap-4">
                    <div className="flex items-center gap-4">
                      <img src={item.product.image ? `${process.env.NEXT_PUBLIC_API_URL}/${item.product.image.replace(/\\/g, '/')}` : '/placeholder.png'} alt={item.product.name} className="w-16 h-16 rounded-md object-cover" />
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-gray-500">Pack Size: {item.product.packSize}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" variant="outline" className="h-8 w-8 rounded-full"
                          onClick={() => {
                            const newQuantity = item.quantity - 1;
                            const minQuantity = item.product.minOrderQuantity || 1;
                            if (newQuantity >= minQuantity) {
                              updateQuantity(item.product._id, newQuantity);
                            } else {
                              toast.warning(`Minimum order for ${item.product.name} is ${minQuantity}.`);
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-lg w-10 text-center">{item.quantity}</span>
                        <Button 
                          size="icon" variant="outline" className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="rounded-full h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                        onClick={() => {
                          removeFromCart(item.product._id);
                          toast.error(`${item.product.name} removed from cart.`);
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-1 sticky top-24">
            <Card className="dark:bg-gray-800">
                <CardHeader><CardTitle>Final Summary</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Separate orders</span>
                        <span>{Object.keys(groupedByDistributor).length}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-4 border-t dark:border-gray-700">
                        <span>Total Items</span>
                        <span>{totalItems}</span>
                      </div>
                    </div>
                    <Button size="lg" className="w-full mt-6 font-bold" onClick={handlePlaceOrder} disabled={isLoading}>
                        {isLoading ? 'Sending Requests...' : 'Confirm & Request Orders'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
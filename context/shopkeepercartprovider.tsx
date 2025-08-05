'use client';
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

// You can re-use the same Product/CartItem types
export interface Product {
    segment: string;
    batchNumber: string; _id: string; name: string; image?: string; packSize: string; minOrderQuantity: number; section?: string; listedBy: { _id: string; name: string; }; /* ...other fields */ 
}
export interface CartItem { product: Product; quantity: number; }
interface CartContextType { cartItems: CartItem[]; addToCart: (product: Product, quantity: number) => void; removeFromCart: (productId: string) => void; updateQuantity: (productId: string, quantity: number) => void; clearCart: () => void; getDistributorCartItems: (distributorId: string) => CartItem[]; totalItems: number; }

export const ShopkeeperCartContext = createContext<CartContextType | undefined>(undefined);

export const ShopkeeperCartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  useEffect(() => { 
    // ✅ Uses a unique key for the shopkeeper's cart
    const stored = localStorage.getItem('shopkeeperCart'); 
    if (stored) setCartItems(JSON.parse(stored)); 
  }, []);
  
  useEffect(() => { 
    localStorage.setItem('shopkeeperCart', JSON.stringify(cartItems)); 
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) { return prev.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + quantity } : item); }
      return [...prev, { product, quantity }];
    });
  };
  const removeFromCart = (productId: string) => setCartItems(prev => prev.filter(item => item.product._id !== productId));
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCartItems(prev => prev.map(item => item.product._id === productId ? { ...item, quantity } : item));
  };
  const clearCart = () => { setCartItems([]); localStorage.removeItem('shopkeeperCart'); };
  const getDistributorCartItems = (distributorId: string) => cartItems.filter(item => item.product.listedBy._id === distributorId);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ShopkeeperCartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getDistributorCartItems: getDistributorCartItems, totalItems }}>
      {children}
    </ShopkeeperCartContext.Provider>
  );
};

// A custom hook for the shopkeeper's cart
export const useShopkeeperCart = () => { 
  const ctx = useContext(ShopkeeperCartContext); 
  if (!ctx) throw new Error('useShopkeeperCart must be used within a ShopkeeperCartProvider'); 
  return ctx; 
};
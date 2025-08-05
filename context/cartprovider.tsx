'use client';
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
// Define your types here or import from a types file
export interface Product {
  batchNumber: string;
  segment: string; _id: string; name: string; image?: string; packSize: string; minOrderQuantity: number; section?: string; listedBy: { _id: string; name: string; }; /* ...other fields */ 
}
export interface CartItem { product: Product; quantity: number; }
interface CartContextType { cartItems: CartItem[]; addToCart: (product: Product, quantity: number) => void; removeFromCart: (productId: string) => void; updateQuantity: (productId: string, quantity: number) => void; clearCart: () => void; getCompanyCartItems: (companyId: string) => CartItem[]; totalItems: number; }

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  useEffect(() => { const stored = localStorage.getItem('distributorCart'); if (stored) setCartItems(JSON.parse(stored)); }, []);
  useEffect(() => { localStorage.setItem('distributorCart', JSON.stringify(cartItems)); }, [cartItems]);

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
  const clearCart = () => { setCartItems([]); localStorage.removeItem('distributorCart'); };
  const getCompanyCartItems = (companyId: string) => cartItems.filter(item => item.product.listedBy._id === companyId);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCompanyCartItems, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};
export const useCart = () => { const ctx = useContext(CartContext); if (!ctx) throw new Error('useCart must be used within a CartProvider'); return ctx; };
'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios, { AxiosError } from 'axios';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Type Definition for a Product (Unchanged) ---
interface Product {
  _id: string;
  name: string;
  packSize: string;
  section: string;
  listedBy: {
    _id: string;
    name: string;
    role: 'company' | 'distributor';
  };
  createdAt: string;
}

// --- SWR Fetcher Function (Unchanged) ---
const fetcher = async ([url, token]: [string, string | null]): Promise<Product[]> => {
  if (!token) throw new Error("Not authorized");
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  // Sort by newest first
  return res.data.sort((a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// --- Helper for Role Badge Variant (Unchanged) ---
const getRoleBadgeVariant = (role: 'company' | 'distributor') => {
  return role === 'company' ? 'default' : 'secondary';
};

// ==========================================================
// ✅ NEW: Mobile Product Card Component
// ==========================================================
const ProductCard = ({ product, onDeleteClick }: { product: Product; onDeleteClick: (product: Product) => void; }) => (
  <Card className="mb-4">
    <CardHeader className="flex flex-row items-start justify-between p-4">
      <div>
        <CardTitle className="text-base">{product.name}</CardTitle>
        <p className="text-xs text-gray-500">Listed on {format(new Date(product.createdAt), 'dd MMM yyyy')}</p>
      </div>
      <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => onDeleteClick(product)}>
        <Trash2 className="h-5 w-5 text-red-500" />
      </Button>
    </CardHeader>
    <CardContent className="p-4 text-sm space-y-3 border-t">
      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Section:</span>
        <span className="text-right">{product.section || 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Pack Size:</span>
        <span className="text-right">{product.packSize || 'N/A'}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-600">Listed By:</span>
        {product.listedBy ? (
          <div className="text-right">
            <p>{product.listedBy.name}</p>
            <Badge variant={getRoleBadgeVariant(product.listedBy.role)} className="capitalize text-xs mt-1">
              {product.listedBy.role}
            </Badge>
          </div>
        ) : (
          <span className="text-gray-400">User Deleted</span>
        )}
      </div>
    </CardContent>
  </Card>
);


// ==========================================================
// ✅ MODIFIED: Main View All Products Page Component
// ==========================================================
export default function ViewAllProductsPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const swrKey = token ? [`${apiUrl}/api/admin/products`, token] : null;

  const { data: products, error, isLoading, mutate } = useSWR<Product[]>(swrKey, fetcher);
  
  // Safely determine screen size on the client
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleDeleteProduct = async () => {
    if (!productToDelete || !token) return;
    const promise = axios.delete(`${apiUrl}/api/products/${productToDelete._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    toast.promise(promise, {
      loading: 'Deleting product...',
      success: () => {
        mutate(); // Re-fetch list
        setProductToDelete(null); // Close dialog
        return `Product '${productToDelete.name}' has been deleted.`;
      },
      error: (err: AxiosError<{ message: string }>) => {
        return err.response?.data?.message || "Failed to delete product.";
      }
    });
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500">Failed to load product data.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All Platform Products</h2>

      {(!products || products.length === 0) ? (
        <div className="text-center h-24 text-gray-500">No products found in the system.</div>
      ) : isMobile ? (
        // --- Mobile View: List of Cards ---
        <div>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} onDeleteClick={setProductToDelete} />
          ))}
        </div>
      ) : (
        // --- Desktop View: Table ---
        <div className="border rounded-lg bg-white dark:bg-gray-800 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Pack Size</TableHead>
                <TableHead>Listed By</TableHead>
                <TableHead>Date Listed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-gray-600">{product.section || 'N/A'}</TableCell>
                  <TableCell className="text-gray-600">{product.packSize || 'N/A'}</TableCell>
                  <TableCell>
                    {product.listedBy ? (
                      <div>
                        <div className="font-medium">{product.listedBy.name}</div>
                        <Badge variant={getRoleBadgeVariant(product.listedBy.role)} className="capitalize text-xs mt-1">
                          {product.listedBy.role}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-gray-400">User Deleted</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {format(new Date(product.createdAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Product (Unchanged) */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <ShieldAlert className="h-6 w-6 mr-2 text-red-500" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product <span className="font-semibold text-gray-800 dark:text-gray-100">"{productToDelete?.name}"</span> from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700">
              Yes, delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
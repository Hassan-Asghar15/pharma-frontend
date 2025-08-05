'use client';

import React,{ useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { AxiosError } from 'axios';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Type Definition for a Product ---
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

// --- SWR Fetcher Function ---
const fetcher = async ([url, token]: [string, string | null]): Promise<Product[]> => {
  if (!token) throw new Error("Not authorized");
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

// ==========================================================
// Main View All Products Page Component
// ==========================================================
export default function ViewAllProductsPage() {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const swrKey = token ? [`${apiUrl}/api/admin/products`, token] : null;

  const { data: products, error, isLoading, mutate } = useSWR<Product[]>(swrKey, fetcher);

  const handleDeleteProduct = async () => {
    if (!productToDelete || !token) return;
    try {
      // ✅ This endpoint is in your `productRoutes` and requires admin role
      await axios.delete(`${apiUrl}/api/products/${productToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Product '${productToDelete.name}' has been permanently deleted.`);
      setProductToDelete(null); // Close the dialog
      mutate(); // Re-fetch the product list
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || "Failed to delete product.");
    }
  };
  
  const getRoleBadgeVariant = (role: 'company' | 'distributor') => {
    return role === 'company' ? 'default' : 'secondary';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500">Failed to load product data.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">All Platform Products</h2>
      <div className="border rounded-lg bg-white">
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
            {products && products.length > 0 ? products.map((product) => (
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setProductToDelete(product)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-gray-500">No products found in the system.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog for Deleting Product */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <ShieldAlert className="h-6 w-6 mr-2 text-red-500" />
              Are you sure you want to delete this product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product <span className="font-semibold text-gray-800">"{productToDelete?.name}"</span> from the platform. This action cannot be undone.
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
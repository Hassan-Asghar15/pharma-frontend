'use client';

import React, { useState, useEffect, JSX } from 'react';
import { useParams } from 'next/navigation';
import { useCart, Product } from '@/context/cartprovider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ProductCard = ({ product, onViewDetail }: { product: Product, onViewDetail: (p: Product) => void }): JSX.Element => {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:bg-gray-800">
      <CardHeader className="p-0">
        <img 
          src={product.image ? `${process.env.NEXT_PUBLIC_API_URL}/${product.image.replace(/\\/g, '/')}` : '/placeholder.png'} 
          alt={product.name} 
          className="w-full h-48 object-cover" 
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">{product.name}</CardTitle>
        <CardDescription className="mt-1 text-sm">Pack Size: {product.packSize}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={() => onViewDetail(product)}>View Detail</Button>
      </CardFooter>
    </Card>
  );
};

const ProductDetailModal = ({ product, onClose }: { product: Product | null, onClose: () => void }): JSX.Element | null => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setQuantity(product.minOrderQuantity || 1);
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${quantity} x ${product.name} added to cart`);
    onClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>
            {product.packSize}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <img
            src={product.image ? `${process.env.NEXT_PUBLIC_API_URL}/${product.image.replace(/\\/g, '/')}` : '/placeholder.png'}
            alt={product.name}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2">Product Details</h4>
            <div className="text-sm space-y-2">
              <p><strong className="font-medium text-gray-700 dark:text-gray-400">Segment:</strong> {product.segment || 'N/A'}</p>
              <p><strong className="font-medium text-gray-700 dark:text-gray-400">Batch:</strong> {product.batchNumber || 'N/A'}</p>
              <p><strong className="font-medium text-gray-700 dark:text-gray-400">Min. Order Qty:</strong> {product.minOrderQuantity || 1}</p>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <p className="font-medium">Quantity:</p>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(product.minOrderQuantity || 1, q - 1))}><Minus className="h-4 w-4" /></Button>
                <input type="number" value={quantity} readOnly className="w-16 p-2 border rounded-md text-center bg-transparent" />
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" size="lg" className="w-full" onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function CompanyMenuPage(): JSX.Element {
  const { companyId } = useParams() as { companyId: string };
  const [company, setCompany] = useState<any | null>(null);
  const [groupedProducts, setGroupedProducts] = useState<Record<string, Product[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchMenuData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) throw new Error("API URL is not configured. Check your .env.local file.");

        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found. Please log in.");

        const headers = { 'Authorization': `Bearer ${token}` };

        const [companyRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/api/users/${companyId}`, { headers }),
          fetch(`${API_URL}/api/products/company/${companyId}`, { headers })
        ]);

        if (!companyRes.ok) {
          const err = await companyRes.json();
          throw new Error(err.message || "Failed to load company details.");
        }
        if (!productsRes.ok) {
          const err = await productsRes.json();
          throw new Error(err.message || "Failed to load products for this company.");
        }

        const companyData = await companyRes.json();
        const productsData = await productsRes.json();

        setCompany(companyData);

        const productsWithCompanyInfo = productsData.map((p: any) => ({
          ...p,
          listedBy: { _id: companyData._id, name: companyData.name }
        }));

        const groups = productsWithCompanyInfo.reduce((acc: Record<string, Product[]>, product: Product) => {
          const section = product.section || 'General Products';
          if (!acc[section]) acc[section] = [];
          acc[section].push(product);
          return acc;
        }, {});
        setGroupedProducts(groups);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [companyId]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[80vh]"><Loader2 className="h-12 w-12 animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-center p-20 text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold dark:text-white">{company?.name || 'Company'}</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">Pharmaceuticals & Healthcare</p>
        </div>

        <div className="space-y-12">
          {Object.keys(groupedProducts).length > 0 ? Object.entries(groupedProducts).map(([section, products]) => (
            <div key={section}>
              <h2 className="text-3xl font-bold mb-6 border-b pb-3 dark:border-gray-700 dark:text-gray-200">{section}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product: Product) =>
                  <ProductCard key={product._id} product={product} onViewDetail={setSelectedProduct} />
                )}
              </div>
            </div>
          )) : <p className="text-center py-10 text-gray-500">No products found for this company.</p>}
        </div>
      </div>

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}

"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { Product } from "@/types/product";

const initialFormState = {
  name: "",
  genericNumber: "",
  segment: "",
  batchNumber: "",
  cartonSize: "",
  minOrderQuantity: 1,
  packSize: "",
  section: "",
};

export default function DistributorProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductForm, setNewProductForm] = useState(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [learningMaterialFile, setLearningMaterialFile] = useState<File | null>(null);
  const [promotionalMaterialFile, setPromotionalMaterialFile] = useState<File | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editLearningMaterialFile, setEditLearningMaterialFile] = useState<File | null>(null);
  const [editPromotionalMaterialFile, setEditPromotionalMaterialFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  const fetchProducts = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/products/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to fetch products`);
      const data = await res.json();
      setProducts(data);
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    const file = files ? files[0] : null;
    if (name === 'image') setImageFile(file);
    if (name === 'learningMaterial') setLearningMaterialFile(file);
    if (name === 'promotionalMaterial') setPromotionalMaterialFile(file);
  };

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return setError("You must be logged in to add a product.");
    setLoading(true);
    setError(null);
    const formData = new FormData();
    Object.entries(newProductForm).forEach(([key, value]) => formData.append(key, String(value)));
    if (imageFile) formData.append('image', imageFile);
    if (learningMaterialFile) formData.append('learningMaterial', learningMaterialFile);
    if (promotionalMaterialFile) formData.append('promotionalMaterial', promotionalMaterialFile);
    try {
      const res = await fetch(`${API_URL}/api/products`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.message || "Failed to add product"); }
      setNewProductForm(initialFormState);
      setImageFile(null);
      setLearningMaterialFile(null);
      setPromotionalMaterialFile(null);
      (e.target as HTMLFormElement).reset();
      fetchProducts();
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };
  
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditImageFile(null);
    setEditLearningMaterialFile(null);
    setEditPromotionalMaterialFile(null);
    setIsModalOpen(true);
  };
  
  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct) return;
    const { name, value } = e.target;
    setEditingProduct({ ...editingProduct, [name]: value });
  };

  const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    const file = files ? files[0] : null;
    if (name === 'image') setEditImageFile(file);
    if (name === 'learningMaterial') setEditLearningMaterialFile(file);
    if (name === 'promotionalMaterial') setEditPromotionalMaterialFile(file);
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct || !token) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    const fileKeys = ['image', 'learningMaterial', 'promotionalMaterial'];
    Object.entries(editingProduct).forEach(([key, value]) => {
      if (key !== '_id' && key !== '__v' && !fileKeys.includes(key)) {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }
    });
    if (editImageFile) formData.append('image', editImageFile);
    if (editLearningMaterialFile) formData.append('learningMaterial', editLearningMaterialFile);
    if (editPromotionalMaterialFile) formData.append('promotionalMaterial', editPromotionalMaterialFile);
    try {
        const res = await fetch(`${API_URL}/api/products/${editingProduct._id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData });
        if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.message || "Failed to update product"); }
        setIsModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete");
      fetchProducts();
    } catch (err) { alert("Error deleting product"); }
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="mt-1 text-md text-gray-500 dark:text-gray-400">Add, view, and manage your products.</p>
        </div>
        <form onSubmit={handleAddSubmit} className="space-y-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
           <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-4">Add a New Product</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
             {Object.keys(initialFormState).map((field) => (
                <div key={field}>
                  <label htmlFor={`add-${field}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                  <input id={`add-${field}`} name={field} type={field === "minOrderQuantity" ? "number" : "text"} value={(newProductForm as any)[field]} onChange={handleInputChange} required={field === "name" || field === "minOrderQuantity"} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                 <label htmlFor="add-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
                 <input id="add-image" name="image" type="file" onChange={handleFileChange} accept="image/*" className="mt-1 file-input" />
              </div>
              <div>
                 <label htmlFor="add-learningMaterial" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Learning Material</label>
                 <input id="add-learningMaterial" name="learningMaterial" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="mt-1 file-input" />
              </div>
              <div>
                 <label htmlFor="add-promotionalMaterial" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Promotional Material</label>
                 <input id="add-promotionalMaterial" name="promotionalMaterial" type="file" onChange={handleFileChange} accept=".pdf,.zip" className="mt-1 file-input" />
              </div>
           </div>
           {error && <p className="text-sm text-red-500 pt-4">{error}</p>}
           <button type="submit" disabled={loading} className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors">{loading ? "Adding Product..." : "Add Product"}</button>
        </form>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Your Products</h2>
          {loading && products.length === 0 ? (<p>Loading products...</p>) : products.length === 0 ? (<p>No products found.</p>) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <div key={p._id} className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <img src={p.image ? `${API_URL}/${p.image.replace(/\\/g, '/')}` : 'https://via.placeholder.com/300x200?text=No+Image'} alt={p.name} className="w-full h-40 object-cover bg-gray-200 dark:bg-gray-600" />
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{p.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Batch: {p.batchNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Segment: {p.segment}</p>
                    <div className="flex-grow"></div>
                    <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button onClick={() => openEditModal(p)} className="text-sm font-medium text-blue-600 hover:text-blue-500">Edit</button>
                      <button onClick={() => handleDelete(p._id)} className="text-sm font-medium text-red-600 hover:text-red-500">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleEditSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Edit Product: {editingProduct.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Object.keys(initialFormState).map((field) => (
                    <div key={`edit-${field}`}>
                        <label htmlFor={`edit-${field}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                        <input id={`edit-${field}`} name={field} type={field === "minOrderQuantity" ? "number" : "text"} value={(editingProduct as any)[field] || ''} onChange={handleEditInputChange} required={field === "name"} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                ))}
                <div>
                  <label htmlFor="edit-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Change Product Image</label>
                  <input id="edit-image" name="image" type="file" onChange={handleEditFileChange} accept="image/*" className="mt-1 file-input" />
                  {editImageFile && <p className="text-xs text-gray-500 mt-1">New: {editImageFile.name}</p>}
                </div>
                <div>
                  <label htmlFor="edit-learningMaterial" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Change Learning Material</label>
                  <input id="edit-learningMaterial" name="learningMaterial" type="file" onChange={handleEditFileChange} accept=".pdf,.doc,.docx" className="mt-1 file-input" />
                   {editLearningMaterialFile && <p className="text-xs text-gray-500 mt-1">New: {editLearningMaterialFile.name}</p>}
                </div>
                <div>
                  <label htmlFor="edit-promotionalMaterial" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Change Promotional Material</label>
                  <input id="edit-promotionalMaterial" name="promotionalMaterial" type="file" onChange={handleEditFileChange} accept=".pdf,.zip" className="mt-1 file-input" />
                   {editPromotionalMaterialFile && <p className="text-xs text-gray-500 mt-1">New: {editPromotionalMaterialFile.name}</p>}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{loading ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
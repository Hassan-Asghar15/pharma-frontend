// // ✅ app/distributor/recommendation/page.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Loader2 } from "lucide-react";

// interface Product {
//   _id: string;
//   name: string;
//   description: string;
//   price: number;
//   listedBy: string;          // ✅ sellerId
//   listedByRole: string;      // ✅ sellerRole
// }

// export default function RecommendationPage() {
//   const [recommendations, setRecommendations] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);

//   const reorderProduct = async (product: Product) => {
//     const token = localStorage.getItem("token");
//     if (!token) return;

//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           orders: [
//             {
//               productId: product._id,
//               quantity: 1, // default quantity
//               sellerId: product.listedBy,
//               sellerRole: product.listedByRole,
//             },
//           ],
//         }),
//       });

//       if (!res.ok) throw new Error("Failed to reorder");
//       alert("Reorder placed successfully!");
//     } catch (err) {
//       console.error("Reorder failed", err);
//     }
//   };

//   useEffect(() => {
//     const fetchRecommendations = async () => {
//       const userId = localStorage.getItem("userId");
//       const token = localStorage.getItem("token");

//       if (!userId || !token) {
//         console.warn("Missing userId or token");
//         setLoading(false);
//         return;
//       }

//       try {
//         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recommendations/${userId}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch recommendation IDs");

//         const data = await res.json();
//         const productIds = data.recommendations;

//         const productDetailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/bulk`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ productIds })
//         });

//         if (!productDetailsRes.ok) throw new Error("Failed to fetch product details");

//         const productDetails = await productDetailsRes.json();
//         setRecommendations(productDetails);
//       } catch (err) {
//         console.error("Failed to fetch recommendations", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecommendations();
//   }, []);

//   return (
//     <div>
//       <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">AI-Powered Recommendations</h2>

//       {loading ? (
//         <div className="flex justify-center items-center h-40">
//           <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//           {recommendations.map(product => (
//             <Card key={product._id} className="hover:shadow-lg transition-shadow">
//               <CardContent className="p-4">
//                 <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{product.name}</h3>
//                 <p className="text-sm text-gray-500 dark:text-gray-300">{product.description}</p>
//                 <div className="flex items-center justify-between mt-2">
//                   <Badge variant="secondary">Rs. {product.price}</Badge>
//                   <button
//                     className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
//                     onClick={() => reorderProduct(product)}
//                   >
//                     Reorder
//                   </button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// In a types file, e.g., /types/product.ts
export interface Product {
  _id: string;
  name: string;
  genericNumber: string;
  segment: string;
  image?: string; // Make optional as it might not always exist
  batchNumber: string;
  cartonSize: string;
  minOrderQuantity: number;
  packSize: string;
  section: string;
  learningMaterial?: string;
  promotionalMaterial?: string;
  // Add any other fields
}
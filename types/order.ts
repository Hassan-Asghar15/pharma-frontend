export interface Order {
  _id: string;
  status: string;
  buyerRole: string;
  createdAt: string;
  buyer: {
    _id: string;
    name: string;
    email?: string;
  };
  items: {
    quantity: number;
    productId?: {
      _id: string;
      name: string;
    };
  }[];
}

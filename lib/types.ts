// User roles
export type UserRole = "customer" | "vendor" | "delivery" | "admin";

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfile extends User {
  storeName: string;
  storeDescription: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  banner?: string;
  address: string;
  phone: string;
  documentsApproved: boolean;
}

export interface DeliveryPartner extends User {
  phone: string;
  vehicleType: "bike" | "car" | "truck";
  vehicleNumber: string;
  isActive: boolean;
  totalDeliveries: number;
  rating: number;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory: string;
  stock: number;
  vendorId: string;
  vendorName: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

// Order types
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "in-transit"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  deliveryPartnerId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentMethod: "credit_card" | "debit_card" | "wallet" | "cod";
  paymentStatus: "pending" | "paid";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Delivery task
export interface DeliveryTask {
  id: string;
  orderId: string;
  customerId: string;
  vendorId: string;
  vendorName: string;
  deliveryPartnerId?: string;
  items: OrderItem[];
  status:
    | "pending"
    | "accepted"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "failed";
  pickupLocation: Address;
  deliveryLocation: Address;
  createdAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  failureReason?: string;
}

// Vendor application
export interface VendorApplication {
  id: string;
  vendorId?: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: string;
  documents: {
    gstCertificate: string;
    businessRegistration: string;
    bankDetails: string;
    ownerID: string;
  };
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface RegisterVendorData {
  businessName: string;
  storeCategory: string;
  taxId?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  govIdUrl: string;
  businessDocUrl: string;
  logoUrl?: string;
}

export interface VendorProfileData extends RegisterVendorData {
  id: string;
  userId: string;
  status?: string;
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
}

// Review types
export interface Review {
  id: string;
  productId?: string;
  vendorId?: string;
  customerId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "delivery" | "vendor" | "system";
  read: boolean;
  link?: string;
  createdAt: string;
}

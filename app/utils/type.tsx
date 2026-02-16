import { DollarSign, Home, Package, Settings, ShoppingCart, Users, Workflow } from "lucide-react";
import { ImageUrl } from "./imageHelper";


export interface ProductAttribute {
  id: string;
  name: string;
  values: string[];
}

export interface Admin {
  full_name: string;
  email: string;
  password: string;
}

export interface AdminData {
  id: string;
  full_name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface AttributeValue {
  id: string;
  value: string;
}

export interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

export interface Variant {
  sku: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  barcode?: string;
  attributes?: Record<string, string>;
  image_url?: File[];
}

export interface AttributeSelection {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  barcode: string; 
  attributes: Record<string, string>;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  threshold: number;
  images: string[];
}

export interface ProductVariantDetails {
  id: string;
  name: string;
  sku: string;
  barcode: string; 
  attributes: Record<string, string>;
  cost_price: string;
  selling_price: string;
  quantity: number;
  threshold: number;
   image_url?: string | ImageUrl[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  description: string;
  taxable: boolean;
  unit: string;
  hasVariation: boolean;
  images: string[];
  variants: ProductVariant[];
  inventoryValue: number;
  inventoryCost: number;
  totalStock: number;
  totalRevenue: number;
    discount?: Discount;
}

export type CreateProductPayload = {
  name: string;
  brand: string;
  categoryId: string;
  unit: string;
  taxable: boolean;
  description: string;
  images: File[];

  hasVariations: boolean;

  baseSku: string;

  productStock?: {
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    threshold: number;
    barcode: string;
  };

  variants?: {
    name: string;
    sku: string;
    barcode: string;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    threshold: number;
    images: File[];
  }[];
};

export type ProductAttributeState = {
    id: string;
  name: string;
  values: string[];
  attributeId?: string;
};

export interface ProductFormData {
  productName: string;
  brand: string;
  category: string;
  unit: string;
  baseSku: string;
  taxable: boolean;
  description: string;
  images: string[];
  hasVariations: boolean;
  attributes: ProductAttribute[];
  variations: ProductVariant[];
}


export type EditProductFormData = {
  name: string;
  brand: string;
  category: string;
  description: string;
  taxable: boolean;
  unit: string;
  hasVariations: boolean;
};

export interface OrderItemAPI {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  Variant?: {
    sku: string;
    Product?: {
      name: string;
    };
  };
}

export interface OrderPaymentAPI {
  id: string;
  order_id: number;
  method: string;
  amount: number | string;
  reference: string;
  status: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  customer_id: string;
  Customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    is_walk_in?: boolean;
  };
  subtotal: number | string;
  tax_total: number | string;
  discount_total: number | string;
  total_amount: number | string;
  status: string;
  purchase_type: string;
  source: string;
  admin_id: string;
  createdAt: string;
  updatedAt: string;
  OrderItems?: OrderItemAPI[];
  OrderPayments?: OrderPaymentAPI[];  // Changed from OrderPayment to OrderPayments (plural)
  CreditAccount?: { type: string } | null;
  InstallmentPlan?: { id: string; status: string } | null;
}


export interface TopVariant {
  rank: number;
  variant_id: string;

  sku?: string;

  product: {
    id: string;
    name: string;
    brand?: string;
    category: {
      id: string;
      name: string;
    };
  };

  image: string | null;

  sales_metrics: {
    total_quantity: number;
    total_revenue: number;
    total_orders: number;
    average_price: number;
  };

  profit_metrics?: {
    unit_cost: number;
    unit_selling_price: number;
    unit_profit: number;
    total_cost: number;
    total_profit: number;
    profit_margin_percent: number;
  };
}


export interface CartItem {
  id: string;
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  taxable?: boolean;
  image?: string;
  stock?: number;
  productDiscount?: Discount;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  is_walk_in?: boolean;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface Draft {
  id: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: string;
}


export interface InstallmentPayment {
  paymentNumber: number;
  amount?: number;
  date?: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  type?: 'down_payment' | 'installment';
  method?: string;
  notes?: string;
  expectedAmount?: number; 
  paidAmount?: number; 
  paidDate?: string; 
}

export interface InstallmentPlan {
  id: string;
  customer: Customer;  
  total: number;  
  downPayment: number;
  remainingBalance: number;
  numberOfPayments: number;
  amountPerPayment: number;
  paymentFrequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  notes: string;
  payments: InstallmentPayment[];
  status: 'active' | 'completed' | 'defaulted';
  transactionId?: string;  
  customerId?: string; 
  interestRate?: number;
  lateFee?: number;
}

export interface Transaction {
  id: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  taxRate: number;  
  tax: number;
  total: number;
  totalDiscount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'split' | 'installment' | 'credit';
  amountPaid: number;
  change: number;
  timestamp: string;
  synced: boolean;
  status?: 'pending' | 'completed' | 'failed';
  purchaseType?: 'in-store' | 'online';
  installmentPlan?: InstallmentPlan;
  splitPayments?: { method: string; amount: number }[];
  credit?:  {
  waived: true;
  issuedAt: string;
    creditType: 'full' | 'partial';
    creditBalance: number; 
    amountPaidTowardCredit: number; 
}
}

export type DateFilter =
  | "today"
  | "yesterday"
  | "last7"
  | "thisMonth"
  | "lastMonth"
  | "custom";


export interface InstallmentTransaction {
  id: string;
  planId: string;
  paymentNumber: number;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  amountPaid: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentFrequency: 'daily' | 'weekly' | 'monthly';
  numberOfPayments: number;
  amountPerPayment: number;
  downPayment: number;
  remainingBalanceAfter: number;
  timestamp: string;
}



export type Expense = {
  id: string;
  expense_amount: number;
  note: string;
  date: string;
  expense_category_id: string;
  admin_id: string;
  payment_method: string;
  payment_status: string;
  expense_reciept_url: string | null;
  expense_approved_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  expense_category?: { expense_category_id: string; name: string };
  admin?: { id: string; email: string; full_name: string };

};

export interface CompanySettings {
  settings_id: string;
  site_name: string;
  site_logo: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_email: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
}

export type ExpenseCategory = {
  expense_category_id: string;
  name: string;
};

export type TimeFilter = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'custom';

export const loginAttempts = [
            {
              id: 'login-1',
              email: 'admin@business.com',
              device: 'Chrome on Windows',
              location: 'Lagos, Nigeria',
              time: '2024-01-15 10:30:00',
              approvedBy: 'System',
              status: 'approved' as const,
            },
            {
              id: 'login-2',
              email: 'manager@business.com',
              device: 'Safari on iPhone',
              location: 'Abuja, Nigeria',
              time: '2024-01-15 09:15:00',
              approvedBy: 'Admin',
              status: 'approved' as const,
            },
            {
              id: 'login-3',
              email: 'sales@business.com',
              device: 'Firefox on Windows',
              location: 'Unknown',
              time: '2024-01-15 08:45:00',
              approvedBy: '-',
              status: 'pending' as const,
            },
            {
              id: 'login-4',
              email: 'john.doe@business.com',
              device: 'Chrome on Android',
              location: 'Port Harcourt, Nigeria',
              time: '2024-01-14 22:10:00',
              approvedBy: 'System',
              status: 'approved' as const,
            },
            {
              id: 'login-5',
              email: 'unknown@email.com',
              device: 'Unknown',
              location: 'Unknown',
              time: '2024-01-14 03:45:00',
              approvedBy: '-',
              status: 'rejected' as const,
            },
            {
              id: 'login-6',
              email: 'inventory@business.com',
              device: 'Edge on Windows',
              location: 'Ibadan, Nigeria',
              time: '2024-01-14 14:20:00',
              approvedBy: 'Manager',
              status: 'approved' as const,
            },
            {
              id: 'login-7',
              email: 'test@business.com',
              device: 'Chrome on Mac',
              location: 'Lagos, Nigeria',
              time: '2024-01-13 11:05:00',
              approvedBy: '-',
              status: 'pending' as const,
            },
            {
              id: 'login-8',
              email: 'finance@business.com',
              device: 'Safari on Mac',
              location: 'Abuja, Nigeria',
              time: '2024-01-13 09:30:00',
              approvedBy: 'Admin',
              status: 'approved' as const,
            },
          ];

export type DiscountType = "percentage" | "fixed_amount";
export type DiscountStatus = "active" | "expired";

export type Discount = {
  id: number;
  name: string;
  type: DiscountType;
  percentage?: number;
  fixed_amount?: number;
  value: number;
  startDate?: string;
  endDate?: string;
  status: DiscountStatus;
};


// export const navigation: NavigationItem[] = [
//   {
//     name: "Dashboard",
//     href: "/dashboard",
//     icon: Home,
//     permissions: [
//       "view_inventory",
//       "view_expenses",
//       "view_customer",
//       "view_staff",
//       "view_settings",
//       "view_login_attempts",
//     ],
//   },
//   {
//     name: "Inventory",
//     href: "/inventory",
//     icon: Package,
//     permissions: ["view_inventory"],
//   },
//   {
//     name: "Sales",
//     href: "/sales",
//     icon: ShoppingCart,
//     permissions: ["view_sales"],
//   },
//   {
//     name: "Expenses",
//     href: "/expenses",
//     icon: DollarSign,
//     permissions: ["view_expenses"],
//   },
//   {
//     name: "Customers",
//     href: "/customers",
//     icon: Users,
//     permissions: ["view_customer"],
//   },
//   {
//     name: "Staffs",
//     href: "/staffs",
//     icon: Workflow,
//     permissions: ["view_staff"],
//   },
//   {
//     name: "Settings",
//     href: "/settings",
//     icon: Settings,
//     permissions: ["view_settings"],
//   },
// ];

export interface AdminDetail {
  admin_id: string;
  email: string;
  role?: string;
   permissions?: string[];
  verified?: boolean;
  reset?: boolean;
  iat?: number;
  exp?: number;
  full_name?: string;
  username?: string;
}

export interface ReceiptTransaction {
  id: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  totalDiscount: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  timestamp: string;
  purchaseType: 'in-store' | 'online';
  installmentPlan?: {
    numberOfPayments: number;
    amountPerPayment: number;
    paymentFrequency: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    notes: string;
    downPayment: number;
    remainingBalance: number;
  };
  splitPayments?: { method: string; amount: number }[];
}

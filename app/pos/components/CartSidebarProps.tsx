'use client';

import { useEffect, useMemo } from 'react';
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, UserPlus, FileText, CreditCard, ShoppingCart, Loader2 } from "lucide-react";
import Image from 'next/image';
import { CartItem, Customer } from '@/app/utils/type';
import { Switch } from '@/components/ui/switch';
import { useCustomers } from './useCustomers';

interface CartSidebarProps {
  cart: CartItem[];
  selectedCustomer: Customer;
  subtotal: number;
  tax: number;
  taxRate: number;  
  total: number;
  onCustomerChange: (customer: Customer) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSaveDraft: () => void;
  onLoadDraft: () => void;
  onCheckout: () => void;
  onCreateCustomer: () => void;
  purchaseType: 'in-store' | 'online';                   
  onPurchaseTypeChange: (type: 'in-store' | 'online') => void;
   itemDiscountToggles?: Record<string, boolean>;
  onDiscountToggle?: (itemId: string) => void;
}

export function CartSidebar({
  cart,
  selectedCustomer,
  subtotal,
  tax,
  taxRate, 
  total,
  onCustomerChange,
  onUpdateQuantity,
  onRemoveItem,
  onSaveDraft,
  onLoadDraft,
  onCheckout,
  onCreateCustomer,
  purchaseType,
  onPurchaseTypeChange,
  itemDiscountToggles = {},
  onDiscountToggle,
}: CartSidebarProps) {


 
   const { customers, loading: customersLoading } = useCustomers();
  const isWalkInCustomer = selectedCustomer.is_walk_in === true || selectedCustomer.id === 'walk-in' || selectedCustomer.id === 'walk-in-temp';

  // Find the real walk-in customer from the database by is_walk_in flag first, then by name
  const dbWalkInCustomer = customers.find(c => 
    c.is_walk_in === true || c.name?.toLowerCase() === 'walk-in'
  );

  // Use the database walk-in customer if it exists, otherwise use a dummy one
  const walkInCustomerForDisplay = useMemo(() => 
    dbWalkInCustomer 
      ? { ...dbWalkInCustomer, is_walk_in: true } 
      : { id: 'walk-in-temp', name: 'Walk-in', is_walk_in: true }
  , [dbWalkInCustomer]);

  // Build customer list: real walk-in (if available) + other non-walk-in customers only
  const allCustomers: Customer[] = useMemo(() => {
    const nonWalkInCustomers = customers.filter(c => 
      c.is_walk_in !== true && c.id !== 'walk-in' && c.id !== 'walk-in-temp' && c.name?.toLowerCase() !== 'walk-in'
    );
    return [walkInCustomerForDisplay, ...nonWalkInCustomers];
  }, [walkInCustomerForDisplay, customers]);

  useEffect(() => {
    if (!isWalkInCustomer && !customers.some(c => String(c.id) === String(selectedCustomer.id))) {
      // Reset to walk-in customer if current customer is not in the customer list
      onCustomerChange(walkInCustomerForDisplay);
    }
  }, [customers, selectedCustomer.id, onCustomerChange, isWalkInCustomer, walkInCustomerForDisplay]);

const handleToggleDiscount = (itemId: string) => {
  if (onDiscountToggle) {
    onDiscountToggle(itemId);
  }
};

const getItemDiscount = (item: CartItem) => {
  const discount = item.productDiscount;
  if (!discount) return 0;
 
  if (!itemDiscountToggles[item.id] || discount.status === 'expired') return 0;

  if (discount.type === 'percentage') {
    return (item.price * item.quantity * discount.percentage!) / 100;
  } else {
    return Math.min(discount.fixed_amount!, item.price * item.quantity);
  }
};


const totalDiscount = cart.reduce((sum, item) => sum + getItemDiscount(item), 0);
const finalTotal = Math.max(0, total - totalDiscount);

  const handleCheckout = () => {
    const discountData = {
      itemDiscountToggles,
      totalDiscount,
      discountedTotal: finalTotal,
    };
    
    sessionStorage.setItem('currentDiscount', JSON.stringify(discountData));
    onCheckout();
  };

  const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return '';


  if (imagePath.startsWith('http')) return imagePath;

  const baseUrl =
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://api.bmtpossystem.com';

  return imagePath.startsWith('/')
    ? `${baseUrl}${imagePath}`
    : `${baseUrl}/${imagePath}`;
};



 const getTaxableAmount = (item: CartItem): number => {
    return item.taxable ? item.price * item.quantity : 0;
  };

  
  const hasCustomerDetails = !isWalkInCustomer && (selectedCustomer.email || selectedCustomer.phone);


  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Shopping Cart
          {cart.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {cart.length} items
            </Badge>
          )}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
     
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="customer">Customer</Label>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
             onClick={onCreateCustomer}
              disabled={customersLoading}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              New Customer
            </Button>
          </div>
          
           <Select
            value={String(selectedCustomer.id)}
            onValueChange={(value) => {
              const customer = allCustomers.find(c => String(c.id) === value);
              console.log('Selected customer:', customer); // Debug
              if (customer) onCustomerChange(customer);
            }}
            disabled={customersLoading}
          >
            <SelectTrigger className='border border-gray-900'>
              <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select customer"} />
            </SelectTrigger>
            <SelectContent>
              {allCustomers.map(customer => (
                <SelectItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!isWalkInCustomer && (
            <div className="space-y-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600 text-white">Customer Details</Badge>
                </div>
                
                {selectedCustomer.email ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                    <span className="text-lg">📧</span>
                    <span className="truncate font-medium">{selectedCustomer.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <span className="text-lg">📧</span>
                    <span>No email provided</span>
                  </div>
                )}

                {selectedCustomer.phone ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-lg">📱</span>
                    <span className="truncate font-medium">{selectedCustomer.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-lg">📱</span>
                    <span>No phone provided</span>
                  </div>
                )}
              </div>

              {!hasCustomerDetails && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ This customer has no contact information
                </div>
              )}
            </div>
          )}

          {customersLoading && (
            <div className="flex items-center justify-center py-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs">Loading customers...</span>
            </div>
          )}
        </div>

      
        <div className="space-y-2">
          <Label>Purchase Type</Label>
         <div className="grid grid-cols-2 gap-2">
            <Button
  variant={purchaseType === 'in-store' ? 'default' : 'secondary'}
  className="justify-start"
  onClick={() => onPurchaseTypeChange('in-store')}  
>
  In-Store
</Button>
<Button
  variant={purchaseType === 'online' ? 'default' : 'secondary'}
  className="justify-start"
  onClick={() => onPurchaseTypeChange('online')}   
>
  Online
</Button>
            </div>
        </div>

      
        <div className="space-y-4">
          <Label>Items in Cart</Label>
          
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Your cart is empty</p>
              <p className="text-sm mt-1">Add items from the product grid</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                  const imageUrl = getImageUrl(item.image);
                   return (
                      <Card key={item.id} className="overflow-hidden text-gray-900 bg-white border-gray-100 border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                    
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                          {item.image && imageUrl ? (
                            <Image
                              src={item.image}
                              width={100}
                                height={100}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                      </div>
                      
                 
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 truncate">
                              {item.productName}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              {item.variantName}
                            </p>
                           
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 ">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-800 bg-gray-900 text-white"
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-7 text-center border border-gray-100 shadow rounded-xl"
                            />
                            
                            <Button
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-gray-800 bg-gray-900 text-white"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                            {item.productDiscount && (
                              <Badge className="flex items-center justify-between gap-2 p-2 bg-gray-800 rounded-2xl border border-green-200">
                                <span className="text-sm text-green-700 font-medium">
                                  {item.productDiscount.name}
                                </span>
                             <Switch
                                checked={!!itemDiscountToggles[item.id]}
                                onCheckedChange={() => handleToggleDiscount(item.id)}
                              />
                              </Badge>
                            )}
                          
                          <div className=" flex flex-col">
                            <div className="font-bold">
                              NGN {(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              NGN {item.price} each
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                   )
              })}
            </div>
          )}
        </div>

      
    
      </div>
      
    
      <div className="border-t border-gray-200 p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">NGN {subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
          <span className="text-gray-600">
              Tax ({taxRate}%)
              <span className="text-xs text-gray-500 ml-1">
                (On taxable items only)
              </span>
            </span>
            <span className="font-medium">NGN {tax.toFixed(2)}</span>
          </div>

          {cart.length > 0 && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <div className="flex justify-between mb-1">
                <span>Taxable Items:</span>
                <span>{cart.filter(item => item.taxable).length} of {cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxable Amount:</span>
                <span>NGN {cart.filter(item => item.taxable).reduce((sum, item) => sum + getTaxableAmount(item), 0).toFixed(2)}</span>
              </div>
            </div>
          )}
          
         {totalDiscount > 0 && (
  <div className="flex justify-between text-sm">
    <span className="text-green-600">Discount</span>
    <span className="font-medium text-green-600">- NGN {totalDiscount.toFixed(2)}</span>
  </div>
)}
          
          <Separator />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>NGN {finalTotal.toFixed(2)}</span>
          </div>
        </div>
        
      
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={onSaveDraft}
            disabled={cart.length === 0}
          >
            <FileText className="h-4 w-4" />
            Save Draft
          </Button>
          
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={onLoadDraft}
          >
            <FileText className="h-4 w-4" />
            Load Draft
          </Button>
        </div>
        
        <Button
          className="w-full bg-green-400 hover:bg-green-500 text-black flex items-center gap-2"
          size="lg"
          onClick={handleCheckout}
          disabled={cart.length === 0}
        >
          <CreditCard className="h-5 w-5" />
          Make Sale (NGN {finalTotal.toFixed(2)})
        </Button>
      </div>
    </div>
  );
}
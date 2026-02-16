'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {Clock, User} from "lucide-react";
import { AdminData, CartItem, Customer, Draft, Product, ProductVariant } from '../utils/type';
import { LoadDraftModal } from './components/LoadDraftModal';
import { CreateCustomerModal } from './components/CreateCustomerModal';
import { CartSidebar } from './components/CartSidebarProps';
import { ProductGrid } from './components/ProductGridProps';
import { ProductFilters } from './components/ProductFiltersProps';
import { POSHeader } from './components/POSHeader';
import { NetworkStatus } from './components/NetworkStatus';
import { CheckoutModal } from './components/CheckoutModalProps';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarcodeScanner } from './components/BarcodeScanner';
import { useProducts } from './components/useProduct';
import { VariantWithProduct } from './components/useVariants';
import { useDiscounts } from './components/useDiscount';
import { useOfflineSync } from './components/useOfflineSync';
import { useWalkInCustomer } from './components/useWalkInCustomer';
import { useCustomers } from './components/useCustomers';
import { parse } from 'path';
import { getVariantImage, parseImageUrl } from '../utils/imageHelper';

export default function POSPage() {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [itemDiscountToggles, setItemDiscountToggles] = useState<Record<string, boolean>>({});
  const [purchaseType, setPurchaseType] = useState<'in-store' | 'online'>('in-store');
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [showCreateCustomer, setShowCreateCustomer] = useState<boolean>(false);
  const [showLoadDraft, setShowLoadDraft] = useState<boolean>(false);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isScannerProcessing, setIsScannerProcessing] = useState<boolean>(false);
  const [filteredVariants, setFilteredVariants] = useState<VariantWithProduct[]>([]);
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  const { products } = useProducts();
  const { getDiscountForProduct, isDiscountActive } = useDiscounts();
  const { walkInCustomer, refetchWalkInCustomer } = useWalkInCustomer();
  const { refetch: refetchCustomers } = useCustomers();
  const { syncPendingTransactions } = useOfflineSync(async () => {
    await refetchWalkInCustomer();
    await refetchCustomers();
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer>({
    id: "walk-in",
    name: "Walk-in",
    is_walk_in: true,
  });

  

  useEffect(() => {
      const storedAdminData = localStorage.getItem('adminDetail');
    if (storedAdminData) {
      try {
        const parsedAdminData: AdminData = JSON.parse(storedAdminData);
        setAdminData(parsedAdminData);
        console.log('Admin data loaded:', parsedAdminData);
      } catch (error) {
        console.error('Error parsing admin data from localStorage:', error);
        setAdminData(null);
      }
    }

    const savedTaxRate = localStorage.getItem('pos_default_tax_rate');
    if (savedTaxRate) {
      setTaxRate(parseFloat(savedTaxRate));
    }
    setIsHydrated(true);
  }, []);

  const handleTaxRateChange = (newRate: number) => {
    setTaxRate(newRate);
    localStorage.setItem('pos_default_tax_rate', newRate.toString());
  };

  const handleResetCart = () => {
    setCart([]);
    setItemDiscountToggles({});
    // Reset to walk-in customer (either from database or fallback)
    if (walkInCustomer) {
      setSelectedCustomer(walkInCustomer);
    } else {
      setSelectedCustomer({
        id: "walk-in-temp",
        name: "Walk-in Customer",
        is_walk_in: true,
      });
    }
  };

  // Initialize walk-in customer from database when hook loads
  useEffect(() => {
    if (walkInCustomer) {
      // Always update selectedCustomer when walkInCustomer changes
      // This handles the case where a temporary walk-in is replaced with a real DB walk-in
      setSelectedCustomer(walkInCustomer);
    } else {
      // Fallback to local walk-in if not loaded yet
      setSelectedCustomer({
        id: "walk-in",
        name: "Walk-in Customer",
      });
    }
  }, [walkInCustomer]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const handleAddToCart = (variant: VariantWithProduct) => {
    const existingItem = cart.find(item => item.variantId === variant.variant_id);

     const discount = getDiscountForProduct(variant.product_id);
    
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.variantId === variant.variant_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          id: `${variant.product_id}-${variant.variant_id}`,
          productId: variant.product_id,
          variantId: variant.variant_id,
          productName: variant.product_name,
          variantName: variant.sku,
          sku: variant.sku,
          price: parseFloat(String(variant.selling_price)),
          quantity: 1,
          taxable: variant.taxable,
          image: getVariantImage(variant.image_url),
          stock: variant.quantity,
        productDiscount: discount ? {
            id: discount.id,
            name: discount.name,
            type: discount.discount_type,
            percentage: discount.percentage,
            fixed_amount: discount.fixed_amount,
            value: discount.discount_type === 'percentage' ? discount.percentage! : discount.fixed_amount!,
            status: 'active' as const,
          } : undefined,
        }
      ]);
      toast.success(`Added: ${variant.product_name}`);
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      const cartItem = cart.find(item => item.id === itemId);
      const variant = filteredVariants.find(v => v.variant_id === cartItem?.variantId);
      
      if (variant && newQuantity > variant.quantity) {
        toast.error(`Only ${variant.quantity} items available in stock`);
        return;
      }

      setCart(cart.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handleSaveDraft = () => {
    const draft: Draft = {
      id: crypto.randomUUID(),
      customer: selectedCustomer,
      items: cart,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      timestamp: new Date().toISOString(),
    };

    const drafts: Draft[] = JSON.parse(
      localStorage.getItem("pos_drafts") || "[]"
    );

    drafts.push(draft);
    localStorage.setItem("pos_drafts", JSON.stringify(drafts));

    setCart([]);
    toast.success('Draft saved successfully');
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

 const calculateTax = () => {
    const taxableItems = cart.filter(item => item.taxable);
    return taxableItems.reduce((sum, item) => sum + (item.price * item.quantity * (taxRate / 100)), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleToggleDiscount = (itemId: string) => {
    setItemDiscountToggles(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const calculateDiscount = () => {
    return cart.reduce((sum, item) => {
      const discount = item.productDiscount;
      if (!discount || !itemDiscountToggles[item.id] || discount.status === 'expired') return sum;

      if (discount.type === 'percentage') {
        return sum + (item.price * item.quantity * discount.value) / 100;
      } else {
        return sum + Math.min(discount.value, item.price * item.quantity);
      }
    }, 0);
  };

  const totalDiscount = calculateDiscount();
  const finalTotal = Math.max(0, calculateTotal() - totalDiscount);

  const handleBarcodeScanned = async (barcode: string) => {
    setIsScannerProcessing(true);
    
    try {
      const variant = filteredVariants.find(v => v.barcode === barcode);
      
      if (!variant) {
        toast.error(`Barcode not found: ${barcode}`);
        setIsScannerProcessing(false);
        return;
      }

      if (variant.quantity <= 0) {
        toast.error(`Out of stock: ${variant.product_name}`);
        setIsScannerProcessing(false);
        return;
      }

      const existingCartItem = cart.find(item => item.variantId === variant.variant_id);

      if (existingCartItem) {
        handleUpdateQuantity(existingCartItem.id, existingCartItem.quantity + 1);
        toast.success(`Updated: ${variant.product_name} (Qty: ${existingCartItem.quantity + 1})`);
      } else {
        handleAddToCart(variant);
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      toast.error('Failed to process barcode');
    } finally {
      setIsScannerProcessing(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

    const cashierName = adminData?.full_name || 'Cashier';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NetworkStatus />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Session: {formatTime(sessionTime)}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Badge className="bg-gray-900 text-green-400 px-2 py-1 rounded-md flex items-center gap-1">
                <User className="h-4 w-4" />
                Cashier: <span className="font-semibold">{cashierName}</span>
              </Badge>
              <Label htmlFor="taxRate" className="text-sm hidden">Set Sale Tax Rate:</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
                className="w-16 h-8 text-center border border-gray-900 hidden"
              />
              <span className="text-sm hidden">%</span>
            </div>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm"
            asChild
          >
            <a href="/pos/transaction-history">
              View Daily History
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        <div className="flex-1 overflow-hidden flex flex-col">
          <POSHeader />
          
          <ProductFilters
            products={products}
            selectedBrand={selectedBrand}
            selectedCategory={selectedCategory}
            selectedProduct={selectedProduct}
            searchQuery={searchQuery}
            onBrandChange={setSelectedBrand}
            onCategoryChange={setSelectedCategory}
            onProductChange={setSelectedProduct}
            onSearchChange={setSearchQuery}
            onVariantsChange={setFilteredVariants}
          />
            
          <ProductGrid
            variants={filteredVariants}
            onAddToCart={handleAddToCart}
          />

          <div className="px-6 pt-4">
            <BarcodeScanner 
              onBarcodeScanned={handleBarcodeScanned}
              isProcessing={isScannerProcessing}
            />
          </div>
        </div>
        
        <div className="lg:w-96 xl:w-108 border-l border-gray-200 bg-white overflow-y-auto">
          <CartSidebar
            cart={cart}
            selectedCustomer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            onSaveDraft={handleSaveDraft}
            onLoadDraft={() => setShowLoadDraft(true)}
            onCheckout={() => setShowCheckout(true)}
            subtotal={calculateSubtotal()}
            taxRate={taxRate}
            tax={calculateTax()}
            total={calculateTotal()} 
            onCreateCustomer={() => setShowCreateCustomer(true)}
            purchaseType={purchaseType}                 
            onPurchaseTypeChange={setPurchaseType} 
            itemDiscountToggles={itemDiscountToggles}
            onDiscountToggle={handleToggleDiscount} 
          />
        </div>
      </div>

      <CreateCustomerModal
        open={showCreateCustomer}
        onOpenChange={setShowCreateCustomer}
        onCustomerCreated={(customer) => {
          setSelectedCustomer(customer);
          setShowCreateCustomer(false);
        }}
      />
        
      <LoadDraftModal
        open={showLoadDraft}
        onOpenChange={setShowLoadDraft}
        onLoadDraft={(draft) => {
          setCart(draft.items);
          setSelectedCustomer(draft.customer);
          setShowLoadDraft(false);
        }}
      />
        
      <CheckoutModal
        open={showCheckout}
        onOpenChange={setShowCheckout}
        cart={cart}
        customer={selectedCustomer}
        subtotal={calculateSubtotal()}
        tax={calculateTax()}
        taxRate={taxRate} 
        total={calculateTotal()}
        totalDiscount={totalDiscount} 
        itemDiscountToggles={itemDiscountToggles} 
        purchaseType={purchaseType}
        onComplete={() => {
          handleResetCart(); 
          setShowCheckout(false);
        }}
        onWalkInCreated={async () => {
          await refetchWalkInCustomer();
          await refetchCustomers();
        }}
      />
    </div>
  );
}
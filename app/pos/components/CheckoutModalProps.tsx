'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Split, 
  Printer, 
  Download, 
  Share2, 
  X, 
  Calendar,
  Wallet
} from "lucide-react";
import { CartItem, Customer, InstallmentPayment, InstallmentPlan, Transaction } from '@/app/utils/type';
import { Receipt } from './Receipt';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import ReactDOMServer from 'react-dom/server';
import { useSales, type CreateSalePayload, type SaleResponse } from './useSales';
import { OfflineTransactionManager } from './OfflineTransactionManager';
import { Loader2, AlertCircle } from 'lucide-react';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  customer: Customer;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  onComplete: () => void;
  purchaseType: 'in-store' | 'online';
    totalDiscount?: number;  
  itemDiscountToggles?: Record<string, boolean>;
  onWalkInCreated?: () => Promise<void>;
}

export function CheckoutModal({
  open,
  onOpenChange,
  cart,
  customer,
  subtotal,
  tax,
  taxRate,
  total,
  onComplete,
  purchaseType,
  totalDiscount = 0,  
  itemDiscountToggles = {},
  onWalkInCreated,
}: CheckoutModalProps) {

  const [customTax, setCustomTax] = useState<number>(tax);

     useEffect(() => {
    setCustomTax(tax);
  }, [tax, open]);

const netTotal = subtotal + customTax - totalDiscount;

  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [amountPaid, setAmountPaid] = useState<string>(netTotal.toFixed(2));
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [showSplitPayment, setShowSplitPayment] = useState<boolean>(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState<boolean>(false);
  const [splitPayments, setSplitPayments] = useState([
    { method: 'cash', amount: '' },
    { method: 'card', amount: '' },
  ]);
   
  const getSplitTotalPaid = () =>
  splitPayments.reduce(
    (sum, p) => sum + (parseFloat(p.amount) || 0),
    0
  );
const [transactionId, setTransactionId] = useState<string | null>(null);

const [creditType, setCreditType] = useState<'full' | 'partial'>('full');

  // Backend sync states
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'offline' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const { createSale, loading: createSaleLoading } = useSales();

  const [useInstallments, setUseInstallments] = useState<boolean>(false);
const [installmentPlan, setInstallmentPlan] = useState<InstallmentPlan>({
  id: '', 
  customer: customer, 
  total: netTotal,
  downPayment: Math.ceil(netTotal * 0.3),
  remainingBalance: Math.ceil(netTotal * 0.7),
  numberOfPayments: 3,
  amountPerPayment: Math.ceil(netTotal / 3),
  paymentFrequency: 'monthly',
  startDate: new Date().toISOString().split('T')[0],
  notes: '',
  payments: [],
  status: 'active',
});

useEffect(() => {
  setInstallmentPlan(prev => ({
    ...prev,
    customer: customer,
    total: netTotal,
    remainingBalance: Math.ceil(netTotal * 0.7),
    amountPerPayment: Math.ceil(netTotal / 3),
  }));
}, [customer, netTotal]);

  
  const isWalkInCustomer = customer.is_walk_in === true || customer.id === 'walk-in' || customer.id === 'walk-in-temp';
  const isCustomerEligibleForInstallments = !isWalkInCustomer;

  const isCustomerVerified = !isWalkInCustomer;




  const handleAmountPaidChange = (value: string) => {
    setAmountPaid(value);
  };

 const calculateChange = () => {
  if (paymentMethod === 'split') {
    const paid = getSplitTotalPaid();
    return paid > netTotal ? paid - netTotal : 0;
  }

  const paid = parseFloat(amountPaid) || 0;
  return paid > netTotal ? paid - netTotal : 0;
};


 

  const getActualDownPayment = () =>
    Math.min(
      Math.max(parseFloat(amountPaid) || 0, installmentPlan.downPayment),
      netTotal - totalDiscount 
    );

const getRemainingBalance = () =>
  Math.max(netTotal - getActualDownPayment(), 0);


const calculateInstallments = () => {
  if (!useInstallments) return;

  const remaining = getRemainingBalance();
  
  if (installmentPlan.numberOfPayments < 2) return;
  
  const numberOfInstallments = installmentPlan.numberOfPayments - 1;
  const perPayment = Number((remaining / numberOfInstallments).toFixed(2));

  setInstallmentPlan((prev) => ({
    ...prev,
    remainingBalance: remaining,
    amountPerPayment: perPayment,
  }));
};



  useEffect(() => {
    calculateInstallments();
  }, [useInstallments, installmentPlan.numberOfPayments, installmentPlan.downPayment, amountPaid, netTotal]);

const handleCompleteSale = async () => {
  
  // eslint-disable-next-line react-hooks/purity

  const newTransactionId = transactionId || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  if (!transactionId) {
    setTransactionId(newTransactionId);
  }

  const timestamp = new Date().toISOString();

  if (paymentMethod === 'credit' && !isCustomerVerified) {
    toast.error('Credit sales are only available for verified customers');
    return;
  }

  if (paymentMethod === 'credit' && creditType === 'partial') {
  const paid = parseFloat(amountPaid) || 0;

  if (paid <= 0 || paid >= netTotal) {
    toast.error('Partial credit must be greater than 0 and less than total');
    return;
  }
}


  if (useInstallments) {
    const downPayment = parseFloat(amountPaid) || 0;
    if (downPayment < installmentPlan.downPayment) {
      toast.error(
        `Down payment must be at least NGN ${installmentPlan.downPayment}`
      );
      return;
    }
  }


  let paymentSchedule: InstallmentPayment[] = [];

  if (useInstallments) {
    const numberOfInstallments =
      installmentPlan.numberOfPayments - 1;

    const remaining = installmentPlan.remainingBalance;

    const baseInstallment = Number(
      (remaining / numberOfInstallments).toFixed(2)
    );

    paymentSchedule = [
  {
    paymentNumber: 1,
    amount: getActualDownPayment(),
    date: timestamp,
    dueDate: installmentPlan.startDate,
    status: 'paid',
  type: 'down_payment',
  },
  ...Array.from({ length: numberOfInstallments }, (_, i) => {
    const isLast = i === numberOfInstallments - 1;

    const amount = isLast
      ? Number(
          (
            remaining -
            baseInstallment * (numberOfInstallments - 1)
          ).toFixed(2)
        )
      : baseInstallment;

    return {
      paymentNumber: i + 2,
      amount,
      dueDate: calculateDueDate(
        installmentPlan.startDate,
        installmentPlan.paymentFrequency,
        i + 1
      ),
      status: 'pending',
      type: 'installment',
    } satisfies InstallmentPayment;
  }),
];

  }


 const transaction = {
  id: newTransactionId,
  customer,
  items: cart,
  subtotal,
  taxRate: taxRate,
  tax: customTax,
  total,
  totalDiscount: totalDiscount || 0,
  paymentMethod: useInstallments
    ? 'installment'
    : paymentMethod,

  amountPaid:
    paymentMethod === 'credit'
      ? creditType === 'full'
        ? 0
        : parseFloat(amountPaid) || 0
      : useInstallments
      ? getActualDownPayment()
      : parseFloat(amountPaid) || 0,

 
  creditBalance:
    paymentMethod === 'credit'
      ? netTotal -
        (
          creditType === 'full'
            ? 0
            : parseFloat(amountPaid) || 0
        )
      : 0,

  creditType:
    paymentMethod === 'credit'
      ? creditType
      : undefined,

  downPayment: useInstallments ? getActualDownPayment() : 0,

  change: paymentMethod === 'credit' ? 0 : calculateChange(),

  timestamp,
  createdOffline: true,
  syncedAt: null,  
  synced: false,
  purchaseType,

  paymentStatus:
    useInstallments
      ? 'installment'
      : paymentMethod === 'credit'
      ? 'credit'
      : 'completed',

  ...(useInstallments && {
    installmentPlan: {
      ...installmentPlan,
      downPayment: getActualDownPayment(),
      remainingBalance: getRemainingBalance(),
      payments: paymentSchedule,
    },
  }),

  ...(paymentMethod === 'credit' && {
    credit: {
       issuedAt: timestamp,
    creditType: creditType,
    creditBalance: creditType === 'full' 
      ? netTotal 
      : netTotal - (parseFloat(amountPaid) || 0),
    amountPaidTowardCredit: creditType === 'partial' 
      ? (parseFloat(amountPaid) || 0)
      : 0,
    },
  }),
} as Transaction;

  // Save to local storage (offline backup)
  const transactions = JSON.parse(
    localStorage.getItem('pos_transactions') || '[]'
  );
  transactions.push(transaction);
  localStorage.setItem('pos_transactions', JSON.stringify(transactions));

  
  if (useInstallments) {
    const installmentPlans = JSON.parse(
      localStorage.getItem('installment_plans') || '[]'
    );

    installmentPlans.push({
      id: transactionId,
      customer: customer,
      total: netTotal, 
      downPayment: getActualDownPayment(),
      remainingBalance: getRemainingBalance(),
      numberOfPayments: installmentPlan.numberOfPayments,
      amountPerPayment: installmentPlan.amountPerPayment,
      paymentFrequency: installmentPlan.paymentFrequency,
      startDate: installmentPlan.startDate,
      payments: paymentSchedule,
      status: 'active',
      transactionId: transactionId,  
      customerId: customer.id, 
    });

    localStorage.setItem(
      'installment_plans',
      JSON.stringify(installmentPlans)
    );
  }

  // Attempt to sync with backend
  setIsSyncing(true);
  setSyncStatus('syncing');
  setSyncError(null);

  try {
    // Check if online
    if (!navigator.onLine) {
      setSyncStatus('offline');
      OfflineTransactionManager.addTransaction(transaction as Transaction);
      toast.info('🔴 Offline Mode', {
        description: 'Transaction saved offline. Will sync when online.',
      });
      setShowReceipt(true);
      return;
    }

    // Prepare payload for backend
    // Build payments array - for split payments, include all methods; for others, single payment
    const paymentsArray = paymentMethod === 'split' && splitPayments.length > 0
      ? splitPayments
          .filter(p => parseFloat(p.amount) > 0) // Only include payments with amounts
          .map(p => ({
            method: p.method as 'cash' | 'card' | 'transfer' | 'split' | 'installment' | 'credit',
            amount: Math.round(parseFloat(p.amount) * 100) / 100, // Round to 2 decimals
            reference: transactionId || undefined,
          }))
      : [
          {
            method: (useInstallments
              ? 'installment'
              : paymentMethod) as 'cash' | 'card' | 'transfer' | 'split' | 'installment' | 'credit',
            amount: useInstallments 
              ? Math.round(getActualDownPayment() * 100) / 100
              : paymentMethod === 'credit' 
                ? (creditType === 'partial' ? Math.round((parseFloat(amountPaid) || 0) * 100) / 100 : 0) 
                : Math.round((parseFloat(amountPaid) || 0) * 100) / 100,
            reference: transactionId || undefined,
          },
        ];

    // Determine if we should send customer_id or customer object
    // For walk-in customers: use customer_id if it has a real UUID, otherwise send as customer object
    const hasRealCustomerId = customer.id && customer.id !== 'walk-in' && customer.id !== 'walk-in-temp';
    const shouldUseCustomerId = !isWalkInCustomer || (isWalkInCustomer && hasRealCustomerId);

    const salePayload: CreateSalePayload = {
      customer_id: shouldUseCustomerId ? customer.id : undefined,
      customer:
        !shouldUseCustomerId && isWalkInCustomer
          ? {
              name: customer.name || 'Walk-in',
              email: customer.email || undefined,
              phone: customer.phone || undefined,
            }
          : undefined,
      items: cart.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      payments: paymentsArray,
      ...(paymentMethod === 'credit' && {
        credit: {
          issuedAt: timestamp,
          creditType: creditType,
          creditBalance:
            creditType === 'full'
              ? Math.round(netTotal * 100) / 100
              : Math.round((netTotal - (parseFloat(amountPaid) || 0)) * 100) / 100,
          amountPaidTowardCredit:
            creditType === 'partial' ? Math.round((parseFloat(amountPaid) || 0) * 100) / 100 : 0,
        },
      }),
      ...(useInstallments && {
        installment: {
          downPayment: Math.round(getActualDownPayment() * 100) / 100,
          numberOfPayments: installmentPlan.numberOfPayments,
          paymentFrequency: installmentPlan.paymentFrequency,
          startDate: installmentPlan.startDate,
          notes: installmentPlan.notes || '',
        },
      }),
      discount: Math.round((totalDiscount || 0) * 100) / 100,
      taxes: Math.round(customTax * 100) / 100,
      note: `Transaction ${newTransactionId} - ${purchaseType}`,
    };

    // Call backend API
    const result: SaleResponse = await createSale(salePayload);

    setSyncStatus('success');
    
    // Update transaction in localStorage to mark as synced and completed
    const allTransactions = JSON.parse(
      localStorage.getItem('pos_transactions') || '[]'
    );
    const txIndex = allTransactions.findIndex((t: Transaction) => t.id === newTransactionId);
    if (txIndex >= 0) {
      allTransactions[txIndex] = {
        ...allTransactions[txIndex],
        synced: true,
        status: 'completed' as const,
        backendId: result.id,
      };
      localStorage.setItem('pos_transactions', JSON.stringify(allTransactions));
    }

    toast.success('✅ Transaction Synced', {
      description: `Order created successfully (ID: ${result.id})`,
    });

    
    if (isWalkInCustomer && onWalkInCreated) {
      try {
        await onWalkInCreated();
      } catch (err) {
        console.warn('Failed to refetch walk-in customer:', err);
      }
    }

    setShowReceipt(true);
  } catch (error) {
    console.error('Checkout error:', error);


    const transactions = JSON.parse(
      localStorage.getItem('pos_transactions') || '[]'
    );
    const txIndex = transactions.findIndex((t: Transaction) => t.id === newTransactionId);
    
    if (txIndex >= 0) {
   
      transactions[txIndex] = {
        ...transactions[txIndex],
        status: 'failed' as const,
        synced: false,
      };
    } else {
   
      transactions.push({
        ...transaction,
        status: 'failed' as const,
        synced: false,
      });
    }
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));

 
    const offlineTransactions = OfflineTransactionManager.getTransactions();
    const isAlreadyTracked = offlineTransactions.some(t => t.transactionData.id === newTransactionId);
    if (!isAlreadyTracked) {
      OfflineTransactionManager.addTransaction(transaction as Transaction);
    } else {
   
      OfflineTransactionManager.markSyncAttempt(newTransactionId, error instanceof Error ? error.message : 'Unknown error');
    }
    
    toast.error('❌ Transaction Failed', {
      description:
        'Transaction could not be completed. Stored for later retry in transaction history.',
    });

    setSyncError(error instanceof Error ? error.message : 'Unknown error occurred');
    setShowReceipt(true);
  } finally {
    setIsSyncing(false);
  }
};

useEffect(() => {
  if (paymentMethod === 'credit') {
    setShowSplitPayment(false);
  }
}, [paymentMethod]);

useEffect(() => {
  if (
    paymentMethod !== 'split' &&
    !(paymentMethod === 'credit' && creditType === 'full')
  ) {
    setAmountPaid(netTotal.toFixed(2));
  }
  if (paymentMethod === 'credit' && creditType === 'full') {
    setAmountPaid('0');
  }
}, [paymentMethod, creditType, netTotal]);

  const calculateDueDate = (startDate: string, frequency: string, offset: number) => {
    const date = new Date(startDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + offset);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (offset * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + offset);
        break;
    }
    return date.toISOString().split('T')[0];
  };

 const handlePrintReceipt = () => {
    if (!transactionId) return;
   
    
    const receiptHtml = ReactDOMServer.renderToString(
      <Receipt
        customer={customer}
        cart={cart}
        subtotal={subtotal}
        discount={totalDiscount}
        tax={tax}
        total={total}
        paymentMethod={useInstallments ? 'installment' : paymentMethod}
       amountPaid={
        paymentMethod === 'credit'
          ? creditType === 'full'
            ? 0
            : parseFloat(amountPaid) || 0
          : parseFloat(amountPaid) || 0
      }
      change={paymentMethod === 'credit' ? 0 : calculateChange()}

        purchaseType={purchaseType}
        splitPayments={splitPayments}
        installmentPlan={useInstallments ? installmentPlan : undefined}
      />
    );

    const printWindow = window.open('', '_blank', 'width=500,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${transactionId}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Tailwind-like utility classes for receipt */
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .gap-3 { gap: 0.75rem; }
            .gap-2 { gap: 0.5rem; }
            .mr-2 { margin-right: 0.5rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .pt-4 { padding-top: 1rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .text-lg { font-size: 1.125rem; }
            .font-bold { font-weight: 700; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .text-center { text-align: center; }
            .text-gray-100 { color: #f3f4f6; }
            .text-gray-300 { color: #d1d5db; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-900 { color: #111827; }
            .text-white { color: #ffffff; }
            .text-black { color: #000000; }
            .text-green-400 { color: #fbbf24; }
            .text-green-400 { color: #fbbf24; }
            .text-blue-400 { color: #60a5fa; }
            .text-green-800 { color: #166534; }
            .text-red-600 { color: #dc2626; }
            .bg-green-400 { background-color: #fbbf24; }
            .bg-green-400 { background-color: #eab308; }
            .bg-green-900\/20 { background-color: rgba(120, 53, 15, 0.2); }
            .bg-blue-900\/30 { background-color: rgba(30, 58, 138, 0.3); }
            .bg-green-50 { background-color: #f0fdf4; }
            .bg-gray-800 { background-color: #1f2937; }
            .bg-gray-900 { background-color: #111827; }
            .bg-white { background-color: #ffffff; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded-sm { border-radius: 0.125rem; }
            .border { border-width: 1px; }
            .border-gray-700 { border-color: #374151; }
            .border-gray-800 { border-color: #1f2937; }
            .border-green-800\/30 { border-color: rgba(146, 64, 14, 0.3); }
            .overflow-hidden { overflow: hidden; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .w-full { width: 100%; }
            .h-8 { height: 2rem; }
            .w-8 { width: 2rem; }
            .h-4 { height: 1rem; }
            .w-4 { width: 1rem; }
            .h-5 { height: 1.25rem; }
            .w-5 { width: 1.25rem; }
            .capitalize { text-transform: capitalize; }
            .uppercase { text-transform: uppercase; }
            
            /* Receipt specific styles */
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #111827;
              color: white;
              margin: 0;
              padding: 20px;
              line-height: 1.5;
            }
            
            @media print {
              @page {
                size: auto;
                margin: 0mm;
              }
              body {
                margin: 0;
                padding: 10px;
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
              .bg-green-400 { background-color: #facc15 !important; }
              .bg-green-400 { background-color: #eab308 !important; }
              .bg-gray-800 { background-color: #f3f4f6 !important; }
              .bg-gray-900 { background-color: #ffffff !important; }
              .text-white { color: #000000 !important; }
              .text-gray-100 { color: #000000 !important; }
              .text-gray-300 { color: #000000 !important; }
              .text-gray-400 { color: #666666 !important; }
              .border-gray-700 { border-color: #ddd !important; }
              .border-gray-800 { border-color: #ddd !important; }
            }
            
            /* Print controls */
            .print-controls {
              position: fixed;
              top: 10px;
              right: 10px;
              z-index: 1000;
              background: white;
              padding: 10px;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              border: 1px solid #ddd;
            }
            
            .print-controls button {
              background: #111827;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-family: sans-serif;
              font-size: 14px;
              margin-right: 10px;
            }
            
            .print-controls button:hover {
              background: #1f2937;
            }
            
            .print-controls button:last-child {
              background: #dc2626;
            }
            
            .print-controls button:last-child:hover {
              background: #b91c1c;
            }
          </style>
        </head>
        <body>
          <div class="print-controls no-print">
            <button onclick="window.print()">🖨️ Print Receipt</button>
            <button onclick="window.close()">❌ Close</button>
          </div>
          ${receiptHtml}
          
          <script>
            // Auto-print option (uncomment if you want auto-print)
            // setTimeout(() => { window.print(); }, 500);
            
            // Auto-close after printing
            window.onafterprint = function() {
              setTimeout(() => {
                window.close();
              }, 1000);
            };
            
            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
              }
              if (e.key === 'Escape') {
                window.close();
              }
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };

  const handleShareReceipt = () => {
    toast('Sharing receipt...');
  };

  const handleDownloadPDF = () => {
    toast('Downloading PDF...');
  };

  const handleDownloadImage = () => {
    toast('Downloading image...');
  };

useEffect(() => {
  if (useInstallments) {
    setAmountPaid(installmentPlan.downPayment.toFixed(2));
  }
}, [installmentPlan.downPayment, useInstallments]);

  useEffect(() => {
    if (!open) {
      setShowReceipt(false);
      setPaymentMethod('cash');
      setAmountPaid('');
      setTransactionId(null);
      setCreditType('full');
      setUseInstallments(false);
      setSplitPayments([
        { method: 'cash', amount: '' },
        { method: 'card', amount: '' },
      ]);
    }
  }, [open]);


  if (showReceipt) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white">
              <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Complete Sale</span>
              {isSyncing && (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  <span>Syncing...</span>
                </div>
              )}
              {syncStatus === 'offline' && (
                <Badge className="bg-orange-600">🔴 Offline Mode</Badge>
              )}
              {syncStatus === 'success' && (
                <Badge className="bg-green-600">✅ Synced</Badge>
              )}
              {syncStatus === 'error' && (
                <Badge className="bg-red-600">❌ Failed to Sync</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Review order and select payment method
            </DialogDescription>
            </DialogHeader>

            {syncStatus === 'offline' && !isSyncing && (
              <div className="p-3 bg-orange-900/30 border border-orange-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-orange-300">Transaction Saved Offline</p>
                    <p className="text-orange-200 mt-1">Your transaction has been saved locally and will be synced to the server when your connection is restored.</p>
                  </div>
                </div>
              </div>
            )}

            {syncError && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-300">Sync Error</p>
                    <p className="text-red-200 mt-1">{syncError}</p>
                  </div>
                </div>
              </div>
            )}
            
          <Receipt
            customer={customer}
            cart={cart}
            subtotal={subtotal}
            discount={totalDiscount}
            tax={tax}
            total={total}
            paymentMethod={useInstallments ? 'installment' : paymentMethod}
           amountPaid={useInstallments ? getActualDownPayment() : parseFloat(amountPaid) || 0}
            change={calculateChange()}
            purchaseType={purchaseType}
            splitPayments={splitPayments}
            installmentPlan={useInstallments ? installmentPlan : undefined}
          />
          
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={handlePrintReceipt} className="flex-1" disabled={isSyncing}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} className="flex-1" disabled={isSyncing}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadImage} className="flex-1" disabled={isSyncing}>
              <Download className="h-4 w-4 mr-2" />
              Image
            </Button>
            <Button variant="outline" onClick={handleShareReceipt} className="flex-1" disabled={isSyncing}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              className="bg-black hover:bg-gray-800 text-white flex-1"
              onClick={() => {
                setShowReceipt(false);
                setPaymentMethod('cash');
                setAmountPaid('');
                setTransactionId(null);
                setCreditType('full');
                setUseInstallments(false);
                setSplitPayments([
                  { method: 'cash', amount: '' },
                  { method: 'card', amount: '' },
                ]);
                onComplete();
                onOpenChange(false);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          setShowReceipt(false);
          setPaymentMethod('cash');
          setAmountPaid('');
          setTransactionId(null);
          setCreditType('full');
          setUseInstallments(false);
          setSplitPayments([
            { method: 'cash', amount: '' },
            { method: 'card', amount: '' },
          ]);
          setCustomTax(tax);
        }
        onOpenChange(newOpen);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
            <DialogDescription>
              Review order and select payment method
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="space-y-1 text-white">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-100">
                      {item.productName} ({item.variantName}) × {item.quantity}
                    </span>
                    <span>NGN {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span>Purchase Type</span>
                <Badge variant="secondary">{purchaseType === 'in-store' ? 'In-Store' : 'Online'}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span>Payment Method</span>
                <Badge variant="secondary">
                  {paymentMethod === 'split' ? 'Split Payment' : 
                   useInstallments ? 'Installment' : paymentMethod}
                </Badge>
              </div>

              {paymentMethod === 'split' && (
                <div className="mt-2 text-sm text-gray-300">
                  {splitPayments.map((p, i) => (
                    <div key={i}>
                      {p.method}: NGN {parseFloat(p.amount || '0').toFixed(2)}
                    </div>
                  ))}
                </div>
              )}

              {paymentMethod === 'split' && getSplitTotalPaid() > netTotal && (
                <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-green-800 font-bold">
                    Change: NGN {(getSplitTotalPaid() - netTotal).toFixed(2)}
                    </div>
                </div>
                )}

              
              {useInstallments && (
                <div className="mt-2 p-3 bg-green-900/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Installment Plan</span>
                    <Badge variant="default" className="bg-green-400 text-black">
                      {installmentPlan.numberOfPayments} payments
                    </Badge>
                  </div>
                  <div className="text-sm mt-1">
                    Down: NGN {installmentPlan.downPayment.toFixed(2)} | 
                    Per: NGN {installmentPlan.amountPerPayment.toFixed(2)} | 
                    Remaining: NGN {installmentPlan.remainingBalance.toFixed(2)}
                  </div>
                </div>
              )}
              
              <Separator />

                  <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tax Rate</span>
                  <span className="font-medium">{taxRate}%</span>
                </div>
              </div>
              
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>NGN {subtotal.toFixed(2)}</span>
                </div>
              <div className="flex justify-between">
                          <span className="text-gray-400">Tax ({taxRate}%)</span>
                  <span>NGN {customTax.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>- NGN {totalDiscount.toFixed(2)}</span>
                  </div>
                ) }
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>NGN {netTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

         
            {isCustomerEligibleForInstallments && (
                <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-green-400" />
                    <div>
                      <div className="font-medium">Installment Payment</div>
                      <div className="text-sm text-gray-400">
                        Available for registered customers
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={useInstallments}
                    onCheckedChange={(checked) => {
                      setUseInstallments(checked);
                      if (checked) {
                        setShowInstallmentModal(true);
                      } else {
                        setPaymentMethod('cash');
                      }
                    }}
                  />
                </div>
              </div>

            )}


            {isCustomerVerified && (
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="font-medium">Credit Sale</div>
                          <div className="text-sm text-gray-400">
                            Give items now
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={paymentMethod === 'credit'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPaymentMethod('credit');
                            setUseInstallments(false);
                            setAmountPaid('0');
                          } else {
                            setPaymentMethod('cash');
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'credit' && (
  <div className="p-3 bg-gray-800 rounded-lg space-y-3">
    <Label>Credit Type</Label>

    <Tabs
      value={creditType}
      onValueChange={(v) => {
        setCreditType(v as 'full' | 'partial');
        if (v === 'full') setAmountPaid('0');
      }}
    >
      <TabsList className="grid grid-cols-2 bg-gray-900">
        <TabsTrigger value="full">Full Credit</TabsTrigger>
        <TabsTrigger value="partial">Partial Credit</TabsTrigger>
      </TabsList>
    </Tabs>

    {creditType === 'partial' && (
      <div className="text-sm text-gray-400">
        Customer pays part now, balance goes to credit
      </div>
    )}
  </div>
)}



            {paymentMethod === 'credit' && (
            <div className="p-4 bg-blue-900/30 rounded-lg">
              <div className="text-lg font-bold text-blue-400">
                Credit Sale Approved
              </div>
             <div className="text-sm mt-2">
                {creditType === 'full' ? (
                  <>
                    Customer will not pay:
                    <span className="font-bold text-white">
                      {' '}NGN {netTotal.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    Customer owes:
                    <span className="font-bold text-white">
                      {' '}NGN {(netTotal - (parseFloat(amountPaid) || 0)).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
{creditType === 'full'
  ? 'No payment required'
  : 'Partial payment received'}
              </div>
            </div>
          )}


         
            {!useInstallments && (
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                  <TabsList className="grid grid-cols-4 bg-gray-900">
                    <TabsTrigger value="cash" className='bg-gray-800 text-white hover:bg-gray-700'>
                      <Banknote className="h-4 w-4 mr-2" />
                      Cash
                    </TabsTrigger>
                    <TabsTrigger value="card" className='bg-gray-800 text-white hover:bg-gray-700'>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Card
                    </TabsTrigger>
                    <TabsTrigger value="transfer" className='bg-gray-800 text-white hover:bg-gray-700'>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Transfer
                    </TabsTrigger>
                    <button
                      type="button"
                      onClick={() => setShowSplitPayment(true)}
                      className="flex items-center justify-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700 transition"
                    >
                      <Split className="h-4 w-4" />
                      Split
                    </button>
                  </TabsList>
                  
                  {paymentMethod !== 'split' && (
                    <TabsContent value={paymentMethod} className="space-y-3">
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="amountPaid">Amount Paid</Label>
                        <Input
                          id="amountPaid"
                          type="number"
                          value={isNaN(parseFloat(amountPaid)) ? '' : amountPaid}
                          onChange={(e) => handleAmountPaidChange(e.target.value)}
                          min={0}
                          step="0.01"
                          disabled={paymentMethod === 'credit' && creditType === 'full'}
                        />
                      </div>

                      {parseFloat(amountPaid) > netTotal&& (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-green-800 font-bold">
                            Change: NGN {calculateChange().toFixed(2)}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}

            

           
            {useInstallments && (
              <div className="space-y-3">
                <Label>Installment Payment</Label>
                <div className="p-4 bg-gray-800 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Total Amount</div>
                      <div className="text-xl font-bold">NGN {netTotal.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Required Down Payment</div>
                      <div className="text-xl font-bold text-green-400">
                        NGN {installmentPlan.downPayment.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor="installmentAmountPaid">Down Payment Amount</Label>
                    <Input
                      id="installmentAmountPaid"
                      type="number"
                      inputMode="decimal"
                      value={amountPaid}
                      
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setAmountPaid('');
                          return;
                        }

                        if (!/^\d*\.?\d*$/.test(value)) return;
                        
                      
                        const parts = value.split('.');
                        
                      
                        if (parts[1] && parts[1].length > 2) return;
                        
                      
                        let numValue = parseFloat(value);
                        
                      
                        numValue = Math.min(numValue, netTotal);
                        
                      
                        const rounded = Math.round(numValue * 100) / 100;
                        
                        setAmountPaid(rounded.toFixed(2));
                      }}
                      placeholder={installmentPlan.downPayment.toFixed(2)}
                      step="0.01"
                      min="0"
                      max={netTotal}
                    />

                  </div>
                  
                  {parseFloat(amountPaid) >= installmentPlan.downPayment && (
                    <div className="p-3 bg-green-900/30 rounded-lg">
                      <div className="text-green-400 font-bold">
                        Approved! You can pay NGN {parseFloat(amountPaid).toFixed(2)} as down payment.
                      </div>
                      <div className="text-sm mt-1">
                        Remaining balance: NGN {installmentPlan.remainingBalance.toFixed(2)}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowInstallmentModal(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View Installment Schedule
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-3">
             <Button
            variant="outline"
            onClick={() => {
              setShowReceipt(false);
              setPaymentMethod('cash');
              setAmountPaid('');
              setTransactionId(null);
              setCreditType('full');
              setUseInstallments(false);
              setSplitPayments([
                { method: 'cash', amount: '' },
                { method: 'card', amount: '' },
              ]);
              onOpenChange(false);
            }}
            disabled={isSyncing || createSaleLoading}
          >
            Cancel Order
          </Button>
           <Button
        className="bg-green-400 hover:bg-green-500 text-black"
        onClick={handleCompleteSale}
        disabled={
          isSyncing || 
          createSaleLoading ||
          (useInstallments && parseFloat(amountPaid) < installmentPlan.downPayment)
        }
      >
        {isSyncing || createSaleLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          useInstallments ? 'Start Installment Plan' : 'Complete Sale'
        )}
      </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    
      <SplitPaymentModal
        open={showSplitPayment}
        onOpenChange={setShowSplitPayment}
        splitPayments={splitPayments}
        setSplitPayments={setSplitPayments}
        netTotal={netTotal}
        setAmountPaid={setAmountPaid}
        setPaymentMethod={setPaymentMethod}
      />


      <InstallmentPlanModal
        open={showInstallmentModal}
        onOpenChange={setShowInstallmentModal}
        installmentPlan={installmentPlan}
        setInstallmentPlan={setInstallmentPlan}
        netTotal={netTotal}
        customer={customer}
      />
    </>
  );
}


interface SplitPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  splitPayments: { method: string; amount: string }[];
  setSplitPayments: (payments: { method: string; amount: string }[]) => void;
  netTotal: number;
  setAmountPaid: (amount: string) => void;
  setPaymentMethod: (method: string) => void;
}

function SplitPaymentModal({
  open,
  onOpenChange,
  splitPayments,
  setSplitPayments,
  netTotal,
  setAmountPaid,
  setPaymentMethod,
}: SplitPaymentModalProps) {
  const toCents = (value: number) => Math.round(value * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
          <DialogDescription>
            Split payment across multiple methods
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {splitPayments.map((payment, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="flex-1 flex flex-col gap-2">
                <Label>Method</Label>
                <select
                  className="w-full bg-gray-800 border rounded px-2 py-1"
                  value={payment.method}
                  onChange={(e) => {
                    const updated = [...splitPayments];
                    updated[index].method = e.target.value;
                    setSplitPayments(updated);
                  }}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={payment.amount}
                  onChange={(e) => {
                    const updated = [...splitPayments];
                    updated[index].amount = e.target.value;
                    setSplitPayments(updated);
                  }}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            {splitPayments.length < 3 && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  setSplitPayments([...splitPayments, { method: 'cash', amount: '' }])
                }
              >
                Add Method
              </Button>
            )}
            {splitPayments.length > 2 && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setSplitPayments(splitPayments.slice(0, -1))}
              >
                Remove
              </Button>
            )}
          </div>

          <div className="text-sm">
            Total Entered:{' '}
            <span className="font-bold">
              NGN{' '}
              {(
                Math.round(
                  splitPayments.reduce(
                    (sum, p) => sum + (parseFloat(p.amount) || 0),
                    0
                  ) * 100
                ) / 100
              ).toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full bg-green-400 text-black"
            onClick={() => {
              const totalPaid = splitPayments.reduce(
                (sum, p) => sum + (parseFloat(p.amount) || 0),
                0
              );

              // Round to 2 decimal places to avoid floating point issues
              const roundedTotalPaid = Math.round(totalPaid * 100) / 100;
              const roundedNetTotal = Math.round(netTotal * 100) / 100;

              if (Math.abs(roundedTotalPaid - roundedNetTotal) > 0.01) {
                toast.error(`Split amounts must equal total (${roundedNetTotal.toFixed(2)})`);
                return;
              }

              setAmountPaid(roundedNetTotal.toFixed(2));
              setPaymentMethod('split');
              onOpenChange(false);
            }}
          >
            Confirm Split Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


interface InstallmentPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installmentPlan: InstallmentPlan;
  setInstallmentPlan: React.Dispatch<React.SetStateAction<InstallmentPlan>>;
  netTotal: number;
  customer: Customer;
  
}


function InstallmentPlanModal({
  open,
  onOpenChange,
  installmentPlan,
  setInstallmentPlan,
  netTotal,
  customer,
}: InstallmentPlanModalProps) {
const handleInputChange = <K extends keyof InstallmentPlan>(field: K, value: InstallmentPlan[K]) => {
  setInstallmentPlan((prev) => ({
    ...prev,
    [field]: value,
  }));
};

 


  const calculatePaymentSchedule = () => {
  const schedule = [];
  const startDate = new Date(installmentPlan.startDate);

  const totalPayments = installmentPlan.numberOfPayments;
  const numberOfInstallments = totalPayments - 1;

  const remaining = netTotal- installmentPlan.downPayment;

  const base = Number(
    (remaining / numberOfInstallments).toFixed(2)
  );

  for (let i = 0; i < totalPayments; i++) {
    const dueDate = new Date(startDate);

    if (i > 0) {
      switch (installmentPlan.paymentFrequency) {
        case 'daily':
          dueDate.setDate(dueDate.getDate() + i);
          break;
        case 'weekly':
          dueDate.setDate(dueDate.getDate() + i * 7);
          break;
        case 'monthly':
          dueDate.setMonth(dueDate.getMonth() + i);
          break;
      }
    }

    const amount =
      i === 0
        ? installmentPlan.downPayment
        : i === totalPayments - 1
        ? Number(
            (
              remaining -
              base * (numberOfInstallments - 1)
            ).toFixed(2)
          )
        : base;

    schedule.push({
      paymentNumber: i + 1,
      amount,
      dueDate: dueDate.toISOString().split('T')[0],
      status: i === 0 ? 'paid' : 'pending',
      type: i === 0 ? 'down_payment' : 'installment',
    });
  }

  return schedule;
};


  const schedule = calculatePaymentSchedule();

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>Installment Payment Plan</DialogTitle>
          <DialogDescription>
            Configure installment plan for {customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
       
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-gray-400">
                  {customer.email} • {customer.phone}
                </div>
              </div>
              <Badge variant="default" className="bg-green-400 text-black">
                Installment Plan
              </Badge>
            </div>
          </div>

         
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
  <Label htmlFor="downPayment">Down Payment Amount</Label>
  <Input
    id="downPayment"
    type="number"
    min={0}
    max={netTotal}
    step="0.01"
    value={installmentPlan.downPayment}
    onChange={(e) => {
      const value = Math.min(
        Math.max(parseFloat(e.target.value) || 0, 0),
        netTotal
      );

      setInstallmentPlan((prev) => ({
        ...prev,
        downPayment: value,
        remainingBalance: Math.max(netTotal- value, 0),
      }));
    }}
  />
  <div className="text-sm text-gray-400">
    Remaining balance: NGN {(netTotal- installmentPlan.downPayment).toFixed(2)}
  </div>
</div>

            <div className="space-y-2">
              <Label htmlFor="numberOfPayments">Number of Payments</Label>
              <Select
                value={installmentPlan.numberOfPayments.toString()}
                onValueChange={(value) => handleInputChange('numberOfPayments', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 payments</SelectItem>
                  <SelectItem value="3">3 payments</SelectItem>
                  <SelectItem value="4">4 payments</SelectItem>
                  <SelectItem value="6">6 payments</SelectItem>
                  <SelectItem value="12">12 payments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentFrequency">Payment Frequency</Label>
             <Select
                value={installmentPlan.paymentFrequency}
                onValueChange={(value) =>
                    handleInputChange(
                    'paymentFrequency',
                    value as 'daily' | 'weekly' | 'monthly' 
                    )
                }
                >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={installmentPlan.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
          </div>

         
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-400">Total Amount</div>
                <div className="text-xl font-bold">NGN {netTotal.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Down Payment</div>
                <div className="text-xl font-bold text-green-400">
                  NGN {installmentPlan.downPayment.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Remaining Balance</div>
                <div className="text-xl font-bold">
                  NGN {installmentPlan.remainingBalance.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-400">
                {installmentPlan.numberOfPayments} total payments
                {installmentPlan.numberOfPayments > 1 && (
                  <>
                    {' '}(1 down payment + {installmentPlan.numberOfPayments - 1} installments) of{' '}
                    <span className="font-bold text-white">
                      NGN {installmentPlan.amountPerPayment.toFixed(2)}
                    </span>{' '}
                    each ({installmentPlan.paymentFrequency})
                  </>
                )}
              </div>
            </div>
          </div>

       
          <div className="space-y-3">
            <Label>Payment Schedule</Label>
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="p-3 text-left text-sm">Payment #</th>
                    <th className="p-3 text-left text-sm">Amount</th>
                    <th className="p-3 text-left text-sm">Due Date</th>
                    <th className="p-3 text-left text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((payment, index) => (
                    <tr key={index} className="border-t border-gray-700">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          Payment {payment.paymentNumber}
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        NGN {payment.amount.toFixed(2)}
                      </td>
                      <td className="p-3">{payment.dueDate}</td>
                      <td className="p-3">
                        <Badge 
                          variant={payment.type === 'down_payment' ? 'default' : 'secondary'}
                          className={payment.type === 'down_payment' ? 'bg-green-400 text-black' : ''}
                        >
                          {payment.type === 'down_payment'
                            ? 'Down Payment'
                            : payment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

      
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={installmentPlan.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any notes about this installment plan..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-green-400 hover:bg-green-500 text-black"
            onClick={() => onOpenChange(false)}
          >
            Confirm Installment Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
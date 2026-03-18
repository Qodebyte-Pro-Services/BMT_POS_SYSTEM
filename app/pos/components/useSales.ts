'use client';

import { useRef, useState } from 'react';

export interface PaymentData {
  method: 'cash' | 'card' | 'transfer' | 'split' | 'installment' | 'credit';
  amount: number;
  reference?: string;
}

export interface CreateSalePayload {
  customer_id?: string;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    variant_id: number;
    quantity: number;
    unit_price: number;
  }>;
  payments: PaymentData[];
  credit?: {
    issuedAt: string;
    creditType: 'full' | 'partial';
    creditBalance: number;
    amountPaidTowardCredit: number;
  };
  installment?: {
    downPayment: number;
    numberOfPayments: number;
    paymentFrequency: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    notes?: string;
  };
  discount?: number;
  taxes?: number;
  note?: string;
    timestamp?: string;
  createdOffline?: boolean;
}

export interface SaleResponse {
  id: number;
  customer_id: string | null;
  total_amount: number;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  status: 'pending' | 'completed' | 'canceled' | 'paid';
  purchase_type: 'in_store' | 'online_order';
  admin_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPayResponse {
  message: string;
  balance: number;
  completed: boolean;
}

export interface UseSalesResponse {
  createSale: (payload: CreateSalePayload) => Promise<SaleResponse>;
  payInstallment: (installmentPaymentId: number, amount: number, method: string, reference?: string) => Promise<InstallmentPayResponse>;
  loading: boolean;
  error: string | null;
}

export function useSales(): UseSalesResponse {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const isCreatingSaleRef = useRef(false);

  const createSale = async (payload: CreateSalePayload): Promise<SaleResponse> => {

        if (isCreatingSaleRef.current) {
      console.warn('🚫 createSale blocked: already in progress');
      throw new Error('Sale is already being processed');
    }
    isCreatingSaleRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
      const response = await fetch(`${apiUrl}/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json() as Record<string, unknown>;
        throw new Error((errorData.message as string) || 'Failed to create sale');
      }

      const result = (await response.json()) as SaleResponse;
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ createSale error:', errorMessage);
      throw err;
    } finally {
      isCreatingSaleRef.current = false;
      setLoading(false);

    }
  };

  const payInstallment = async (
    installmentPaymentId: number,
    amount: number,
    method: string,
    reference?: string
  ): Promise<InstallmentPayResponse> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
      const response = await fetch(`${apiUrl}/sales/installment/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installment_payment_id: installmentPaymentId,
          amount,
          method,
          reference,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as Record<string, unknown>;
        throw new Error((errorData.message as string) || 'Failed to process installment payment');
      }

      const result = (await response.json()) as InstallmentPayResponse;
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ payInstallment error:', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSale,
    payInstallment,
    loading,
    error,
  };
}

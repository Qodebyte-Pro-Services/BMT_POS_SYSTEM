'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent,} from "@/components/ui/tabs";
import { Transaction } from '@/app/utils/type';
import { InventoryLayout } from '../inventory/components/InventoryLayout';
import { SalesHeader } from './components/SalesHeader';
import { DateFilter } from './components/DateFilter';
import { SalesTabs } from './components/SalesTabs';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { ReportsTab } from './components/ReportsTab';
import { getSalesKPI } from '@/app/lib/api';

interface SalesKPIData {
  summary: {
    total_transactions: number;
    total_sales_amount: number;
    subtotal: number;
    total_tax: number;
    total_discount: number;
    average_transaction_value: number | string;
  };
  purchase_types: {
    distribution: Record<string, { count: number; total_amount: number }>;
    total_transactions: number;
  };
  payment_methods: {
    distribution: Record<string, { count: number; total_amount: number; percentage?: number | string }>;
    total_transactions: number;
    credit_breakdown: {
      full_credit: number;
      partial_credit: number;
      total_credit: number;
    };
  };
}

export default function SalesPage() {
    const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpiData, setKpiData] = useState<SalesKPIData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    filter: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [transactionIdFilter, setTransactionIdFilter] = useState('');
      const [isHydrated, setIsHydrated] = useState(false);

  // Fetch KPI data
  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setIsLoading(true);
        const response = await getSalesKPI(
          dateRange.filter,
          dateRange.filter === 'custom' ? dateRange.startDate : undefined,
          dateRange.filter === 'custom' ? dateRange.endDate : undefined
        );
        
        if (response.success) {
          setKpiData({
            summary: response.summary,
            purchase_types: response.purchase_types,
            payment_methods: response.payment_methods
          });
        }
      } catch (error) {
        console.error('Failed to fetch KPI data:', error);
      
        setKpiData({
          summary: {
            total_transactions: 0,
            total_sales_amount: 0,
            subtotal: 0,
            total_tax: 0,
            total_discount: 0,
            average_transaction_value: 0
          },
          purchase_types: {
            distribution: {},
            total_transactions: 0
          },
          payment_methods: {
            distribution: {},
            total_transactions: 0,
            credit_breakdown: {
              full_credit: 0,
              partial_credit: 0,
              total_credit: 0
            }
          }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchKPIData();
  }, [dateRange]);

      useEffect(() => {
    const loadTransactions = () => {
      try {
        const savedTransactions = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
        setTransactions(savedTransactions);
      } catch {
        setTransactions([]);
      }
    };
    
    loadTransactions();
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const filter = searchParams.get('filter');
    const txId = searchParams.get('txId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (tab === 'transactions') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('transactions');
    }

    if (filter === 'credit') {
      setPaymentMethodFilter('credit');
    } else if (filter === 'installment') {
      setPaymentMethodFilter('installment');
    }

    if (txId) {
      setTransactionIdFilter(txId);
    }

  
    if (startDate && endDate) {
      setDateRange({
        filter: 'custom',
        startDate,
        endDate,
      });
    }

    setIsHydrated(true);
  }, [searchParams]);





  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (dateRange.filter === 'custom') {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.timestamp).toISOString().split('T')[0];
        return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
      });
    } else if (dateRange.filter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(t => new Date(t.timestamp).toDateString() === today);
    } else if (dateRange.filter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      filtered = filtered.filter(t => new Date(t.timestamp).toDateString() === yesterdayStr);
    } else if (dateRange.filter === 'last7') {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.timestamp) >= startOfWeek);
    } else if (dateRange.filter === 'thisMonth') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(t => new Date(t.timestamp) >= startOfMonth);
    } else if (dateRange.filter === 'thisYear') {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(t => new Date(t.timestamp) >= startOfYear);
    }

    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(t => t.paymentMethod === paymentMethodFilter);
    }

    
    if (transactionIdFilter) {
      filtered = filtered.filter(t => t.id === transactionIdFilter);
    }

    return filtered;
  }, [transactions, dateRange, paymentMethodFilter, transactionIdFilter]);

 if (!isHydrated || isLoading) {
    return (
      <InventoryLayout>
        <div className="space-y-6 p-1 md:p-4 lg:p-6 text-gray-900 flex items-center justify-center h-screen">
          <div className="text-gray-600">Loading sales data...</div>
        </div>
      </InventoryLayout>
    );
  }

  return (
    <InventoryLayout>
      <div className="space-y-6 p-1 md:p-4 lg:p-6 text-gray-900">
        <SalesHeader />
        
        <DateFilter 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        
        
       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 ">
  <SalesTabs activeTab={activeTab} onTabChange={setActiveTab} />
  <TabsContent value="overview">
    {kpiData ? (
      <OverviewTab transactions={filteredTransactions} dateRange={dateRange} kpiData={kpiData} />
    ) : (
      <div className="text-gray-600">Loading overview data...</div>
    )}
  </TabsContent>
  <TabsContent value="transactions">
    <TransactionsTab 
      dateRange={dateRange}
      paymentMethodFilter={paymentMethodFilter}
      onPaymentMethodFilterChange={setPaymentMethodFilter}
      highlightedTransactionId={transactionIdFilter}
    />
  </TabsContent>
  <TabsContent value="reports">
    <ReportsTab transactions={transactions} dateRange={dateRange} />
  </TabsContent>
</Tabs>

      </div>
    </InventoryLayout>
  );
}
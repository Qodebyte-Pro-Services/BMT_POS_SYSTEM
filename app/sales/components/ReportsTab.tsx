'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Eye, 
  RefreshCw,
  Divide
} from "lucide-react";
import { Transaction } from '@/app/utils/type';
import { generateSalesReport, getMiniAdminList, SalesReportApiResponse,  } from '@/app/lib/api';
import { toast } from 'sonner';
import { id } from 'date-fns/locale';

type DateRange = {
  filter: string;
  startDate: string;
  endDate: string;
};


type ReportFormat = 'json' | 'csv' | 'pdf' | 'excel';
type ReportType = 'day' | 'week' | 'month' | 'year';


interface ReportTypeOption {
  value: ReportType;
  label: string;
}


interface ViewReadySalesReport {
  meta: {
    period: string;
    startDate: string;
    endDate: string;
    generatedAt: string;
    cashier: string;
  };

  summary: {
    totalSales: number;
    totalTax: number;
    totalDiscounts: number;
    totalItems: number;
    totalTransactions: number;
    averageTicket: number;
  };

  purchaseType: {
    inStore: number;   // %
    online: number;    // %
  };

  paymentMethods: {
    cash: number;      // %
    card: number;
    transfer: number;
    split: number;
    installment: number;
    credit: number;
  };

  installments: {
    count: number;
    active: number;
    totalValue: number;
    downPayments: number;
    remainingBalance: number;
  };

  credit: {
    count: number;
    totalValue: number;
    outstandingBalance: number;
  };

  transactions: Array<{
    id: number;
    timestamp: string;
    customer: {
      id: string;
      name: string;
    };
    items: {
      id: number;
      variantId: number;
      quantity: number;
      unitPrice: number;
    }[];
    paymentMethod: string;
    purchaseType: "in-store" | "online";
    total: number;
    tax: number;
    discount: number;
    installmentPlan?: {
      downPayment: number;
      remainingBalance: number;
    };
    credit?: {
      creditBalance: number;
    };
  }>;
}

interface ApiOrderItem {
  id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  sku: string;
  price: number | string;
  quantity: number;
  taxable: boolean;
  image_url?: string;
}

interface ApiOrder {
  id: number;
  createdAt: string;
  subtotal: number | string;
  tax: number | string;
  total_amount: number | string;
  discount_total?: number | string;

  Customer: {
    id: string;
    name: string;
  };

  OrderItems: ApiOrderItem[];

  OrderPayment?: {
    method: 'cash' | 'card' | 'transfer' | 'split';
  }[];

  CreditAccount?: {
    creditBalance: number;
  };

  InstallmentPlan?: {
    numberOfPayments: number;
    amountPerPayment: number;
    paymentFrequency: string;
    startDate: string;
    notes?: string;
    downPayment: number;
    remainingBalance: number;
  };
}

interface GeneratedReport {
  id: string;
  dateRange: string;
  type: string;
  startDate: string;
  endDate: string;
  format: ReportFormat;
  transactions: number;
  total: number;
  filters?: {
    includeSummary: boolean;
    includeDetails: boolean;
    includePaymentMethods: boolean;
    includeProductBreakdown: boolean;
    cashier: string;
  };
  apiData?: SalesReportApiResponse; 
}


interface Cashier {
  id: string;
  name: string;
}

interface ReportTypeOption {
  value: ReportType;
  label: string;
}

interface ReportsTabProps {
  transactions: Transaction[];
  dateRange: DateRange;
}

export function ReportsTab({ transactions, dateRange }: ReportsTabProps) {
   const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reportType, setReportType] = useState<ReportType>('day');
  const [reportStartDate, setReportStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportFormat, setReportFormat] = useState<ReportFormat>('json');
  const [includeSummary, setIncludeSummary] = useState<boolean>(true);
  const [includeDetails, setIncludeDetails] = useState<boolean>(true);
  const [includePaymentMethods, setIncludePaymentMethods] = useState<boolean>(true);
  const [includeProductBreakdown, setIncludeProductBreakdown] = useState<boolean>(true);
  const [selectedCashier, setSelectedCashier] = useState<string>('all');
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
    const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState<boolean>(false);

const reportTypes: ReportTypeOption[] = [
  { value: 'day', label: 'Daily Sales' },
  { value: 'week', label: 'Weekly Sales' },
  { value: 'month', label: 'Monthly Sales' },
  { value: 'year', label: 'Yearly Sales' },
];


const [cashiers, setCashiers] = useState<Cashier[]>([
  { id: 'all', name: 'All Cashiers' }
]);

useEffect(() => {
  getMiniAdminList()
    .then(res => {
      const admins = res.admins.map(a => ({
        id: a.admin_id,
        name: a.full_name
      }));
      setCashiers([{ id: 'all', name: 'All Cashiers' }, ...admins]);
    })
    .catch(() => {
      setCashiers([{ id: 'all', name: 'All Cashiers' }]);
    });
}, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getReportTitle = (type: ReportType): string => {
    switch (type) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'year': return 'Yearly';
      default: return 'Sales';
    }
  };

  const generateReport = async (): Promise<void> => {
    setHasAttemptedGenerate(true);
    setIsGenerating(true);
    setError(null);

    try {
      const start = new Date(reportStartDate);
      const end = new Date(reportEndDate);
      const reportTitle = getReportTitle(reportType);

    
      

      // Check if custom date range
      const isCustom = reportStartDate !== reportEndDate || 
        (new Date(reportStartDate).toDateString() !== new Date().toDateString());

      const response = (await generateSalesReport(
        isCustom ? 'custom' : reportType,
        reportStartDate,
        reportEndDate,
        {
          summary: includeSummary,
          details: includeDetails,
          payment_methods: includePaymentMethods,
          product_breakdown: includeProductBreakdown,
          cashier: selectedCashier !== 'all' ? selectedCashier : undefined,
          format: 'json',
        }
      )) as SalesReportApiResponse;

      if (!response || response.transactions === undefined) {
        throw new Error('Invalid response from server');
      }

      // Transform API response to match GeneratedReport format
      const reports: GeneratedReport[] = [];

      if (reportType === 'day' || isCustom) {
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        for (let i = 0; i <= diffDays; i++) {
          const currentDate = new Date(start);
          currentDate.setDate(start.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];

        const dayTransactions = response.transactions.filter(t => {
  if ( !t.timestamp) return false;
const d = new Date( t.timestamp);
  if (isNaN(d.getTime())) return false;
  const transactionDate = d.toISOString().split('T')[0];
  return transactionDate === dateStr;
});
          if (dayTransactions.length > 0) {
            const total = dayTransactions.reduce((sum, t) => sum + Number(t.total), 0);

            reports.push({
              id: `report-${Date.now()}-${i}`,
              dateRange: formatDate(dateStr),
              type: reportTitle,
              startDate: dateStr,
              endDate: dateStr,
              format: reportFormat,
              transactions: dayTransactions.length,
              total: total,
              filters: {
                includeSummary,
                includeDetails,
                includePaymentMethods,
                includeProductBreakdown,
                cashier: selectedCashier,
              },
              apiData: response, 
            });
          }
        }
      } else if (reportType === 'week') {
        const current = new Date(start);
        let weekNumber = 1;

        while (current <= end) {
          const weekStart = new Date(current);
          const weekEnd = new Date(current);
          weekEnd.setDate(weekStart.getDate() + 6);

          const weekTransactions = response.transactions.filter(t => {
            const transactionDate = new Date(t.timestamp);
            return transactionDate >= weekStart && transactionDate <= weekEnd;
          });

          if (weekTransactions.length > 0) {
            const total = weekTransactions.reduce((sum, t) => sum + Number(t.total), 0);

            reports.push({
              id: `report-${Date.now()}-${weekNumber}`,
              dateRange: `Week ${weekNumber} (${formatDate(weekStart.toISOString().split('T')[0])} - ${formatDate(weekEnd.toISOString().split('T')[0])})`,
              type: reportTitle,
              startDate: weekStart.toISOString().split('T')[0],
              endDate: weekEnd.toISOString().split('T')[0],
              format: reportFormat,
              transactions: weekTransactions.length,
              total: total,
              filters: {
                includeSummary,
                includeDetails,
                includePaymentMethods,
                includeProductBreakdown,
                cashier: selectedCashier,
              },
              apiData: response,
            });
          }

          weekNumber++;
          current.setDate(current.getDate() + 7);
        }
      } else if (reportType === 'month') {
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

        while (current <= endMonth) {
          const monthStart = new Date(current);
          const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

          const monthTransactions = response.transactions.filter(t => {
            const transactionDate = new Date(t.timestamp);
            return transactionDate >= monthStart && transactionDate <= monthEnd;
          });

          if (monthTransactions.length > 0) {
            const total = monthTransactions.reduce((sum, t) => sum + Number(t.total), 0);
            const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            reports.push({
              id: `report-${Date.now()}-${monthStart.getMonth()}`,
              dateRange: monthName,
              type: reportTitle,
              startDate: monthStart.toISOString().split('T')[0],
              endDate: monthEnd.toISOString().split('T')[0],
              format: reportFormat,
              transactions: monthTransactions.length,
              total: total,
              filters: {
                includeSummary,
                includeDetails,
                includePaymentMethods,
                includeProductBreakdown,
                cashier: selectedCashier,
              },
              apiData: response,
            });
          }

          current.setMonth(current.getMonth() + 1);
        }
      } else if (reportType === 'year') {
        for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
          const yearStart = new Date(year, 0, 1);
          const yearEnd = new Date(year, 11, 31);

          const yearTransactions = response.transactions.filter(t => {
            const transactionDate = new Date(t.timestamp);
            return transactionDate.getFullYear() === year;
          });

          if (yearTransactions.length > 0) {
            const total = yearTransactions.reduce((sum, t) => sum + Number(t.total), 0);

            reports.push({
              id: `report-${Date.now()}-${year}`,
              dateRange: year.toString(),
              type: reportTitle,
              startDate: yearStart.toISOString().split('T')[0],
              endDate: yearEnd.toISOString().split('T')[0],
              format: reportFormat,
              transactions: yearTransactions.length,
              total: total,
              filters: {
                includeSummary,
                includeDetails,
                includePaymentMethods,
                includeProductBreakdown,
                cashier: selectedCashier,
              },
              apiData: response,
            });
          }
        }
      }

      if (reports.length === 0) {
        setError('No transactions found for the selected period');
      } else {
        setGeneratedReports(reports);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError((err as Error).message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };


const viewReport = (report: GeneratedReport): void => {
  if (!report.apiData || !report.apiData.transactions) {
    toast("No detailed data found for this report.");
    return;
  }
  
 
  const reportWindow = window.open('', '_blank', 'width=1400,height=800');
  if (!reportWindow) return;
  
 const todaysTransactions = report.apiData.transactions;

  const totalSales = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTax = todaysTransactions.reduce((sum, t) => sum + t.tax, 0);
  const totalItems = todaysTransactions.reduce(
    (sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const totalDiscounts = todaysTransactions.reduce((sum, t) => sum + (t.discount || 0), 0);

  const purchaseTypeCounts = todaysTransactions.reduce((acc, t) => {
    const type = t.purchaseType || 'in-store';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paymentMethodCounts = todaysTransactions.reduce((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const installmentTransactions = todaysTransactions.filter(t => t.paymentMethod === 'installment');
  const totalInstallmentAmount = installmentTransactions.reduce((sum, t) => sum + t.total, 0);
  const activeInstallments = installmentTransactions.filter(t =>
    t.installmentPlan && t.installmentPlan.remainingBalance > 0
  ).length;

  const creditTransactions = todaysTransactions.filter(t => t.paymentMethod === 'credit');
  const totalCreditValue = creditTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalCreditBalance = creditTransactions.reduce(
    (sum, t) => sum + (t.credit?.creditBalance || 0),
    0
  );

  const totalTx = todaysTransactions.length;
  const purchaseTypeRatio = {
    inStore: totalTx > 0 ? ((purchaseTypeCounts['in-store'] || 0) / totalTx) * 100 : 0,
    online: totalTx > 0 ? ((purchaseTypeCounts['online'] || 0) / totalTx) * 100 : 0,
  };

  const paymentMethodRatio = {
    cash: totalTx > 0 ? ((paymentMethodCounts['cash'] || 0) / totalTx) * 100 : 0,
    card: totalTx > 0 ? ((paymentMethodCounts['card'] || 0) / totalTx) * 100 : 0,
    transfer: totalTx > 0 ? ((paymentMethodCounts['transfer'] || 0) / totalTx) * 100 : 0,
    split: totalTx > 0 ? ((paymentMethodCounts['split'] || 0) / totalTx) * 100 : 0,
  };
  
 
  reportWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${report.type} Sales Report - ${report.dateRange}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; }
          
          /* Custom Scrollbar */
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #f1f1f1; }
          ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #555; }
          
          /* Card Hover Effects */
          .card-hover:hover { transform: translateY(-2px); transition: transform 0.2s ease; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
          
          /* Badge Styles */
          .badge { display: inline-flex; align-items: center; border-radius: 9999px; font-weight: 500; font-size: 0.75rem; padding: 0.25rem 0.75rem; }
          .badge-green { background-color: #d1fae5; color: #065f46; }
          .badge-red { background-color: #fee2e2; color: #991b1b; }
          .badge-yellow { background-color: #fef3c7; color: #92400e; }
          .badge-blue { background-color: #dbeafe; color: #1e40af; }
          .badge-purple { background-color: #ede9fe; color: #5b21b6; }
          .badge-gray { background-color: #f3f4f6; color: #374151; }
          
          /* Table Styles */
          .table-container { border-radius: 0.5rem; overflow: hidden; border: 1px solid #e5e7eb; }
          .table-header { background-color: #111827; color: white; }
          .table-row:nth-child(even) { background-color: #f9fafb; }
          .table-row:hover { background-color: #f3f4f6; }
          
          /* Button Styles */
          .btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 0.375rem; font-weight: 500; padding: 0.5rem 1rem; transition: all 0.2s; cursor: pointer; border: 1px solid transparent; }
          .btn-primary { background-color: #111827; color: white; }
          .btn-primary:hover { background-color: #1f2937; }
          .btn-outline { background-color: transparent; border: 1px solid #d1d5db; color: #374151; }
          .btn-outline:hover { background-color: #f9fafb; }
          .btn-danger { background-color: #dc2626; color: white; }
          .btn-danger:hover { background-color: #b91c1c; }
          .btn-sm { padding: 0.25rem 0.75rem; font-size: 0.875rem; }
          
          /* Stats Grid */
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
          
          @media print {
            .no-print { display: none !important; }
            body { font-size: 12pt; }
          }
        </style>
      </head>
      <body class="bg-gray-50 p-4 md:p-6 lg:p-8">
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div class="h-10 w-10 bg-green-400 rounded-lg flex items-center justify-center">
                  <span class="text-black font-bold text-sm">BMT</span>
                </div>
                <div>
                  <div class="font-bold text-gray-900 text-xl">Big Men Transaction Apparel</div>
                  <div class="text-sm text-gray-600">${report.type} Sales Report</div>
                </div>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">${report.dateRange} Sales Report</h1>
              <div class="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                <span><i class="fas fa-calendar-alt mr-1"></i> ${formatDate(report.startDate)} - ${formatDate(report.endDate)}</span>
                <span>|</span>
                <span><i class="fas fa-file-alt mr-1"></i> ${report.type}</span>
                <span>|</span>
                <span><i class="fas fa-cash-register mr-1"></i> ${cashiers.find(c => c.id === selectedCashier)?.name || 'All Cashiers'}</span>
                <span>|</span>
                <span><i class="fas fa-sync-alt mr-1"></i> Generated: ${new Date().toLocaleString()}</span>
              </div>
            </div>
            
            <div class="flex items-center gap-3 no-print">
              <button class="btn btn-outline" onclick="window.print()">
                <i class="fas fa-print mr-2"></i> Print
              </button>
              <button class="btn btn-primary" onclick="window.close()">
                <i class="fas fa-times mr-2"></i> Close
              </button>
            </div>
          </div>
          
          <!-- Summary Stats -->
          <div class="stats-grid">
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500">Total Sales</div>
                  <div class="text-xl font-bold text-gray-900">NGN ${totalSales.toFixed(2)}</div>
                </div>
                <div class="bg-green-100 p-2 rounded-lg">
                  <i class="fas fa-dollar-sign text-green-600 text-lg"></i>
                </div>
              </div>
            </div>
            
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500">Tax Collected</div>
                  <div class="text-xl font-bold text-gray-900">NGN ${totalTax.toFixed(2)}</div>
                </div>
                <div class="bg-blue-100 p-2 rounded-lg">
                  <i class="fas fa-receipt text-blue-600 text-lg"></i>
                </div>
              </div>
            </div>
            
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500">Items Sold</div>
                  <div class="text-xl font-bold text-gray-900">${totalItems}</div>
                </div>
                <div class="bg-yellow-100 p-2 rounded-lg">
                  <i class="fas fa-shopping-cart text-green-500 text-lg"></i>
                </div>
              </div>
            </div>
            
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500">Total Transactions</div>
                  <div class="text-xl font-bold text-gray-900">${todaysTransactions.length}</div>
                </div>
                <div class="bg-purple-100 p-2 rounded-lg">
                  <i class="fas fa-exchange-alt text-purple-600 text-lg"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Detailed Stats -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <div class="text-sm font-medium text-gray-900">Purchase Type Ratio</div>
                <i class="fas fa-chart-pie text-gray-400"></i>
              </div>
              <div class="flex flex-wrap gap-2">
                <span class="badge badge-blue">In-Store: ${purchaseTypeRatio.inStore.toFixed(1)}%</span>
                <span class="badge badge-purple">Online: ${purchaseTypeRatio.online.toFixed(1)}%</span>
              </div>
            </div>
            
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <div class="text-sm font-medium text-gray-900">Payment Method Ratio</div>
                <i class="fas fa-credit-card text-gray-400"></i>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <span class="badge badge-green">Cash: ${paymentMethodRatio.cash.toFixed(1)}%</span>
                <span class="badge badge-blue">Card: ${paymentMethodRatio.card.toFixed(1)}%</span>
                <span class="badge badge-purple">Transfer: ${paymentMethodRatio.transfer.toFixed(1)}%</span>
                <span class="badge badge-yellow">Split: ${paymentMethodRatio.split.toFixed(1)}%</span>
              </div>
            </div>
            
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500">Installments</div>
                  <div class="text-xl font-bold">${installmentTransactions.length}</div>
                  <div class="text-xs text-gray-500 mt-1">${activeInstallments} active</div>
                </div>
                <div class="bg-indigo-100 p-2 rounded-lg">
                  <i class="fas fa-calendar-check text-indigo-600 text-lg"></i>
                </div>
              </div>
            </div>
            
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500">Installment Value</div>
                  <div class="text-xl font-bold">NGN ${totalInstallmentAmount.toFixed(2)}</div>
                </div>
                <div class="bg-purple-100 p-2 rounded-lg">
                  <i class="fas fa-money-bill-wave text-purple-600 text-lg"></i>
                </div>
              </div>
            </div>
            
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500">Credit Sales (Waived)</div>
                  <div class="text-xl font-bold text-gray-900">${creditTransactions.length}</div>
                  <div class="text-xs text-gray-500 mt-2">
                    <div>Total Value: NGN ${totalCreditValue.toFixed(2)}</div>
                    <div>Outstanding Balance: NGN ${totalCreditBalance.toFixed(2)}</div>
                  </div>
                </div>
                <div class="bg-blue-100 p-2 rounded-lg">
                  <i class="fas fa-credit-card text-blue-600 text-lg"></i>
                </div>
              </div>
            </div>
            
            <div class="card-hover bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500">Total Discount</div>
                  <div class="text-xl font-bold">NGN ${totalDiscounts.toFixed(2)}</div>
                </div>
                <div class="bg-red-100 p-2 rounded-lg">
                  <i class="fas fa-tag text-red-600 text-lg"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Transaction Table -->
          <div class="card-hover bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-bold text-gray-900">Transaction Details</h2>
                  <p class="text-sm text-gray-600">${todaysTransactions.length} transactions in this period</p>
                </div>
                <div class="text-sm text-gray-500">
                  <i class="fas fa-info-circle mr-1"></i> ${report.startDate} to ${report.endDate}
                </div>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  ${todaysTransactions.length > 0 ? todaysTransactions.slice(0, 50).map(t => `
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        ${new Date(t.timestamp).toLocaleDateString()} ${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                        ${t.id}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div class="flex items-center">
                          <i class="fas fa-user text-gray-400 mr-2"></i>
                          ${t.customer.name}
                        </div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span class="badge badge-gray">${t.items.length} items</span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div class="flex items-center gap-1">
                          <span class="text-lg">
                            ${t.paymentMethod === 'cash' ? '💰' : 
                              t.paymentMethod === 'card' ? '💳' : 
                              t.paymentMethod === 'transfer' ? '📱' : 
                              t.paymentMethod === 'split' ? '🔀' : 
                              t.paymentMethod === 'installment' ? '📆' : 
                              t.paymentMethod === 'credit' ? '💳' : '💵'}
                          </span>
                          <span class="capitalize">${t.paymentMethod}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                        NGN ${t.total.toFixed(2)}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span class="capitalize">${t.purchaseType || 'in-store'}</span>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-3xl mb-2 block text-gray-300"></i>
                        No transactions found in this period
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
            
            ${todaysTransactions.length > 50 ? `
              <div class="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
                <i class="fas fa-ellipsis-h mr-2"></i>Showing 50 of ${todaysTransactions.length} transactions
              </div>
            ` : ''}
            
            <div class="p-4 border-t border-gray-200 bg-gray-50">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div class="text-xs text-gray-500">Total Transactions</div>
                  <div class="text-sm font-bold text-gray-900">${todaysTransactions.length}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Total Amount</div>
                  <div class="text-sm font-bold text-gray-900">NGN ${totalSales.toFixed(2)}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Average Ticket</div>
                  <div class="text-sm font-bold text-gray-900">NGN ${(todaysTransactions.length > 0 ? totalSales / todaysTransactions.length : 0).toFixed(2)}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Items per Transaction</div>
                  <div class="text-sm font-bold text-gray-900">${(todaysTransactions.length > 0 ? totalItems / todaysTransactions.length : 0).toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Report Footer -->
          <div class="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <div class="flex flex-col items-center gap-2">
              <div class="flex items-center gap-4">
                <div>Report generated by Big Men Transaction Apparel</div>
                <div>•</div>
                <div>For inquiries: contact@bigmenapparel.com</div>
                <div>•</div>
                <div>0800-BIG-MEN</div>
              </div>
              <div>Report ID: ${report.id} | Period: ${report.startDate} to ${report.endDate} | Type: ${report.type}</div>
              <div class="text-xs mt-2">© ${new Date().getFullYear()} Powered By Qodebyte Pro Services. All rights reserved.</div>
            </div>
          </div>
        </div>
        
        <script>
          // Add print functionality
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
              e.preventDefault();
              window.print();
            }
          });
        </script>
      </body>
    </html>
  `);
  
  reportWindow.document.close();
};

  const downloadReport = (report: GeneratedReport): void => {


    if (!report.apiData || !report.apiData.transactions) {
      toast("No detailed data found for this report.");
      return;
    }
 
    const filteredTransactions = report.apiData.transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      const startDate = new Date(report.startDate);
      const endDate = new Date(report.endDate);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    const reportData = {
      ...report,
      transactions: filteredTransactions.map(t => ({
        id: t.id,
        timestamp: t.timestamp,
        customer: t.customer,
        items: t.items.map(i => ({
          id: i.id,
          productName: i.variantId,
          quantity: i.quantity,
          price: i.unitPrice,
          total: i.unitPrice * i.quantity,
        })),
        tax: t.tax,
  total: t.total,
  paymentMethod: t.paymentMethod,
  purchaseType: t.purchaseType,
  discount: t.discount || 0,
  installmentPlan: t.installmentPlan,
  credit: t.credit,
      })),
     summary: {
  totalTransactions: filteredTransactions.length,
  totalRevenue: filteredTransactions.reduce((sum, t) => sum + t.total, 0),
  totalDiscount: filteredTransactions.reduce((sum, t) => sum + (t.discount || 0), 0),
  averageTransaction: filteredTransactions.length > 0
    ? filteredTransactions.reduce((sum, t) => sum + t.total, 0) / filteredTransactions.length
    : 0,
},
      paymentMethodBreakdown: filteredTransactions.reduce((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  
  productBreakdown: report.apiData?.product_breakdown ?? [],
    };
    
    
    let data: string;
    let mimeType: string;
    let extension: string;
    
    switch (report.format) {
      case 'json':
        data = JSON.stringify(reportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'csv':
       
        const csvRows = [];
      
        csvRows.push(['Summary']);
        csvRows.push(['Total Transactions', reportData.summary.totalTransactions]);
        csvRows.push(['Total Revenue', `NGN ${reportData.summary.totalRevenue.toFixed(2)}`]);
        csvRows.push(['Total Discount', `NGN ${reportData.summary.totalDiscount.toFixed(2)}`]);
        csvRows.push(['Average Transaction', `NGN ${reportData.summary.averageTransaction.toFixed(2)}`]);
        csvRows.push([]);
        
       
        csvRows.push(['Transactions']);
        csvRows.push(['Date', 'Customer', 'Payment Method', 'Items', 'Total']);
        reportData.transactions.forEach(t => {
          csvRows.push([
            new Date(t.timestamp).toLocaleDateString(),
            t.customer.name,
            t.paymentMethod,
            t.items.length,
            `NGN ${t.total.toFixed(2)}`
          ]);
        });
        
        data = csvRows.map(row => row.join(',')).join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'pdf':
      case 'excel':
      default:
        data = JSON.stringify(reportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
    }
    
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${report.dateRange.replace(/[^a-zA-Z0-9]/g, '-')}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
   
      <Card className='bg-gray-900 text-white'>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Configure and generate sales reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className='flex flex-col gap-2'>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className='flex flex-col gap-2'>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                />
              </div>
              
              <div className='flex flex-col gap-2'>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className='flex flex-col gap-2'>
              <Label htmlFor="reportFormat">Report Format</Label>
              <Select value={reportFormat} onValueChange={(value: ReportFormat) => setReportFormat(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Include Sections</Label>
                <span className="text-sm text-gray-500">Toggle sections to include in report</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={includeSummary} onCheckedChange={setIncludeSummary} />
                  <Label>Summary</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch checked={includeDetails} onCheckedChange={setIncludeDetails} />
                  <Label>Transaction Details</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch checked={includePaymentMethods} onCheckedChange={setIncludePaymentMethods} />
                  <Label>Payment Methods</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch checked={includeProductBreakdown} onCheckedChange={setIncludeProductBreakdown} />
                  <Label>Product Breakdown</Label>
                </div>
              </div>
            </div>
            
            <div className='flex flex-col gap-2'>
              <Label htmlFor="cashier">Cashier</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cashier" />
                </SelectTrigger>
                <SelectContent>
                  {cashiers.map(cashier => (
                    <SelectItem key={cashier.id} value={cashier.id}>
                      {cashier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200 text-sm">
              {error}
            </div>
          )}
          <Button 
            className="w-full bg-green-400 hover:bg-green-500 text-black"
            onClick={generateReport}
            disabled={isGenerating}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
          </div>
        </CardContent>
      </Card>
      
     
      {generatedReports.length > 0 ? (
        <Card className='bg-gray-900 text-white'>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>
                  {generatedReports.length} reports generated
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.dateRange}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.type}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(report.startDate)}</TableCell>
                      <TableCell>{formatDate(report.endDate)}</TableCell>
                      <TableCell className="uppercase">{report.format}</TableCell>
                      <TableCell>{report.transactions}</TableCell>
                      <TableCell className="font-bold">
                        NGN {report.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReport(report)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
           
            {generatedReports.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className='bg-white text-gray-900 shadow-2xl border border-gray-100'>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500">Total Reports</div>
                    <div className="text-xl font-bold">{generatedReports.length}</div>
                  </CardContent>
                </Card>
                
                <Card className='bg-white text-gray-900 shadow-2xl border border-gray-100'>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500">Total Transactions</div>
                    <div className="text-xl font-bold">
                      {generatedReports.reduce((sum, r) => sum + r.transactions, 0)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className='bg-white text-gray-900 shadow-2xl border border-gray-100'>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="text-xl font-bold">
                      NGN {generatedReports.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      ) : hasAttemptedGenerate ? (
        <Card className='bg-gray-900 text-white'>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No transactions found for the selected date range and filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">Try adjusting your date range or filters</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
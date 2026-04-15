'use client';
import { use, useEffect, useState } from 'react';

import { DateRangeFilter } from "./components/DateRangeFilter";
import { DashboardTabs } from "./components/DashboardTabs";
import { KpiCard } from "./components/KpiCard";
import { StockAlertWidget } from "./components/StockAlertWidget";
import { TopProductsWidget } from "./components/TopProductsWidget";

import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,

  BarChart3,
  PieChartIcon
} from "lucide-react";
import { DashboardLayout } from './components/DashboardLayout';
import { TabsContent } from '@/components/ui/tabs';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StockMovementTable } from '../inventory/components/StockMovement';
import { TransactionsTab } from '../sales/components/TransactionsTab';
import { Expense, ExpenseCategory } from '../utils/type';
import { ExpensesTable } from '../expenses/component/ExpensesTable';
import { toast } from 'sonner';
import { CreditInstallmentOverview } from './components/SalesCategoryChart';
import { usePageGuard } from '../hooks/usePageGuard';
import { set } from 'zod';

type KPIData = {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  description: string;
};

type LoginAttemptType = {
  login_attempt_id: string;
  admin_id: string;
  adminName: string;
  email: string;
  device: string;
  ip_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approved_by_id: string | null;
  approvedByName: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  createdAt: string;
  updatedAt: string;
};


export default function DashboardPage() {
     usePageGuard([
    "view_inventory",
    "view_expenses",
    "view_customer",
    "view_staff",
    "view_settings",
    "view_login_attempts"
  ]);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    filter: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [filterDate, setFilterDate] = useState("yesterday")
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [transactionIdFilter, setTransactionIdFilter] = useState('');
    const [dateRangeTransactionFilter, setDateRangeTransactionFilter] = useState({
    filter: 'today',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    });
      const [totalCount, setTotalCount] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
     const [loading, setLoading] = useState(false);
       const [totalPages, setTotalPages] = useState(1);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
 const [error, setError] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

const [logins, setLogins] = useState<LoginAttemptType[]>([]);

const [loginTotalPages, setLoginTotalPages] = useState(1);
const [loginCurrentPage, setLoginCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 8;
const [loadingLogins, setLoadingLogins] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
      const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);

const [pendingLogins, setPendingLogins] = useState();
const [succesfulLogins, setSuccessfulLogins] = useState();
const [approvedLogins, setApprovedLogins] = useState();
const [rejectedLogins, setRejectedLogins] = useState();


 const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
 const limit = 8;

   const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  };

  const fetchLogins = async (page = 1) => {
  setLoadingLogins(true);
  try {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${apiUrl}/auth/login-attempts?page=${page}&limit=${ITEMS_PER_PAGE}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch login attempts");
    }

    const data = await response.json();
    setLogins(data.data || []);
    setLoginTotalPages(data.pagination.totalPages);
    setLoginCurrentPage(data.pagination.page);

    const loginsArray = data.data || [];

      const pendingCount = loginsArray.filter((login: LoginAttemptType) => login.status === 'pending').length;
    const successfulCount = loginsArray.filter((login: LoginAttemptType) => login.status === 'completed').length;
    const approvedCount = loginsArray.filter((login: LoginAttemptType) => login.status === 'approved').length;
    const rejectedCount = loginsArray.filter((login: LoginAttemptType) => login.status === 'rejected').length;

    setPendingLogins(pendingCount);
    setSuccessfulLogins(successfulCount);
    setApprovedLogins(approvedCount);
    setRejectedLogins(rejectedCount);

  } catch (err) {
    console.error(err);
    toast.error("Failed to load login attempts");
  } finally {
    setLoadingLogins(false);
  }
};


useEffect(() => {
  fetchLogins(loginCurrentPage);
}, [loginCurrentPage]);

const handleApproveLogin = async (id: string) => {
  try {
    setIsSubmitting(true);
    const token = getAuthToken();
    const res = await fetch(`${apiUrl}/auth/login-attempts/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to approve login");

    toast.success("Login approved!");
    fetchLogins(loginCurrentPage);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error approving login");
  } finally {
    setIsSubmitting(false);
  }
};

const handleRejectLogin = async (id: string) => {
  try {
    setIsSubmitting(true);
    const token = getAuthToken();
    const res = await fetch(`${apiUrl}/auth/login-attempts/${id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Rejected via dashboard" }),
    });

    if (!res.ok) throw new Error("Failed to reject login");

    toast.success("Login rejected!");
    fetchLogins(loginCurrentPage);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error rejecting login");
  } finally {
    setIsSubmitting(false);
  }
};


  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${apiUrl}/expenses/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchKPIData = async (filterType: string) => {
    try {
      setKpiLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        toast.error('Authentication required');
        return;
      }

      let url = `${apiUrl}/analytics/dashboard-kpi?filter=${filterType}`;

      // Add custom date range if needed
      if (filterType === 'custom' && dateRangeTransactionFilter.startDate && dateRangeTransactionFilter.endDate) {
        url += `&start_date=${dateRangeTransactionFilter.startDate}&end_date=${dateRangeTransactionFilter.endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch KPI data: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.kpi) {
        const kpi = data.kpi;

        // Format currency values
        const formatCurrency = (value: number) => {
          return `NGN ${value.toLocaleString('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`;
        };

        // Build KPI cards with dynamic data
        const dynamicKpiData: KPIData[] = [
          {
            title: "Total Sales",
            value: formatCurrency(kpi.total_sales),
            change: "+8.2%", // You might calculate this from backend if you have historical data
            icon: <DollarSign className="h-5 w-5" />,
            description: "earned"
          },
          {
            title: "Total Transactions",
            value: kpi.total_transactions.toString(),
            change: "+8.2%",
            icon: <CreditCard className="h-5 w-5" />,
            description: "orders completed"
          },
          {
            title: "Total Expenses",
            value: formatCurrency(kpi.total_expense),
            change: "+3.1%",
            icon: <TrendingDown className="h-5 w-5" />,
            description: "operational costs"
          },
          {
            title: "Net Profit",
            value: formatCurrency(kpi.net_profit),
            change: kpi.net_profit >= 0 ? "+18.7%" : "-18.7%",
            icon: <TrendingUp className="h-5 w-5" />,
            description: "after all deductions"
          }
        ];

        setKpiData(dynamicKpiData);
      }
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      toast.error('Failed to load KPI data');
    } finally {
      setKpiLoading(false);
    }
  };

  const fetchExpenses = async (page = 1) => {
    setLoading(true);
    setError(null);
    setFilterDate("dateRange")

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      let url = `${apiUrl}/expenses?page=${page}&limit=${limit}`;
      
      if (statusFilter !== 'all') {
        url += `&filter=${statusFilter}`;
      }
      
      if (filterDate !== 'all') {
        url += `&filter=${filterDate}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch expenses');

      const data = await response.json();
      setExpenses(data.expenses);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
      setCurrentPage(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };



    useEffect(() => {
      fetchExpenses(1);
    }, [statusFilter, filterDate]);

    useEffect(() => {
       fetchCategories();
    }, []);


  const handleViewInvoice = (expense: Expense) => {
    window.open(`/expenses/invoices/${expense.id}`, '_blank');
  };

 const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${apiUrl}/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete expense');
      }

      await fetchExpenses(currentPage);
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error deleting expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${apiUrl}/expenses/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update expense');
      }

      await fetchExpenses(currentPage);
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === id ? { ...exp, status: newStatus } : exp
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error updating expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(prev => ({ ...prev, filter: range }));
    console.log("Date range changed to:", range);
  };





   useEffect(() => {
    fetchKPIData(dateRange.filter);
  }, [dateRange]);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setCurrentPage(1);
}, [activeTab]);

  return (
    <DashboardLayout>
    
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-900 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <DateRangeFilter onDateRangeChange={handleDateRangeChange} />
      </div>

    
      <div className="grid grid-cols-1 
  xs:grid-cols-2 
  lg:grid-cols-4 
  gap-4 md:gap-5 lg:gap-6 
  mb-8">
       {kpiLoading ? (
         
          Array(4).fill(0).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="bg-gray-100 border border-gray-200 rounded-lg p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          ))
        ) : kpiData.length > 0 ? (
          kpiData.map((kpi, index) => (
            <KpiCard key={`kpi-${index}`} {...kpi} />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No KPI data available</p>
          </div>
        )}
      </div>

     
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab}>
        
        <TabsContent value="overview" className="space-y-6">
         
          <div className="grid grid-cols-1  gap-6">
           
           <div className="bg-white border border-gray-100 shadow-2xl
  rounded-xl 
  p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Income vs Expenses
                  </h3>
                  <p className="text-sm text-gray-800">Monthly comparison</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">Expenses</span>
                  </div>
                </div>
              </div>
            <IncomeExpenseChart 
                dateRange={dateRange.filter}
                onDataLoaded={(data) => {
                  console.log('Chart data loaded:', data);
                }}
              />
            </div>
             </div>

          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StockAlertWidget  />
          <TopProductsWidget  dateRange={dateRange.filter} />

          </div>


          <div  className="grid grid-cols-1  gap-6">
             <div className="bg-white border border-gray-100 shadow-2xl rounded-xl p-4 sm:p-5 lg:p-6 w-full  ">
      
 
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-green-500" />
            Due Installment & Credit-installment Overview
          </h3>
          <p className="text-sm sm:text-base text-gray-800">Credit-Installment</p>
        </div>
        <div className="text-sm sm:text-base text-gray-900">Selected: {dateRange.filter}</div>
      </div>

      
      <CreditInstallmentOverview />
           </div>
          </div>
        </TabsContent>

        
        <TabsContent value="stock">
          <Card className="bg-gray-900 border-gray-200">
            <CardHeader>
              <CardTitle >Stock Movement</CardTitle>
              <CardDescription >
                View all inventory movements
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3'>
              <StockMovementTable />
            </CardContent>
          </Card>
        </TabsContent>

       
        <TabsContent value="sales">
              <Card className="bg-gray-900 border-gray-200">
            <CardHeader>
              <CardTitle ></CardTitle>
              <CardDescription >
        
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3'>
              <TransactionsTab
               dateRange={dateRange} 
      paymentMethodFilter={paymentMethodFilter}
      onPaymentMethodFilterChange={setPaymentMethodFilter}
      highlightedTransactionId={transactionIdFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>

       
        <TabsContent value="expenses">
          <Card className="bg-gray-900 border-gray-200">
            <CardHeader>
              <CardTitle ></CardTitle>
              <CardDescription >
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3'>
              <ExpensesTable
          expenses={expenses}
          categories={categories}
          onDelete={handleDeleteExpense}
          onViewInvoice={handleViewInvoice}
          onUpdateStatus={handleUpdateStatus}
        />
            </CardContent>
          </Card>
        </TabsContent>

       
        <TabsContent value="logins">
  <div className="bg-gray-900 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
    <h3 className="text-xl font-semibold text-white mb-6">Login Attempts & Security</h3>
    

    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-800/80">
          <tr>
            <th className="p-4 text-left font-medium text-gray-300">Email</th>
            <th className="p-4 text-left font-medium text-gray-300">Device</th>
            <th className="p-4 text-left font-medium text-gray-300">Location</th>
            <th className="p-4 text-left font-medium text-gray-300">Time</th>
            <th className="p-4 text-left font-medium text-gray-300">Approved By</th>
            <th className="p-4 text-left font-medium text-gray-300">Login Status</th>
            <th className="p-4 text-left font-medium text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          
          { loadingLogins ? (
  <tr><td colSpan={7} className="text-center p-4 text-gray-400">Loading...</td></tr>
) : logins.length === 0 ? (
  <tr><td colSpan={7} className="text-center p-4 text-gray-400">No login attempts found</td></tr>
) : (logins.map((login) => (
            <tr key={login.login_attempt_id} className="hover:bg-gray-800/50 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{login.email}</p>
                    <p className="text-xs text-gray-400">User ID: {login.login_attempt_id}</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-gray-700 flex items-center justify-center">
                    <span className="text-xs">
                      {login.device.includes('Chrome') ? '🌐' : 
                       login.device.includes('Safari') ? '🍎' : 
                       login.device.includes('Firefox') ? '🦊' : 
                       login.device.includes('Edge') ? '🔵' : '📱'}
                    </span>
                  </div>
                  <span className="text-gray-300">{login.device}</span>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="text-gray-300">{login.ip_address}</span>
                </div>
                {login.ip_address !== 'Unknown' && (
                  <p className="text-xs text-gray-400 mt-1">Approximate location</p>
                )}
              </td>
              <td className="p-4">
                <div>
                  <p className="text-white">{login.createdAt.split(' ')[1]}</p>
                  <p className="text-xs text-gray-400">{login.createdAt.split(' ')[0]}</p>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {login.approvedByName === 'System' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                      🤖 {login.approvedByName}
                    </span>
                  ) : login.approvedByName === 'Admin' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                      👑 {login.approvedByName}
                    </span>
                  ) : login.approvedByName === 'Manager' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                      👨‍💼 {login.approvedByName}
                    </span>
                  ) : (
                    <span className="text-gray-400">{login.approvedByName}</span>
                  )}
                </div>
              </td>
              <td className="p-4">
                {login.status === 'approved'  ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-700/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-2"></span>
                    Approved
                  </span>
                ) : login.status === 'pending' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-2"></span>
                    Pending
                  </span>
                ) : login.status === 'rejected' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-700/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 mr-2"></span>
                    Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-900/30 text-gray-300 border border-gray-700/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-2"></span>
                    Completed
                  </span>
                )}
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  {login.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApproveLogin(login.login_attempt_id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-green-900/50 text-green-300 hover:bg-green-900 border border-green-700/50 hover:border-green-500 transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectLogin(login.login_attempt_id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-red-900/50 text-red-300 hover:bg-red-900 border border-red-700/50 hover:border-red-500 transition-colors"
                      >
                        ✗ Reject
                      </button>
                    </>
                  )  : (
                    <div
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-900 border border-blue-700/50 hover:border-blue-500 transition-colors"
                    >
                    No Action
                    </div>
                  )}
                </div>
              </td>
            </tr>
          )))}
        </tbody>
      </table>

      <div className="sm:flex sm:items-center sm:justify-between grid grid-cols-1 gap-2 mt-4 px-2">
  <p className="text-sm text-gray-400">
    Page {loginCurrentPage} of {loginTotalPages} - Total Logins: {totalCount}
  </p>

  <div className="flex gap-2">
  <button
    disabled={loginCurrentPage === 1}
    onClick={() => setLoginCurrentPage(p => Math.max(1, p - 1))}
    className="px-3 py-1 text-sm rounded-md bg-gray-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
  >
    Previous
  </button>

  <button
    disabled={loginCurrentPage === loginTotalPages}
    onClick={() => setLoginCurrentPage(p => Math.min(loginTotalPages, p + 1))}
    className="px-3 py-1 text-sm rounded-md bg-gray-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
  >
    Next
  </button>
</div>
</div>
    </div>

   
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400">Total Logins</p>
      <p className="text-2xl font-semibold text-white">{logins.length}</p>
    </div>
    <div className="h-10 w-10 rounded-full bg-blue-900/30 flex items-center justify-center">
      <span className="text-lg">👥</span>
    </div>
  </div>
</div>

<div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400">Successful Logins</p>
      <p className="text-2xl font-semibold text-green-300">{succesfulLogins}</p>
    </div>
    <div className="h-10 w-10 rounded-full bg-green-900/30 flex items-center justify-center">
      <span className="text-lg">✅</span>
    </div>
  </div>
</div>

<div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400">Pending Approval</p>
      <p className="text-2xl font-semibold text-green-400">{pendingLogins}</p>
    </div>
    <div className="h-10 w-10 rounded-full bg-green-900/30 flex items-center justify-center">
      <span className="text-lg">⏳</span>
    </div>
  </div>
</div>

<div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400">Approved Logins</p>
      <p className="text-2xl font-semibold text-green-300">{approvedLogins}</p>
    </div>
    <div className="h-10 w-10 rounded-full bg-green-900/30 flex items-center justify-center">
      <span className="text-lg">✅</span>
    </div>
  </div>
</div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
           <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400">Rejected Logins</p>
      <p className="text-2xl font-semibold text-red-400">{rejectedLogins}</p>
    </div>
    <div className="h-10 w-10 rounded-full bg-red-900/30 flex items-center justify-center">
      <span className="text-lg">❌</span>
    </div>
  </div>
          </div>
    </div>


    <div className="mt-4 text-center">
      <p className="text-sm text-gray-500">Based on selected date range: {dateRange.filter}</p>
      <p className="text-xs text-gray-600 mt-1">Last updated: Just now</p>
    </div>
  </div>
</TabsContent>
      </DashboardTabs>
    </DashboardLayout>
  );
}
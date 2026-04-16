
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Filter, Upload, CheckCircle, XCircle, AlertCircle, TrendingUp, DollarSign, Tag, BarChart3, PieChart as PieChartIcon, Pencil, Trash, Loader, Trash2, Edit2, Check, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays,  parseISO,isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell, PieChart } from 'recharts';
import { InventoryLayout } from '../inventory/components/InventoryLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KPICard } from './component/KPICard';
import { Expense, ExpenseCategory, TimeFilter } from '../utils/type';
import { ExpensesTable } from './component/ExpensesTable';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePageGuard } from '../hooks/usePageGuard';


interface ChartDataPoint {
  time: string;
  revenue: number;
  expenses: number;
}

interface ChartApiResponse {
  success: boolean;
  chart_data: Array<{
    period?: string;
    time?: string;
    day?: string;
    week?: string;
    income?: number;
    expense?: number;
  }>;
}


type ChartDataInput = Record<string, string | number>;

interface ExpenseCategoryData extends ChartDataInput {
  name: string;
  category_id: string;
  value: number;
  amount: number;
  percentage: number;
  color: string;
}

interface ExpenseCategoryResponse {
  success: boolean;
  chart_data: ExpenseCategoryData[];
  summary: {
    total_categories: number;
    total_expenses: number;
    total_amount: number;
  };
}

interface RecentExpense {
  expense_id: string;
  category: {
    id: string;
    name: string;
  };
  amount: number;
  description: string;
  date: string;
  recorded_by: {
    id: string;
    name: string;
  };
  approved_at: string;
}

interface RecentExpensesResponse {
  success: boolean;
  recent_expenses: RecentExpense[];
  summary: {
    total_recent_expenses: number;
    total_recent_amount: number;
  };
}


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ExpensesPage() {
    usePageGuard();
   const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('this-month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState('overview');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
   const [categoryDistributionData, setCategoryDistributionData] = useState<ExpenseCategoryData[]>([]);
  const [categoryDistributionLoading, setCategoryDistributionLoading] = useState(false);
  const [recentExpensesData, setRecentExpensesData] = useState<RecentExpense[]>([]);
  const [recentExpensesLoading, setRecentExpensesLoading] = useState(false);

  const router = useRouter();

const handleViewInvoice = (expense: Expense) => {
  router.push(`/expenses/invoices/${expense.id}`);
};

 const fetchExpenseByCategory = async () => {
    setCategoryDistributionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      let url = `${apiUrl}/analytics/expense-by-category`;
      
    
      if (timeFilter === 'today') {
        url += '?filter=today';
      } else if (timeFilter === 'yesterday') {
        url += '?filter=yesterday';
      } else if (timeFilter === 'this-week') {
        url += '?filter=last7';
      } else if (timeFilter === 'this-month') {
        url += '?filter=thisMonth';
      } else if (timeFilter === 'custom' && customStartDate && customEndDate) {
        const startDate = customStartDate.toISOString().split('T')[0];
        const endDate = customEndDate.toISOString().split('T')[0];
        url += `?filter=custom&start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch expense by category');

      const data: ExpenseCategoryResponse = await response.json();
      
      if (data.success && data.chart_data) {
        setCategoryDistributionData(data.chart_data);
      }
    } catch (err) {
      console.error('Error fetching expense by category:', err);
      setCategoryDistributionData([]);
    } finally {
      setCategoryDistributionLoading(false);
    }
  };

 
  const fetchRecentExpenses = async () => {
    setRecentExpensesLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${apiUrl}/analytics/recent-approved-expenses?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch recent expenses');

      const data: RecentExpensesResponse = await response.json();
      
      if (data.success && data.recent_expenses) {
        setRecentExpensesData(data.recent_expenses);
      }
    } catch (err) {
      console.error('Error fetching recent expenses:', err);
      setRecentExpensesData([]);
    } finally {
      setRecentExpensesLoading(false);
    }
  };

 
  useEffect(() => {
    fetchExpenseByCategory();
    fetchRecentExpenses();
  }, [timeFilter, customStartDate, customEndDate]);



  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isDeleteExpenseDialogOpen, setIsDeleteExpenseDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  type ExpenseFormData = {
  expense_amount: string;
  note: string;
  date: string;
  expense_category_id: string;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'approved' | 'rejected';
};

const [expenseFormData, setExpenseFormData] = useState<ExpenseFormData>({
  expense_amount: '',
  note: '',
  date: new Date().toISOString().split('T')[0],
  expense_category_id: '',
  payment_method: 'cash', 
  payment_status: 'pending',
});

  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
 const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
const [formData, setFormData] = useState({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseCategoryOpen, setExpenseCategoryOpen] = useState(false);
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);
  const categoriesPerPage = 10;


   const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
      const limit = 8;




  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'yesterday':
        const yesterday = subDays(new Date(), 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0));
        endDate = new Date(yesterday.setHours(23, 59, 59, 999));
        break;
      case 'this-week':
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'this-month':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return expenses;
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        return expenses;
    }

    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.createdAt);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });
  }, [expenses, timeFilter, customStartDate, customEndDate]);

  const PAYMENT_METHODS = [
  { value: 'cash' as const, label: 'Cash' },
  { value: 'credit_card' as const, label: 'Credit Card' },
  { value: 'debit_card' as const, label: 'Debit Card' },
  { value: 'bank_transfer' as const, label: 'Bank Transfer' },
  { value: 'mobile_payment' as const, label: 'Mobile Payment' },
  { value: 'other' as const, label: 'Other' },
] as const;

type PaymentMethod = typeof PAYMENT_METHODS[number]['value'];


 
  const [kpiData, setKpiData] = useState({
    totalExpense: 0,
    totalRevenue: 0,
    categoryCount: 0,
    netProfit: 0,
    grossProfit: 0,
    totalTax: 0,
    totalDiscount: 0,
  });
  const [kpiLoading, setKpiLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);
   const [incomeVsExpenseData, setIncomeVsExpenseData] = useState<ChartDataPoint[]>([]);

  const fetchIncomeVsExpenseChart = async () => {
    setChartLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      let url = `${apiUrl}/analytics/income-vs-expense`;
      
   
      if (timeFilter === 'today') {
        url += '?filter=today';
      } else if (timeFilter === 'yesterday') {
        url += '?filter=yesterday';
      } else if (timeFilter === 'this-week') {
        url += '?filter=last7';
      } else if (timeFilter === 'this-month') {
        url += '?filter=thisMonth';
      } else if (timeFilter === 'custom' && customStartDate && customEndDate) {
        const startDate = customStartDate.toISOString().split('T')[0];
        const endDate = customEndDate.toISOString().split('T')[0];
        url += `?filter=custom&start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch chart data');

      const data: ChartApiResponse = await response.json();
      
      if (data.success && data.chart_data && Array.isArray(data.chart_data)) {
    
        const formattedData: ChartDataPoint[] = data.chart_data.map((item) => ({
          time: String(item.period || item.time || item.day || item.week || ''),
          revenue: Number(item.income || 0),
          expenses: Number(item.expense || 0),
        }));
        setIncomeVsExpenseData(formattedData);
      }
    } catch (err) {
      console.error('Error fetching income vs expense chart:', err);
      setIncomeVsExpenseData([]);
    } finally {
      setChartLoading(false);
    }
  };
 
  useEffect(() => {
    fetchIncomeVsExpenseChart();
  }, [timeFilter, customStartDate, customEndDate]);


    const fetchKPIData = async () => {
    setKpiLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      let url = `${apiUrl}/analytics/expense-kpi`;
      
      // Build query parameters based on filters
      if (timeFilter === 'today') {
        url += '?filter=today';
      } else if (timeFilter === 'yesterday') {
        url += '?filter=yesterday';
      } else if (timeFilter === 'this-week') {
        url += '?filter=last7';
      } else if (timeFilter === 'this-month') {
        url += '?filter=thisMonth';
      } else if (timeFilter === 'custom' && customStartDate && customEndDate) {
        const startDate = customStartDate.toISOString().split('T')[0];
        const endDate = customEndDate.toISOString().split('T')[0];
        url += `?filter=custom&start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch KPI data');

      const data = await response.json();
      
      if (data.success && data.kpi) {
        setKpiData({
          totalExpense: data.kpi.total_expense_amount,
          totalRevenue: data.kpi.total_revenue,
          categoryCount: data.kpi.category_count,
          netProfit: data.kpi.net_profit,
          grossProfit: data.kpi.gross_profit,
          totalTax: data.kpi.total_tax,
          totalDiscount: data.kpi.total_discount,
        });
      }
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      // Keep previous data on error
    } finally {
      setKpiLoading(false);
    }
  };

  // Fetch KPI when filters change
  useEffect(() => {
    fetchKPIData();
  }, [timeFilter, customStartDate, customEndDate]);

  const kpis = useMemo(() => {
    return {
      totalExpense: kpiData.totalExpense,
      totalRevenue: kpiData.totalRevenue,
      categoryCount: kpiData.categoryCount,
      netProfit: kpiData.netProfit,
      grossProfit: kpiData.grossProfit,
      totalTax: kpiData.totalTax,
      totalDiscount: kpiData.totalDiscount,
    };
  }, [kpiData]);

  const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getXAxisDataKey = () => {
    switch (timeFilter) {
      case 'today':
      case 'yesterday':
        return 'time';
      case 'this-week':
        return 'time'; 
      case 'this-month':
        return 'time'; 
      case 'custom':
    
        if (customStartDate && customEndDate) {
          const daysDiff = Math.ceil(
            (customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysDiff <= 2 ? 'time' : 'time';
        }
        return 'time';
      default:
        return 'time';
    }
  };






  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
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
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchExpenses = async (page = 1) => {
    setLoading(true);
    setError(null);

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
    fetchCategories();
    fetchExpenses(1);
  }, []);

  useEffect(() => {
    fetchExpenses(1);
  }, [statusFilter, filterDate]);


  const categoryData = useMemo(() => {
    const categoryMap = new Map();
    
    filteredExpenses.forEach(expense => {
      const category = categories.find(c => c.expense_category_id === expense.expense_category_id);
      if (category) {
        const current = categoryMap.get(category.name) || { name: category.name, value: 0, count: 0 };
        current.value += expense.expense_amount;
        current.count += 1;
        categoryMap.set(category.name, current);
      }
    });
    
    return Array.from(categoryMap.values());
  }, [filteredExpenses, categories]);


  const recentExpenses = useMemo(() => {
    return [...filteredExpenses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [filteredExpenses]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (categoryCurrentPage - 1) * categoriesPerPage;
    return categories.slice(startIndex, startIndex + categoriesPerPage);
  }, [categories, categoryCurrentPage]);

  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage);

 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      const url = editingCategory
        ? `${apiUrl}/expenses/categories/${editingCategory.expense_category_id}`
        : `${apiUrl}/expenses/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: formData.name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save category');
      }

      const savedCategory = await response.json();

      if (editingCategory) {
        setCategories(
          categories.map((cat) =>
            cat.expense_category_id === editingCategory.expense_category_id
              ? savedCategory
              : cat
          )
        );
      } else {
        setCategories([...categories, savedCategory]);
      }

      setFormData({ name: '' });
      setEditingCategory(null);
      setIsAddCategoryDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('Error saving category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(
        `${apiUrl}/expenses/categories/${categoryToDelete.expense_category_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }

      setCategories(
        categories.filter(
          (cat) => cat.expense_category_id !== categoryToDelete.expense_category_id
        )
      );
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('Error deleting category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setIsAddCategoryDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsAddCategoryDialogOpen(false);
    setFormData({ name: '' });
    setEditingCategory(null);
    setError(null);
  };

   const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseFormData.expense_amount || !expenseFormData.expense_category_id || !expenseFormData.payment_method) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found');

      const data = new FormData();
      data.append('expense_amount', expenseFormData.expense_amount);
      data.append('note', expenseFormData.note);
      data.append('date', expenseFormData.date);
      data.append('expense_category_id', expenseFormData.expense_category_id);
      data.append('payment_method', expenseFormData.payment_method);
      data.append('payment_status', expenseFormData.payment_status);

      if (receiptFile) {
        data.append('expense_reciept_url', receiptFile);
      }

      const response = await fetch(`${apiUrl}/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create expense');
      }

      await fetchExpenses(1);
      setExpenseFormData({
        expense_amount: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
        expense_category_id: '',
        payment_method: 'cash',
        payment_status: 'pending',
      });
      setReceiptFile(null);
      setIsAddExpenseDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error creating expense:', err);
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

  const getStatusBadge = (status: Expense['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-green-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    }
  };

 

  return (
    <InventoryLayout>
      <div className="p-1 md:p-3 space-y-6 bg-white text-gray-900">
       
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expense Management</h1>
            <p className="text-sm text-gray-500">Track and manage all business expenses</p>
          </div>
          
{activeTab === 'expenses' && (
  <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
    <DialogTrigger asChild>
      <Button className="bg-gray-900 hover:bg-gray-800 text-white">
        <Plus className="w-4 h-4 mr-2" />
        Add Expense
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-md bg-gray-900 border-gray-700">
      <DialogHeader>
        <DialogTitle className="text-gray-100">Add New Expense</DialogTitle>
        <DialogDescription className="text-gray-400">Enter expense details</DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleCreateExpense} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-gray-200">Category *</Label>
          <Popover open={expenseCategoryOpen} onOpenChange={setExpenseCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={expenseCategoryOpen}
                className="w-full justify-between bg-gray-700 border-gray-600 text-gray-100 font-normal hover:bg-gray-600"
              >
                {expenseFormData.expense_category_id
                  ? categories.find((cat) => cat.expense_category_id === expenseFormData.expense_category_id)?.name
                  : "Select category"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0 bg-gray-800 border-gray-700">
              <Command className="bg-gray-800 text-gray-100">
                <CommandInput placeholder="Search category..." className="text-gray-100" />
                <CommandList>
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {categories.map((cat) => (
                      <CommandItem
                        key={cat.expense_category_id}
                        value={cat.name}
                        onSelect={() => {
                          setExpenseFormData({ ...expenseFormData, expense_category_id: cat.expense_category_id });
                          setExpenseCategoryOpen(false);
                        }}
                        className="text-gray-100 hover:bg-gray-700 data-[selected='true']:bg-gray-700"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            expenseFormData.expense_category_id === cat.expense_category_id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {cat.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-gray-200">Amount (NGN) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={expenseFormData.expense_amount}
            onChange={(e) => setExpenseFormData({...expenseFormData, expense_amount: e.target.value})}
            placeholder="0.00"
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expense-date" className="text-gray-200">Date of Expense *</Label>
          <Input
            id="expense-date"
            type="date"
            value={expenseFormData.date}
            onChange={(e) => setExpenseFormData({...expenseFormData, date: e.target.value})}
            className="bg-gray-700 border-gray-600 text-gray-100"
          />
        </div>

        <div className="space-y-2">
           <Label htmlFor="payment-method" className="text-gray-200">Payment Method *</Label>
          <Select 
            value={expenseFormData.payment_method} 
            onValueChange={(value: PaymentMethod) => 
              setExpenseFormData({...expenseFormData, payment_method: value})
            }
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {PAYMENT_METHODS.map(method => (
                <SelectItem key={method.value} value={method.value} className="text-gray-100">
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="receipt" className="text-gray-200">Receipt (Optional)</Label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
            <Input
              id="receipt"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setReceiptFile(file);
                  setReceiptPreview(URL.createObjectURL(file));
                }
              }}
              className="hidden"
              disabled={isSubmitting}
            />
            <Label htmlFor="receipt" className="cursor-pointer flex flex-col items-center text-gray-300">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm">Click to upload receipt</span>
              <span className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</span>
            </Label>
            {receiptPreview && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-gray-300">Preview:</p>
                <Image 
                  width={200} 
                  height={200} 
                  src={receiptPreview} 
                  alt="Receipt preview" 
                  className="max-h-32 mx-auto rounded"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="note" className="text-gray-200">Note (Optional)</Label>
          <Input
            id="note"
            value={expenseFormData.note}
            onChange={(e) => setExpenseFormData({...expenseFormData, note: e.target.value})}
            placeholder="Additional notes..."
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
            disabled={isSubmitting}
          />
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}
        
        <DialogFooter>
          <Button 
            type="button"
            variant="outline" 
            onClick={() => {
              setIsAddExpenseDialogOpen(false);
              setReceiptPreview(null);
              setReceiptFile(null);
            }}
            disabled={isSubmitting}
            className="border-gray-600"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Expense'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
)}
        </div>

    
        <Card className="border border-gray-200 bg-gray-100 shadow-2xl text-gray-900">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium mr-4">Time Period:</span>
              
              {(['today', 'yesterday', 'this-week', 'this-month', 'custom'] as TimeFilter[]).map(filter => (
                <Button
                  key={filter}
                  variant={timeFilter === filter ? "secondary" : "ghost"}
                  onClick={() => setTimeFilter(filter)}
                  className="capitalize bg-gray-900 text-gray-100 hover:bg-gray-800 border-gray-300"
                >
                  {filter.replace('-', ' ')}
                </Button>
              ))}
              
              {timeFilter === 'custom' && (
                <div className="flex gap-2 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {customStartDate ? format(customStartDate, 'MMM dd') : 'Start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <span className="text-gray-500">to</span>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {customEndDate ? format(customEndDate, 'MMM dd') : 'End date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full ">
          <TabsList className="grid w-full md:w-auto grid-cols-3 bg-gray-900 h-20 sm:h-10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

      
          <TabsContent value="overview" className="space-y-6">
          
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <KPICard
                title="Total Expense"
                value={`NGN ${kpis.totalExpense.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
                icon={<DollarSign className="w-5 h-5" />}
                trend={kpis.totalExpense > 50000 ? 'up' : 'down'}
                isLoading={kpiLoading}
              />
              <KPICard
                title="Total Revenue"
                value={`NGN ${kpis.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
                icon={<TrendingUp className="w-5 h-5" />}
                trend="up"
                isLoading={kpiLoading}
              />
              <KPICard
                title="Net Profit"
                value={`NGN ${kpis.netProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
                icon={<TrendingUp className="w-5 h-5" />}
                trend={kpis.netProfit > 0 ? 'up' : 'down'}
                isLoading={kpiLoading}
              />

              <KPICard
                title="Gross Profit"
                value={`NGN ${kpis.grossProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
                icon={<TrendingUp className="w-5 h-5" />}
                trend={kpis.grossProfit > 0 ? 'up' : 'down'}
                isLoading={kpiLoading}
              />

              <KPICard
                title="Expense Categories"
                value={kpis.categoryCount.toString()}
                icon={<Tag className="w-5 h-5" />}
                isLoading={kpiLoading}
              />

              <KPICard
                title="Discount"
                value={`NGN ${kpis.totalDiscount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
                icon={<DollarSign className="w-5 h-5" />}
                isLoading={kpiLoading}
              />

              <KPICard
                title="Tax"
                value={`NGN ${kpis.totalTax.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
                icon={<DollarSign className="w-5 h-5" />}
                isLoading={kpiLoading}
              />
            </div>

          
            <Card className="border border-gray-200 bg-white shadow-2xl text-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue vs Expenses Over Time
                  {chartLoading && <Loader className="w-4 h-4 animate-spin ml-auto" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-400">Loading chart data...</span>
                    </div>
                  ) : incomeVsExpenseData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No data available for the selected period</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={incomeVsExpenseData} 
                        margin={{ top: 20, right: 30, left: 0, bottom: timeFilter === 'this-month' ? 80 : 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey={getXAxisDataKey()}
                          stroke="#6b7280"
                          angle={timeFilter === 'this-month' ? -45 : 0}
                          textAnchor={timeFilter === 'this-month' ? 'end' : 'middle'}
                          height={timeFilter === 'this-month' ? 80 : 30}
                        />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: 'none', 
                            color: 'white', 
                            borderRadius: '8px' 
                          }}
                          formatter={(value: number | undefined) => {
                            if (value === undefined) return ['N/A', ''];
                            return [
                              `NGN ${value.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}`, 
                              ''
                            ];
                          }}
                          labelFormatter={(label: string) => `Period: ${label}`}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="square"
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#3b82f6" 
                          name="Revenue" 
                          radius={[8, 8, 0, 0]} 
                        />
                        <Bar 
                          dataKey="expenses" 
                          fill="#ef4444" 
                          name="Expenses" 
                          radius={[8, 8, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
            <Card className="border border-gray-200 bg-gray-100 shadow-2xl text-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Expense Categories Distribution
                    {categoryDistributionLoading && (
                      <Loader className="w-4 h-4 animate-spin ml-auto" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {categoryDistributionLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-500">Loading data...</span>
                      </div>
                    ) : categoryDistributionData.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No expense data available</p>
                      </div>
                    ) : (
                   <ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Pie
      data={categoryDistributionData}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={({ name, percentage }: { name?: string; percentage?: number }) => {
        if (!name || percentage === undefined) return '';
        return `${name}: ${(percentage).toFixed(0)}%`;
      }}
      outerRadius={80}
      fill="#8884d8"
      dataKey="value"
    >
      {categoryDistributionData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip 
      formatter={(value: number | undefined): [string, string] => {
        if (value === undefined) {
          return ['N/A', 'Amount'];
        }
        return [
          `NGN ${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          'Amount'
        ];
      }}
      contentStyle={{ 
        backgroundColor: '#1f2937', 
        border: 'none', 
        color: 'white',
        borderRadius: '8px'
      }}
    />
    <Legend 
      wrapperStyle={{ paddingTop: '20px' }}
    />
  </PieChart>
</ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

         
               <Card className="border border-gray-200 bg-gray-900 text-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Expenses</CardTitle>
                    <CardDescription>Latest 5 approved expense records</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {recentExpensesLoading && (
                      <Loader className="w-4 h-4 animate-spin" />
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('expenses')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentExpensesLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-400">Loading expenses...</span>
                      </div>
                    ) : recentExpensesData.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">No recent approved expenses</p>
                      </div>
                    ) : (
                      recentExpensesData.map(expense => (
                        <div 
                          key={expense.expense_id} 
                          className="md:flex md:items-center md:justify-between grid grid-cols-1 gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-100">
                              {expense.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs bg-blue-900 text-blue-200 border-blue-700">
                                {expense.category?.name || 'Uncategorized'}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" /> Approved
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              By {expense.recorded_by?.name || 'Unknown'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-100">
                              NGN {expense.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </p>
                            <p className="text-sm text-gray-400">
                              {format(parseISO(expense.date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

    
          <TabsContent value="categories" className="space-y-6">
            <Card className="border border-gray-200 bg-gray-900 ">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expense Categories</CardTitle>
                <Dialog  open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button  onClick={() => {
                setEditingCategory(null);
                setFormData({ name: '' });
              }} className="bg-gray-100 hover:bg-gray-300 text-gray-900">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-gray-900">
                    <DialogHeader>
                    <DialogTitle className="text-gray-100">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
                      <DialogDescription> {editingCategory
                  ? 'Update the expense category name'
                  : 'Add a new expense category'}</DialogDescription>
                    </DialogHeader>
                    
                   <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Category Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Office Supplies, Travel, Utilities"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
                  disabled={isSubmitting}
                />
              </div>
              {error && <div className="text-sm text-red-500">{error}</div>}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  disabled={isSubmitting}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingCategory ? (
                    'Update Category'
                  ) : (
                    'Create Category'
                  )}
                </Button>
              </div>
            </form>
                  </DialogContent>
                </Dialog>
            

              </CardHeader>
              <CardContent>
                 {error && !isAddCategoryDialogOpen && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}
               {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-400">Loading categories...</span>
        </div>
      ) : categories.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">No expense categories found</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">
              {categories.length} Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-750">
                    <TableHead className="text-gray-100">Category Name</TableHead>
                    <TableHead className="text-gray-100 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category) => (
                    <TableRow
                      key={category.expense_category_id}
                      className="border-gray-700 hover:bg-gray-750"
                    >
                      <TableCell className="text-gray-200 font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCategoryToDelete(category);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalCategoryPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <p className="text-sm text-gray-400">
                    Showing Page {categoryCurrentPage} of {totalCategoryPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoryCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={categoryCurrentPage === 1}
                      className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoryCurrentPage(prev => Math.min(totalCategoryPages, prev + 1))}
                      disabled={categoryCurrentPage === totalCategoryPages}
                      className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-100">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="border-gray-600 text-gray-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

      
          <TabsContent value="expenses" className="space-y-6">
         <ExpensesTable
          expenses={expenses}
          categories={categories}
          onDelete={handleDeleteExpense}
          onViewInvoice={handleViewInvoice}
          onUpdateStatus={handleUpdateStatus}
        />

          </TabsContent>
        </Tabs>
      </div>
    </InventoryLayout>
  );
}





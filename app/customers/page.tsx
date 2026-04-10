'use client';

import { useEffect, useMemo, useState } from 'react';
import { InventoryLayout } from '@/app/inventory/components/InventoryLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  CreditCard,
  ShoppingBag,
  Globe,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { usePageGuard } from '../hooks/usePageGuard';

type CustomerFilter = 'all' | 'credit' | 'installment' | 'online' | 'in-store';


interface Customer {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  is_walk_in: boolean;
  customer_since: string;
  payment_status: 'normal' | 'credit' | 'installment' | 'mixed';
  payment_methods: string[];
  transaction_data: {
    total_transactions: number;
  };
  revenue_data: {
    total_revenue: number;
  };
}

interface CustomersResponse {
  success: boolean;
  customers: Customer[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

interface CustomerKPI {
  total_customers: number;
  credit_customers: number;
  installment_customers: number;
  online_customers: number;
}

/* ================= PAGE ================= */

export default function CustomerManagementPage() {
   usePageGuard();
  const router = useRouter();
  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://api.bmtpossystem.com/api';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [kpi, setKpi] = useState<CustomerKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
    const [filter, setFilter] = useState<CustomerFilter>('all');
    const [open, setOpen] = useState(false);
const [form, setForm] = useState({ name: '', phone: '', email: '' });
const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');

  /* ================= FETCH KPI ================= */

  useEffect(() => {
    const fetchKPI = async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/analytics/customer-kpi`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setKpi(data.kpi);
    };

    fetchKPI();
  }, []);

  /* ================= FETCH CUSTOMERS ================= */

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const paymentTypeMap: Record<CustomerFilter, string> = {
      'all': 'all',
      'credit': 'credit',
      'installment': 'installment',
      'online': 'online_order',
      'in-store': 'in_store'
    };

      const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...(filter === 'credit' || filter === 'installment' 
        ? { payment_type: paymentTypeMap[filter], purchase_type: 'all' }
        : { payment_type: 'all', purchase_type: paymentTypeMap[filter] }
      )
    });

    const res = await fetch(
      `${apiUrl}/analytics/customers-with-payment-methods?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

      const data: CustomersResponse = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        setPages(data.pagination.pages);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, [page, filter]);

  /* ================= SEARCH (CLIENT-SIDE) ================= */

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;

    const q = search.toLowerCase();
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [customers, search]);

  /* ================= HELPERS ================= */

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      normal: 'bg-blue-100 text-blue-800',
      credit: 'bg-yellow-100 text-yellow-800',
      installment: 'bg-purple-100 text-purple-800',
      mixed: 'bg-green-100 text-green-800',
    };
    return <Badge className={map[status]}>{status}</Badge>;
  };

  /* ================= UI ================= */

  return (
    <InventoryLayout>
      <div className="p-6 space-y-6 text-gray-900">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            View and manage your customers
          </p>
        </div>

        {/* KPI CARDS */}
        {kpi && (
          <>
          <span className='col-span-4 text-center text-sm text-muted-foreground'>Excludes Walk-ins</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat title="Total Customers" value={kpi.total_customers} icon={<Users />} />
            <Stat title="Credit Customers" value={kpi.credit_customers} icon={<CreditCard />} />
            <Stat title="Installments" value={kpi.installment_customers} icon={<ShoppingBag />} />
            <Stat title="Online Customers" value={kpi.online_customers} icon={<Globe />} />
          </div>
          </>
         
        )}

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as CustomerFilter)}>
            <TabsList className='grid grid-cols-2 md:grid-cols-5 h-30 md:h-10 w-full bg-gray-900'>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="credit">Credit</TabsTrigger>
              <TabsTrigger value="installment">Installment</TabsTrigger>
              <TabsTrigger value="online">Online</TabsTrigger>
              <TabsTrigger value="in-store">In-Store</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 border border-gray-900"
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={() => setOpen(true)}>
  + Add Customer
</Button>
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className='bg-gray-900'>
    <DialogHeader>
      <DialogTitle>Add Customer</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <Input
        placeholder="Full name *"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />
      <Input
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
      />
      <Input
        placeholder="Email (optional)"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
    </div>

    <DialogFooter>
      <Button
        disabled={!form.name || saving}
        onClick={async () => {
          setSaving(true);
          const token = localStorage.getItem('adminToken');

          const res = await fetch(`${apiUrl}/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
          });

          if (res.ok) {
            setOpen(false);
            setForm({ name: '', phone: '', email: '' });
            setPage(1); 
          }

          setSaving(false);
        }}
      >
        Save Customer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


        {/* TABLE */}
        <Card className='bg-gray-900'>
          <CardHeader>
            <CardTitle>
              Customers ({filteredCustomers.length})
            </CardTitle>
            <CardDescription>
              Detailed customer activity
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-10">Loading…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredCustomers.map(c => (
                    <TableRow key={c.customer_id}>
                      <TableCell className="font-medium">
                        {c.name}
                        {c.is_walk_in && (
                          <Badge variant="outline" className="ml-2">
                            Walk-in
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">{c.email || '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.phone || ''}
                        </div>
                      </TableCell>

                      <TableCell>{statusBadge(c.payment_status)}</TableCell>

                      <TableCell className="text-center">
                        {c.transaction_data.total_transactions}
                      </TableCell>

                      <TableCell className="font-semibold">
                        NGN {c.revenue_data.total_revenue.toLocaleString()}
                      </TableCell>

                      <TableCell>
                        {format(parseISO(c.customer_since), 'MMM dd, yyyy')}
                      </TableCell>

                       <TableCell className='flex gap-2'>
                        {!c.is_walk_in && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/customers/${c.customer_id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}

                        {!c.is_walk_in && (
  <Button
    size="sm"
    variant="destructive"
    onClick={async () => {
      if (!confirm(`Delete ${c.name}?`)) return;

      const token = localStorage.getItem('adminToken');
      await fetch(`${apiUrl}/customers/${c.customer_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setCustomers(prev =>
        prev.filter(x => x.customer_id !== c.customer_id)
      );
    }}
  >
    Delete
  </Button>
)}

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* PAGINATION */}
            {pages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pages}
                </span>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={page === pages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </InventoryLayout>
  );
}



function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className='bg-gray-900'>
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
        <div className="p-2  rounded bg-gray-900">{icon}</div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, RefreshCw, User, CreditCard, Calendar, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import Link from 'next/link';
import { Transaction, AdminDetail } from '@/app/utils/type';
import { Receipt } from '../components/Receipt';
import ReactDOMServer from 'react-dom/server';




export default function DailyHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [adminDetail, setAdminDetail] = useState<AdminDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');



  
  useEffect(() => {
    // Load admin detail from localStorage
    const storedAdminDetail = localStorage.getItem('adminDetail');
    if (storedAdminDetail) {
      try {
        setAdminDetail(JSON.parse(storedAdminDetail));
      } catch (error) {
        console.error('Error parsing adminDetail:', error);
      }
    }

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


  // Get transactions from today (last 24 hours)
  const getTodaysTransactions = () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return transactions.filter(transaction => {
      const txTime = new Date(transaction.timestamp);
      return txTime >= twentyFourHoursAgo && txTime <= now;
    });
  };

  const todaysTransactions = getTodaysTransactions();

  const filteredTransactions = todaysTransactions.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });




  const totalSales = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTax = todaysTransactions.reduce((sum, t) => sum + t.tax, 0);
  const totalItems = todaysTransactions.reduce(
    (sum, t) =>
      sum +
      t.items.reduce(
        (itemSum, item) => itemSum + item.quantity,
        0
      ),
    0
  );

  const totalDiscounts = todaysTransactions.reduce((sum, t) => 
    sum + (t.totalDiscount || 0), 0
  );
  const unsyncedCount = todaysTransactions.filter(t => !t.synced || t.status === 'failed').length;
  const failedCount = todaysTransactions.filter(t => t.status === 'failed').length;

  const handleSyncTransaction = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No auth token');

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
      
      const salePayload = {
        customer_id: !transaction.customer.is_walk_in ? transaction.customer.id : undefined,
        customer: transaction.customer.is_walk_in 
          ? {
              name: transaction.customer.name || 'Walk-in',
              email: transaction.customer.email || undefined,
              phone: transaction.customer.phone || undefined,
            }
          : undefined,
        items: transaction.items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        payments: [{
          method: transaction.paymentMethod,
          amount: transaction.amountPaid,
          reference: transaction.id,
        }],
        discount: transaction.totalDiscount || 0,
        taxes: transaction.tax,
        note: `Retry sync - ${transaction.id}`,
      };

      const response = await fetch(`${apiUrl}/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) throw new Error('Sync failed');
      
      const updatedTransactions = transactions.map(t => 
        t.id === transactionId ? { ...t, synced: true, status: 'completed' as const } : t
      );
      setTransactions(updatedTransactions);
      localStorage.setItem('pos_transactions', JSON.stringify(updatedTransactions));
      
      toast.success('Transaction synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync transaction');
    }
  };

  const handleCancelTransaction = (transactionId: string) => {
    if (confirm('Are you sure you want to cancel this transaction? This cannot be undone.')) {
      const updatedTransactions = transactions.filter(t => t.id !== transactionId);
      setTransactions(updatedTransactions);
      localStorage.setItem('pos_transactions', JSON.stringify(updatedTransactions));
      toast.success('Transaction cancelled');
    }
  };

  const handleSyncAll = async () => {
    const unsyncedTransactions = todaysTransactions.filter(t => !t.synced || t.status === 'failed');
    if (unsyncedTransactions.length === 0) {
      toast.info('No transactions to sync');
      return;
    }

    for (const tx of unsyncedTransactions) {
      await handleSyncTransaction(tx.id);
    }
  };

  const handleExport = () => {
    
    toast('Exporting transactions...');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💰';
      case 'card': return '💳';
      case 'transfer': return '📱';
      case 'split': return '🔀';
      case 'installment': return '📆';
      case 'credit': return '💳';
      default: return '💵';
    }
  };

  const purchaseTypeCounts = todaysTransactions.reduce(
  (acc, t) => {
    acc[t.purchaseType || 'in-store'] = (acc[t.purchaseType || 'in-store'] || 0) + 1;
    return acc;
  }, {} as Record<'in-store' | 'online', number>
);

const paymentMethodCounts = todaysTransactions.reduce(
  (acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<'cash' | 'card' | 'transfer' | 'split' | 'installment' | 'credit', number>

  
);

  const installmentTransactions = todaysTransactions.filter(t => t.paymentMethod === 'installment');
const totalInstallmentAmount = installmentTransactions.reduce((sum, t) => sum + t.total, 0);
const activeInstallments = installmentTransactions.filter(t => 
  t.installmentPlan && t.installmentPlan.remainingBalance > 0
).length;


const totalTx = todaysTransactions.length;
const purchaseTypeRatio = {
  inStore: ((purchaseTypeCounts['in-store'] || 0) / totalTx) * 100,
  online: ((purchaseTypeCounts['online'] || 0) / totalTx) * 100,
};

const paymentMethodRatio = {
  cash: ((paymentMethodCounts['cash'] || 0) / totalTx) * 100,
  card: ((paymentMethodCounts['card'] || 0) / totalTx) * 100,
  transfer: ((paymentMethodCounts['transfer'] || 0) / totalTx) * 100,
  split: ((paymentMethodCounts['split'] || 0) / totalTx) * 100,
};

const creditTransactions = todaysTransactions.filter(
  t => t.paymentMethod === 'credit'
);

const totalCreditValue = creditTransactions.reduce(
  (sum, t) => sum + t.total,
  0
);

const totalCreditBalance = creditTransactions.reduce(
  (sum, t) => sum + (t.credit?.creditBalance || 0),
  0
);


const totalInstallmentValue = installmentTransactions.reduce(
  (sum, t) => sum + t.total,
  0
);

const totalDownPayments = installmentTransactions.reduce(
  (sum, t) => sum + (t.installmentPlan?.downPayment || 0),
  0
);

const totalInstallmentRemaining = installmentTransactions.reduce(
  (sum, t) => sum + (t.installmentPlan?.remainingBalance || 0),
  0
);



const handlePrintReceipt = (transaction: Transaction) => {
  const receiptHtml = ReactDOMServer.renderToString(
    <Receipt
      customer={transaction.customer}
      cart={transaction.items}
      subtotal={transaction.subtotal || transaction.total - transaction.tax}
      tax={transaction.tax}
      total={transaction.total}
      paymentMethod={transaction.paymentMethod}
      amountPaid={transaction.amountPaid || transaction.total}
      change={(transaction.amountPaid || transaction.total) - transaction.total}
      purchaseType={transaction.purchaseType || 'in-store'}
      splitPayments={transaction.splitPayments?.map(sp => ({
        method: sp.method,
        amount: sp.amount.toString(),
      }))}
      installmentPlan={transaction.installmentPlan}
      transactionId={transaction.id}
      receiptDate={new Date(transaction.timestamp).toLocaleString()}
    />
  );

  const printWindow = window.open('', '_blank', 'width=500,height=800');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${transaction.id}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media print {
            @page {
              size: auto;
              margin: 0mm;
            }
            body {
              margin: 0;
              padding: 10px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
            background: white;
          }
          
          .print-controls {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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

  return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8 bg-white">
      
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <div className="relative">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-8 w-8 bg-green-400 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">BMT</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-lg">Big Men</div>
            <div className="text-xs text-gray-800 -mt-1">Transaction Apparel</div>
          </div>
        </Link>
      </div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Transaction History</h1>
            <p className="text-gray-600">View and manage today&apos;s sales transactions</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handleSyncAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All Pending
            </Button>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filter
            </Button>
          </div>
        </div>

        {/* Cashier/Admin Section */}
        {adminDetail && (
          <Card className="bg-blue-50 border border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Logged In As</div>
                  <div className="font-semibold text-gray-900">{adminDetail.full_name || adminDetail.username || 'Unknown'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

       
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Sales</div>
                  <div className="text-xl font-bold">NGN {totalSales.toFixed(2)}</div>
                </div>
                <div className="bg-green-500 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Tax Collected</div>
                  <div className="text-xl font-bold">NGN {totalTax.toFixed(2)}</div>
                </div>
                <div className="bg-blue-500 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Items Sold</div>
                  <div className="text-xl font-bold">{totalItems}</div>
                </div>
                <div className="bg-green-400 p-2 rounded-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Discount</div>
                  <div className="text-xl font-bold">NGN {totalDiscounts.toFixed(2)}</div>
                </div>
                <div className="bg-purple-500 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Pending/Failed</div>
                  <div className="text-xl font-bold">{unsyncedCount}</div>
                </div>
                <div className="bg-orange-500 p-2 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Failed Sales</div>
                  <div className="text-xl font-bold">{failedCount}</div>
                </div>
                <div className="bg-red-500 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>


            <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
  <CardContent>
    <div className="text-sm">Purchase Type Ratio</div>
    <div className="flex gap-2 mt-2">
      <Badge>In-Store: {purchaseTypeRatio.inStore.toFixed(1)}%</Badge>
      <Badge>Online: {purchaseTypeRatio.online.toFixed(1)}%</Badge>
    </div>
  </CardContent>
            </Card>

            <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl' >
            <CardContent>
                <div className="text-sm">Payment Method Ratio</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                <Badge>Cash: {paymentMethodRatio.cash.toFixed(1)}%</Badge>
                <Badge>Card: {paymentMethodRatio.card.toFixed(1)}%</Badge>
                <Badge>Transfer: {paymentMethodRatio.transfer.toFixed(1)}%</Badge>
                <Badge>Split: {paymentMethodRatio.split.toFixed(1)}%</Badge>
                </div>
            </CardContent>
            </Card>

             <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Installments</div>
          <div className="text-xl font-bold">{installmentTransactions.length}</div>
          <div className="text-xs text-gray-500">{activeInstallments} active</div>
        </div>
        <div className="bg-indigo-500 p-2 rounded-lg">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
            </Card>
  
  <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Installment Value</div>
          <div className="text-xl font-bold">NGN {totalInstallmentAmount.toFixed(2)}</div>
        </div>
        <div className="bg-purple-500 p-2 rounded-lg">
          <DollarSign className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>


<Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">Credit Sales (Waived)</div>
        <div className="text-xl font-bold">{creditTransactions.length}</div>
        <div className="text-xs text-gray-500 mt-1">
          Total: NGN {totalCreditValue.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">
          Outstanding: NGN {totalCreditBalance.toFixed(2)}
        </div>
      </div>
      <div className="bg-blue-600 p-2 rounded-lg">
        <CreditCard className="h-5 w-5 text-white" />
      </div>
    </div>
  </CardContent>
</Card>

<Card className="text-gray-900 bg-white border shadow-2xl">
  <CardContent className="p-4">
    <div className="text-sm text-gray-500">Installments</div>
    <div className="text-xl font-bold">
      NGN {totalInstallmentValue.toFixed(2)}
    </div>
    <div className="text-xs text-gray-500 mt-1">
      Down: NGN {totalDownPayments.toFixed(2)}
    </div>
    <div className="text-xs text-gray-500">
      Remaining: NGN {totalInstallmentRemaining.toFixed(2)}
    </div>
  </CardContent>
</Card>

        </div>


       
        <Card className='text-gray-900 bg-white rounded-sm border border-gray-100 shadow-2xl'>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter transactions from the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className='flex flex-col gap-2'>
                <Label htmlFor="search">Search by Customer or ID</Label>
                <Input
                  id="search"
                  placeholder="Search by customer or transaction ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                     className='border border-gray-900'
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

       
        <Card className='bg-gray-900 text-white'>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Today&apos;s sales transactions ({filteredTransactions.length} transactions)
                </CardDescription>
              </div>
              <Badge variant={unsyncedCount > 0 ? "destructive" : "default"}>
                {unsyncedCount} unsynced
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No transactions found</p>
                <p className="text-sm mt-1">Make some sales to see transactions here</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Installment Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {formatDate(transaction.timestamp)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {transaction.customer.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {transaction.items.length} items
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{getPaymentIcon(transaction.paymentMethod)}</span>
                            <span className="capitalize">{transaction.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          NGN {transaction.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {transaction.status === 'failed' ? (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
                          ) : transaction.status === 'completed' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                          ) : transaction.synced ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Synced</Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>
                          )}
                        </TableCell>
                                            <TableCell>
                        {transaction.paymentMethod === 'installment' && transaction.installmentPlan && (
                          <Badge className="bg-green-400 text-black">
                            Remaining: NGN {transaction.installmentPlan.remainingBalance.toFixed(2)}
                          </Badge>
                        )}

                        {transaction.paymentMethod === 'credit' && (
                          <Badge className="bg-blue-600 text-white">
                            Credit (Waived)
                          </Badge>
                        )}
                      </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(!transaction.synced || transaction.status === 'failed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncTransaction(transaction.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Sync
                            </Button>
                            )}
                              <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintReceipt(transaction)}
                            >
                              Print
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelTransaction(transaction.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
           
            {filteredTransactions.length > 0 && (
              <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Transactions</div>
                    <div className="text-lg font-bold">{filteredTransactions.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Amount</div>
                    <div className="text-lg font-bold">
                      NGN {filteredTransactions.reduce((sum, t) => sum + t.total, 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Average Ticket</div>
                    <div className="text-lg font-bold">
                      NGN {(filteredTransactions.reduce((sum, t) => sum + t.total, 0) / filteredTransactions.length).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Synced</div>
                    <div className="text-lg font-bold">
                      {filteredTransactions.filter(t => t.synced).length} / {filteredTransactions.length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-6 text-center text-sm text-gray-500">
    <span>
      © {new Date().getFullYear()} Qodebyte Digital Solutions. All rights reserved.
    </span>

    <span className="flex items-center gap-1">
      Powered by
      <span className="font-medium text-gray-700">
        Qodebyte Digital Solutions
      </span>
    </span>
       </div>
      </div>
  );
}
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Filter,
  Search,
  User,
  Calendar,
  MoreVertical,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSales } from "@/app/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CartItem, ReceiptTransaction, Sale } from "@/app/utils/type";
import ReactDOMServer from "react-dom/server";
import { Receipt } from "@/app/pos/components/Receipt";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type DateRange = {
  filter: string;
  startDate?: string;
  endDate?: string;
};



interface TransactionsTabProps {
  dateRange: DateRange;
  paymentMethodFilter: string;
  onPaymentMethodFilterChange: (method: string) => void;
  highlightedTransactionId?: string;
}



interface OrderItemAPI {
  id: string;
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

interface InstallmentPlanAPI {
  numberOfPayments: number;
  amountPerPayment: number;
  paymentFrequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  notes: string;
  downPayment: number;
  remainingBalance: number;
}

interface OrderAPI {
  id: string;
  Customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  OrderItems: OrderItemAPI[];
  subtotal: number | string;
  tax: number | string;
  total_amount: number | string;
  discount_total: number | string;
  CreditAccount?: boolean;
  InstallmentPlan?: InstallmentPlanAPI;
  OrderPayment?: { method: string }[];
  createdAt: string;
}



const ITEMS_PER_PAGE = 10;

function mapSaleToReceipt(sale: Sale): ReceiptTransaction {
  const items: CartItem[] = sale.OrderItems?.map(item => ({
    id: item.id,
    productId: Number(item.product_id),
    variantId: Number(item.variant_id),
    productName: item.Variant?.Product?.name ?? "Unknown", 
    variantName: item.Variant?.sku ?? "Unknown",
    sku: item.Variant?.sku ?? "",
    price: Number(item.unit_price),
    quantity: item.quantity,
  })) ?? [];

 
  let paymentMethod = "cash";
  
  if (sale.OrderPayments && sale.OrderPayments.length > 0) {
    paymentMethod = sale.OrderPayments[0].method || "cash";
  } else if (sale.CreditAccount) {
    paymentMethod = "credit";
  } else if (sale.InstallmentPlan) {
    paymentMethod = "installment";
  }

  return {
    id: sale.id,
    customer: sale.Customer ?? { id: "unknown", name: "Unknown" },
    items,
    subtotal: Number(sale.subtotal),
    tax: Number(sale.tax_total),
    total: Number(sale.total_amount),
    totalDiscount: Number(sale.discount_total),
    paymentMethod,
    amountPaid: Number(sale.total_amount),
    change: 0,
    timestamp: sale.createdAt,
    purchaseType: sale.purchase_type as 'in-store' | 'online',
  };
}

export function TransactionsTab({
  dateRange,
  paymentMethodFilter,
  onPaymentMethodFilterChange,
  highlightedTransactionId,
}: TransactionsTabProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSaleForDelete, setSelectedSaleForDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

 
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const res = await getSales(dateRange.filter, currentPage, ITEMS_PER_PAGE);
        setSales(res.sales);
        setTotalPages(res.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch sales");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [dateRange, currentPage]);

 
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const name = sale.Customer?.name ?? "";
      const matchesSearch =
        !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchQuery.toLowerCase());

      const method = sale.CreditAccount
        ? "credit"
        : sale.InstallmentPlan
        ? "installment"
        : sale.OrderPayments?.[0]?.method ?? "cash";

      const matchesMethod =
        paymentMethodFilter === "all" || paymentMethodFilter === method;

      return matchesSearch && matchesMethod;
    });
  }, [sales, searchQuery, paymentMethodFilter]);

 
const summary = useMemo(() => {
  const totalAmount = filteredSales.reduce(
    (s, t) => s + Number(t.total_amount),
    0
  );

  const totalDiscount = filteredSales.reduce(
    (s, t) => s + Number(t.discount_total),
    0
  );

  return {
    count: filteredSales.length,
    totalAmount,
    avgTicket: filteredSales.length
      ? totalAmount / filteredSales.length
      : 0,
    totalDiscount,
  };
}, [filteredSales]);




const handlePrintReceipt = (receipt: ReceiptTransaction) => {
  const receiptHtml = ReactDOMServer.renderToString(
     <Receipt
      customer={receipt.customer}
      cart={receipt.items}
      subtotal={receipt.subtotal}
      discount={receipt.totalDiscount}
      tax={receipt.tax}
      total={receipt.total}
      paymentMethod={receipt.paymentMethod}
      amountPaid={receipt.amountPaid}
      change={receipt.change}
      purchaseType={receipt.purchaseType}
      splitPayments={receipt.splitPayments?.map(p => ({
        method: p.method,
        amount: String(p.amount),
      }))}
      installmentPlan={receipt.installmentPlan}
      transactionId={receipt.id}
      receiptDate={new Date(receipt.timestamp).toLocaleString()}
    />
  );

  const printWindow = window.open('', '_blank', 'width=500,height=800');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${receipt.id}</title>
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

const ApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.bmtpossystem.com/api";

const handleDeleteClick = (sale: Sale) => {
  setSelectedSaleForDelete(sale);
  setDeleteDialogOpen(true);
};

const confirmDelete = async () => {
  if (!selectedSaleForDelete) return;

  try {
    setDeleting(true);
    const response = await fetch(`${ApiUrl}/sales/${selectedSaleForDelete.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete sale");
    }

    const data = await response.json();
    console.log("Delete response:", data);
    toast.success(`Sale ${selectedSaleForDelete.id} deleted successfully`);
    
   
    setSales(sales.filter(s => s.id !== selectedSaleForDelete.id));
    
  
    setDeleteDialogOpen(false);
    setSelectedSaleForDelete(null);
  } catch (err) {
    console.error("Delete error:", err);
    toast.error(err instanceof Error ? err.message : "Failed to delete sale");
  } finally {
    setDeleting(false);
  }
};


  const paymentBadge = (method: string) => (
    <Badge className="bg-gray-100 text-gray-800">{method}</Badge>
  );

  if (error) {
    return (
      <Card className="bg-gray-900 text-white">
        <CardContent className="py-16 text-center text-red-500">
          <AlertCircle className="mx-auto h-10 w-10 mb-2" />
          {error}
        </CardContent>
      </Card>
    );
  }

 
  return (
    <>
    <Card className="bg-gray-900 text-white">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          {loading ? "Loading…" : `${summary.count} transactions`}
        </CardDescription>
      </CardHeader>

      <CardContent>
      
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col gap-2"> 
            <Label>Search</Label>
            <Input
              placeholder="Customer or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Payment Method</Label>
            <Select
              value={paymentMethodFilter}
              onValueChange={onPaymentMethodFilterChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["all", "cash", "card", "transfer", "credit", "installment"].map(
                  (m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={() => setSearchQuery("")}>
            <Filter className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>

        
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className={
                    highlightedTransactionId === sale.id
                      ? "bg-yellow-50/10"
                      : ""
                  }
                >
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>
                    {new Date(sale.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{sale.Customer?.name ?? "Unknown"}</TableCell>
                 <TableCell>
                {paymentBadge(
                  sale.OrderPayments && sale.OrderPayments.length > 0
                    ? sale.OrderPayments[0].method
                    : sale.CreditAccount
                    ? "credit"
                    : sale.InstallmentPlan
                    ? "installment"
                    : "cash"
                )}
              </TableCell>
                <TableCell className="font-bold">
  NGN {Number(sale.total_amount).toFixed(2)}
</TableCell>

                  <TableCell>{sale.status}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuItem
onClick={() => {
  const receipt = mapSaleToReceipt(sale);
  handlePrintReceipt(receipt);
}}

                    >
                      <Printer className="h-4 w-4 mr-2" />
                      View Receipt
                    </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteClick(sale)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

      
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

     
        {summary.count > 0 && (
          <div className="grid md:grid-cols-4 gap-4 mt-6">
            {[
              ["Transactions", summary.count],
              ["Total Amount", `NGN ${summary.totalAmount.toFixed(2)}`],
              ["Avg Ticket", `NGN ${summary.avgTicket.toFixed(2)}`],
              ["Discount", `NGN ${summary.totalDiscount.toFixed(2)}`],
            ].map(([label, value]) => (
              <Card key={label} className="bg-white text-gray-900">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">{label}</div>
                  <div className="text-xl font-bold">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sale</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this sale? This will:
            <ul className="mt-2 ml-4 space-y-1 list-disc">
              <li>Remove the transaction record</li>
              <li>Refund all items back to inventory</li>
              <li>Reverse all payments and credits</li>
            </ul>
            <p className="mt-3 font-semibold text-white">
              Sale ID: {selectedSaleForDelete?.id}
            </p>
            <p className="mt-1 text-sm">
              Amount: NGN {Number(selectedSaleForDelete?.total_amount).toFixed(2)}
            </p>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel disabled={deleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? "Deleting..." : "Delete Sale"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

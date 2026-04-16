'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Store, 
  Globe,
  Calendar,
  Wallet
} from "lucide-react";

interface SalesKPIsProps {
  kpiData: {
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
  };
}

export function SalesKPIs({ kpiData }: SalesKPIsProps) {
  const { summary, purchase_types, payment_methods } = kpiData;
  
  const totalOrders = summary.total_transactions;
  const totalAmount = summary.total_sales_amount;
  const totalDiscount = summary.total_discount;
  const totalPaymentTransactions = payment_methods.total_transactions;
  const totalPurchaseTransactions = purchase_types.total_transactions;

  const kpis = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      color: "bg-blue-500",
      description: "Number of transactions"
    },
    {
      title: "Total Amount",
      value: `NGN ${Number(totalAmount).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-green-500",
      description: "Total revenue"
    },
    {
      title: "Total Discount",
      value: `NGN ${Number(totalDiscount).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-purple-500",
      description: "Total discounts given"
    },
    {
      title: "Total Tax",
      value: `NGN ${Number(summary.total_tax).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-orange-500",
      description: "Total tax collected"
    }
  ];

  return (
    <div className="space-y-6">
     
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="border-gray-200 bg-white border  shadow-2xl text-gray-900 transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>
                </div>
                <div className={`${kpi.color} p-3 rounded-lg`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
           <Card className="border-gray-200 bg-white border  shadow-2xl text-gray-900 transition-shadow sm:max-h-70  xl:max-h-50">
        <CardContent className="px-2">
          <div className="flex items-center gap-3 mb-4">
            <Store className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Purchase Type Distribution</h3>
          </div>
          
          <div  className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 lg:gap-2">
            {Object.entries(purchase_types.distribution).map(([type, data]) => {
              const percentage = totalPurchaseTransactions > 0 
                ? ((data.count / totalPurchaseTransactions) * 100).toFixed(1)
                : "0.0";
              
              return (
                <div key={type} className="flex items-center justify-between p-1 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 lg:gap-1">
                    <div className={`p-1 rounded-lg ${
                      type === 'in-store' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {type === 'in-store' ? (
                        <Store className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Globe className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium capitalize">
                        {type === 'in_store' ? 'In-Store' : 'Online'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.count} transactions
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold">{percentage}%</div>
                    <div className="text-sm text-gray-500">
                      of total sales
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
      
        <div className="grid grid-cols-1  w-full">
           <Card className="bg-gray-100 border  border-gray-300 shadow-2xl text-gray-900 w-full">
             <CardContent className="xl:p-3">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Payment Method Distribution</h3>
          </div>
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {Object.entries(payment_methods.distribution).map(([method, data]) => {
              const percentage = totalPaymentTransactions > 0 
                ? ((data.count / totalPaymentTransactions) * 100).toFixed(1)
                : "0.0";
              
              const getMethodIcon = (method: string) => {
                switch (method) {
                  case 'cash': return <DollarSign className="h-4 w-4" />;
                  case 'card': return <CreditCard className="h-4 w-4" />;
                  case 'transfer': return <Smartphone className="h-4 w-4" />;
                  case 'credit': return <CreditCard className="h-4 w-4" />;
                  case 'installment': return <Calendar className="h-4 w-4" />;
                  case 'split': return <Wallet className="h-4 w-4" />;
                  default: return <CreditCard className="h-4 w-4" />;
                }
              };
              
              const getMethodColor = (method: string) => {
                switch (method) {
                  case 'cash': return 'bg-green-100 text-green-800';
                  case 'card': return 'bg-blue-100 text-blue-800';
                  case 'transfer': return 'bg-purple-100 text-purple-800';
                  case 'credit': return 'bg-yellow-100 text-green-800';
                  case 'installment': return 'bg-indigo-100 text-indigo-800';
                  case 'split': return 'bg-pink-100 text-pink-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };
              
              return method === 'credit' ? (
  <div
    key={method}
    className="flex flex-col items-center p-2 bg-blue-50 rounded-lg border border-blue-200"
  >
    <div className="flex items-center gap-2 mb-2">
      {getMethodIcon(method)}
      <span className="font-medium capitalize">{method}</span>
    </div>

    <div className="text-2xl font-bold mb-2">{data.count}</div>

    <div className="text-xs text-gray-600 space-y-1 text-center">
      <div>Full: {payment_methods.credit_breakdown.full_credit}</div>
      <div>Partial: {payment_methods.credit_breakdown.partial_credit}</div>
    </div>

    <Badge
      variant="secondary"
      className="bg-blue-100 text-blue-800 mt-2"
    >
      {percentage}%
    </Badge>
  </div>
) : (
  <div
    key={method}
    className="flex flex-col items-center p-1 bg-gray-50 rounded-lg"
  >
    <div className="flex items-center gap-2 mb-1">
      {getMethodIcon(method)}
      <span className="xl:font-medium lg:text-[10px] xl:text-[14px] xl:capitalize">
        {method}
      </span>
    </div>

    <div className="text-2xl font-bold mb-1">{data.count}</div>

    <Badge variant="secondary" className={getMethodColor(method)}>
      {percentage}%
    </Badge>

    <div className="text-sm text-gray-500 mt-1">
      {method === 'installment'
        ? 'Installment Plans'
        : `${method.charAt(0).toUpperCase()}${method.slice(1)}`}
    </div>
  </div>
);

            })}
          </div>
        </CardContent>
            </Card>
        </div>
   
    </div>
  );
}
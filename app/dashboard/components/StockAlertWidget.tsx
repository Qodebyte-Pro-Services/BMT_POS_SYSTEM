"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type StockAlertItem = {
  id: string;
  name: string;
  current: number;
  min: number;
  status: 'critical' | 'warning' | 'normal';
  image: string | null;
};


export function StockAlertWidget() {
    const [items, setItems] = useState<StockAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.bmtpossystem.com/api";

  const imageUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "https://api.bmtpossystem.com";

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminToken");
    }
    return null;
  };

  useEffect(() => {
    const fetchStockAlerts = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          toast.error("Authentication required");
          return;
        }

        const response = await fetch(
          `${apiUrl}/analytics/stock-alerts?filter=all&sort=priority&limit=4`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch stock alerts");
        }

        const data = await response.json();
         setItems((data.alerts || []).filter(
  (item: StockAlertItem) => item.status !== 'normal'
));
      } catch (error) {
        console.error("Stock alert fetch error:", error);
        toast.error("Failed to load stock alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchStockAlerts();
  }, [apiUrl]);
  return (
    <Card className="bg-gray-white border border-gray-100  shadow-2xl ">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-black">Stock Alert</CardTitle>
            <CardDescription className="text-gray-950">
              Low stock items requiring attention
            </CardDescription>
          </div>
          <div className="text-green-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
          {loading && (
          <p className="text-sm text-gray-500">Loading stock alerts...</p>
        )}

       
        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-500">
            🎉 All stock levels look good!
          </p>
        )}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-start gap-3 p-3 rounded-lg border
                ${item.status === 'critical' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
                }
                ${item.status === 'warning' 
                ? 'hover:bg-yellow-100 hover:border-yellow-300' 
                : 'hover:bg-red-100 hover:border-red-300'
                }
                ${item.status === 'normal' 
                ? 'hover:bg-green-100 hover:border-green-300' 
                : 'hover:bg-gray-100 hover:border-gray-300'}
                hover:shadow-sm transition-shadow duration-200
              `}
            >
              
              <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                  {item.image ? (
                    <Image
                      src={`${imageUrl}${item.image}`}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                {item.status === 'critical' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                {item.status === 'warning' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                {item.status === 'normal' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>

             
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Current:</span>
                        <span className={`
                          font-medium
                          ${item.status === 'critical' ? 'text-red-600' : item.status === 'warning' ? 'text-yellow-600' : 'text-green-500'}
                        `}>
                          {item.current} units
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Min Required:</span>
                        <span className="font-medium text-gray-800">{item.min} units</span>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div className={`
                    self-start md:self-center px-3 py-1 rounded-full text-xs font-medium
                    ${item.status === 'critical' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-yellow-100 text-green-800 border border-green-200'
                    }
                  `}>
                    {item.status === 'critical' ? 'URGENT' : item.status === 'warning' ? 'WARNING' : 'OK'}
                  </div>
                </div>

                
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Stock Level</span>
                    <span>{Math.round((item.current / item.min) * 100)}% of minimum</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`
                        h-full rounded-full
                        ${item.status === 'critical' ? 'bg-red-500' : 'bg-green-400'}
                      `}
                      style={{ width: `${Math.min((item.current / item.min) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button asChild className="w-full mt-6 text-gray-900 hover:bg-gray-50">
          <Link href="/inventory" className="flex items-center justify-center gap-2">
            View All Inventory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
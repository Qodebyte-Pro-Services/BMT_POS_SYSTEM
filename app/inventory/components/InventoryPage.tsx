'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { InventoryOverview } from './InventoryOverview';
import { StockMovementTable } from './StockMovement';
import AddProductForm from './AddProductForm';
import { ProductTable } from './ProductTable';
import { ConfigureTab } from './ConfigurationTab';
import { usePageGuard } from '@/app/hooks/usePageGuard';

export  function InventoryPage() {
  usePageGuard();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6 bg-white lg:p-6 p-1">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-900 mt-1">
            Manage products, stock levels, and track inventory movement
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
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
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="flex items-center gap-2 bg-green-400 hover:bg-green-500 text-black">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-gray-100"
            onClick={() => setActiveTab("add")}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>


      <div className="xl:flex grid grid-cols-1 gap-4 justify-end mt-2">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <input
          type="text"
          placeholder="Search product by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border border-gray-300 text-gray-900 rounded-md px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

     
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 ">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-gray-900 rounded-lg w-full">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">
            Overview
          </TabsTrigger>
          <TabsTrigger value="movement" className="data-[state=active]:bg-white data-[state=active]:text-black">
            Stock Movement
          </TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-white data-[state=active]:text-black">
            Add Product
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:text-black">
            All Products
          </TabsTrigger>
          <TabsTrigger value="configure" className="data-[state=active]:bg-white data-[state=active]:text-black">
            Configure
          </TabsTrigger>
        </TabsList>

        
        <TabsContent value="overview" className="space-y-6">
          <InventoryOverview searchQuery={searchQuery} />
        </TabsContent>

       
        <TabsContent value="movement">
          <Card className="bg-gray-900 border-gray-200">
            <CardHeader>
              <CardTitle >Stock Movement</CardTitle>
              <CardDescription >
                Track all inventory transactions and movements
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3'>
              <StockMovementTable />
            </CardContent>
          </Card>
        </TabsContent>

      
        <TabsContent value="add">
          <AddProductForm />
        </TabsContent>

      
        <TabsContent value="products">
          <ProductTable searchQuery={searchQuery} />
        </TabsContent>

      
        <TabsContent value="configure">
          <ConfigureTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
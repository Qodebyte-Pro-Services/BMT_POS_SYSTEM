'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, MoreVertical, Loader, AlertCircle, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

type ProductStatus = "in_stock" | "low_stock" | "out_of_stock";

interface Stock {
  total_quantity: number;
  status: ProductStatus;
  base_price: number;
  inventory_value: number;
  threshold: number;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
  stock: Stock;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

export function ProductTable({ searchQuery }: { searchQuery: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [openRowId, setOpenRowId] = useState<number | null>(null);
   const [deletingId, setDeletingId] = useState<number | null>(null);
  const limit = 10;


  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
        let url = `${apiUrl}/products?page=${currentPage}&limit=${limit}`;
        
        if (searchQuery.trim()) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: ApiResponse = await response.json();
        setProducts(data.products);
        setTotalPages(data.pages);
        setTotalCount(data.total);

       
        const uniqueCategories = Array.from(
          new Set(data.products.map(p => p.category?.name).filter(Boolean))
        ) as string[];
        setCategories(["All", ...uniqueCategories]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, searchQuery]);

 
  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

 
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-NG');
  };

  const getStatusBadge = (status: ProductStatus) => {
    const variants = {
      'in_stock': { label: 'In Stock', color: 'bg-green-100 text-green-800' },
      'low_stock': { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' },
      'out_of_stock': { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    };
    const variant = variants[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={`${variant.color} hover:${variant.color}`}>
        {variant.label}
      </Badge>
    );
  };


 
  const filteredProducts = products.filter(product => {
    const matchesCategory =
      activeCategory === "All" || product.category?.name === activeCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleDelete = (productId: number, productName: string) => {
  toast.custom((toastId) => (
    <div className="bg-gray-900 text-white border rounded-lg shadow-xl p-4 w-[360px]">
      <p className="font-semibold text-gray-100">
        Delete &quot;{productName}&quot;?
      </p>

      <p className="text-sm text-gray-300 mt-1">
        This will permanently delete the product and all its variants.
        This action cannot be undone.
      </p>

      <div className="flex gap-2 justify-end mt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.dismiss(toastId)}
        >
          Cancel
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => confirmDelete(productId, toastId)}
          disabled={deletingId === productId}
        >
          {deletingId === productId ? (
            <>
              <Loader className="h-3 w-3 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash className="h-3 w-3 mr-2" />
              Delete
            </>
          )}
        </Button>
      </div>
    </div>
  ));
};

  const confirmDelete = async (productId: number, toastId: string | number) => {
    setDeletingId(productId);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
      const response = await fetch(
        `${apiUrl}/products/${productId}`,
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
        throw new Error(errorData.message || 'Failed to delete product');
      }

     
      setProducts(prev => prev.filter(p => p.id !== productId));
      setTotalCount(prev => prev - 1);

   
      toast.dismiss(toastId);
      toast.success('Product deleted successfully', {
        description: 'The product and all its variants have been removed.',
      });

      setOpenRowId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to delete product', {
        description: errorMessage,
      });
    } finally {
      setDeletingId(null);
    }
  };


  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-700">Error loading products</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 text-gray-900">
    
      <div className="flex flex-wrap gap-2 border-b pb-3 overflow-x-auto">
        {categories.map(category => (
          <Button
            key={category}
            size="sm"
            className={
              activeCategory === category
                ? "bg-gray-900 text-white hover:bg-gray-800 flex-shrink-0"
                : "text-gray-100 bg-gray-600 border border-gray-800 flex-shrink-0"
            }
            variant={activeCategory === category ? "default" : "secondary"}
            onClick={() => {
              setActiveCategory(category);
              setCurrentPage(1);
            }}
          >
            {category}
          </Button>
        ))}
      </div>

  
      <div className="rounded-md border shadow-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-500">
              <TableHead className="text-gray-900 font-semibold">Product</TableHead>
              <TableHead className="text-gray-900 font-semibold">Category</TableHead>
              <TableHead className="text-gray-900 font-semibold">Brand</TableHead>
              <TableHead className="text-gray-900 font-semibold">Stock</TableHead>
              <TableHead className="text-gray-900 font-semibold">Status</TableHead>
              <TableHead className="text-gray-900 font-semibold">Price</TableHead>
              <TableHead className="text-gray-900 font-semibold">Value</TableHead>
              <TableHead className="text-gray-900 font-semibold">Last Updated</TableHead>
              <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <DropdownMenu
                  key={product.id}
                  open={openRowId === product.id}
                  onOpenChange={(open) =>
                    setOpenRowId(open ? product.id : null)
                  }
                >
                  <DropdownMenuTrigger asChild>
                    <TableRow
                      className="cursor-pointer hover:bg-gray-300 bg-gray-500 transition-colors"
                      onClick={() => setOpenRowId(product.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setOpenRowId(product.id);
                      }}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {product.id}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className="bg-gray-900 text-white">
                          {product.category?.name || 'Uncategorized'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-gray-700">
                        {product.brand || '-'}
                      </TableCell>

                      <TableCell className="font-medium text-gray-900">
                        {product.stock?.total_quantity || 0}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(product.stock?.status || 'out_of_stock')}
                      </TableCell>

                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(product.stock?.base_price || 0)}
                      </TableCell>

                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(product.stock?.inventory_value || 0)}
                      </TableCell>

                      <TableCell className="text-gray-600 text-sm">
                        {formatDate(product.updated_at)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRowId(product.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <Link href={`/inventory/products/${product.id}`}>
                      <DropdownMenuItem className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />
                        View Product
                      </DropdownMenuItem>
                    </Link>
                  
                     <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product.id, product.name);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Product
                  </DropdownMenuItem>
                   
                  </DropdownMenuContent>
                </DropdownMenu>
              ))
            )}
          </TableBody>
        </Table>
      </div>

   
      <div className="flex items-center justify-between text-sm text-gray-600 pt-4">
        <div>
          Showing <span className="font-semibold">{filteredProducts.length}</span> of{' '}
          <span className="font-semibold">{totalCount}</span> products
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2 px-3 text-sm font-medium">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
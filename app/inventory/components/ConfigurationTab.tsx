'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, Folder, Loader, AlertCircle } from "lucide-react";
import { Discount, DiscountStatus, DiscountType } from '@/app/utils/type';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AttributeValue {
  id: string;
  value: string;
}

interface Attribute {
  id: string;
  name: string;
  values?: AttributeValue[];
  createdAt?: string;
  updatedAt?: string;
}

interface Product {
  id: string;
  name: string;
}

interface ProductDiscountLink {
  id: string;
  product_id: string;
  discount_id: string;
  product?: Product;
  discount?: Discount;
}

export function ConfigureTab() {
  const [activeSubTab, setActiveSubTab] = useState("attributes");
  
 
  const [attrName, setAttrName] = useState("");
  const [attrValues, setAttrValues] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [isEditAttrOpen, setIsEditAttrOpen] = useState(false);

 
  const [catName, setCatName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);

 
  const [discountName, setDiscountName] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountStartDate, setDiscountStartDate] = useState("");
  const [discountEndDate, setDiscountEndDate] = useState("");
  const [discountDesc, setDiscountDesc] = useState("");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isEditDiscountOpen, setIsEditDiscountOpen] = useState(false);

 
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedDiscount, setSelectedDiscount] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [discountLinks, setDiscountLinks] = useState<ProductDiscountLink[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';


  const getToken = () => localStorage.getItem('adminToken');

 
  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    setLoadingAttributes(true);
    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/configure/attributes?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch attributes');
      const data = await response.json();
      setAttributes(data.attributes || []);
    } catch (err) {
      toast.error('Failed to load attributes');
      console.error('Failed to load attributes:', err);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const handleCreateAttribute = async () => {
    if (!attrName.trim()) {
      toast.error('Attribute name is required');
      return;
    }
    if (attrValues.filter(v => v.trim()).length === 0) {
      toast.error('Add at least one value');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/configure/attributes/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attributes: [{
            name: attrName.trim(),
            values: attrValues.filter(v => v.trim())
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to create attribute');
      
      toast.success('Attribute created successfully');
      setAttrName("");
      setAttrValues([]);
      fetchAttributes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creating attribute');
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('Delete this attribute?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/attributes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete attribute');
      
      toast.success('Attribute deleted');
      fetchAttributes();
    } catch (err) {
      toast.error('Error deleting attribute');
      console.error('Error deleting attribute:', err);
    }
  };

  const handleAddAttributeValue = async (attrId: string, value: string) => {
    if (!value.trim()) {
      toast.error('Value cannot be empty');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/attributes/${attrId}/values`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: value.trim() })
      });

      if (!response.ok) throw new Error('Failed to add value');
      
      toast.success('Value added');
      fetchAttributes();
    } catch (err) {
      toast.error('Error adding value');
      console.error('Error adding value:', err);
    }
  };

  // ==================== CATEGORIES ====================
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/configure/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/configure/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: catName.trim() })
      });

      if (!response.ok) throw new Error('Failed to create category');
      
      toast.success('Category created successfully');
      setCatName("");
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creating category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory?.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/configure/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editingCategory.name.trim() })
      });

      if (!response.ok) throw new Error('Failed to update category');
      
      toast.success('Category updated');
      setIsEditCatOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error('Error updating category');
      console.error('Error updating category:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? All products in it will be deleted.')) return;

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete category');
      
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Error deleting category');
      console.error('Error deleting category:', err);
    }
  };

  // ==================== DISCOUNTS ====================
  useEffect(() => {
    fetchDiscounts();
    fetchProducts();
  }, []);

  const fetchDiscounts = async () => {
    setLoadingDiscounts(true);
    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/sales/discounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch discounts');
      const data = await response.json();
      setDiscounts(data.discounts || []);
      fetchDiscountLinks();
    } catch (err) {
      toast.error('Failed to load discounts');
      console.error('Failed to load discounts:', err);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/products?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      toast.error('Failed to load products');
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchDiscountLinks = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/sales/discounts/links/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch links');
      const data = await response.json();
      setDiscountLinks(data.links || []);
    } catch (err) {
      console.error('Failed to load discount links:', err);
      toast.error('Failed to load discount links');
    }
  };

  const handleCreateDiscount = async () => {
    if (!discountName.trim()) {
      toast.error('Discount name is required');
      return;
    }
    if (discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    if (!discountStartDate || !discountEndDate) {
      toast.error('Start and end dates are required');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/sales/discounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: discountName.trim(),
          discount_type: discountType,
          percentage: discountType === 'percentage' ? discountValue : null,
          fixed_amount: discountType === 'fixed_amount' ? discountValue : null,
          description: discountDesc,
          start_date: discountStartDate,
          end_date: discountEndDate
        })
      });

      if (!response.ok) throw new Error('Failed to create discount');
      
      toast.success('Discount created successfully');
      setDiscountName("");
      setDiscountValue(0);
      setDiscountDesc("");
      setDiscountStartDate("");
      setDiscountEndDate("");
      fetchDiscounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creating discount');
    }
  };

  const handleUpdateDiscount = async () => {
    if (!editingDiscount?.name) {
      toast.error('Discount name is required');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/sales/discounts/${editingDiscount.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingDiscount)
      });

      if (!response.ok) throw new Error('Failed to update discount');
      
      toast.success('Discount updated');
      setIsEditDiscountOpen(false);
      setEditingDiscount(null);
      fetchDiscounts();
    } catch (err) {
      toast.error('Error updating discount');
      console.error('Error updating discount:', err);
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    if (!confirm('Delete this discount?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/sales/discounts/${String(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete discount');
      
      toast.success('Discount deleted');
      fetchDiscounts();
    } catch (err) {
      toast.error('Error deleting discount');
      console.error('Error deleting discount:', err);
    }
  };

  const handleLinkDiscount = async () => {
    if (!selectedProduct || !selectedDiscount) {
      toast.error('Select both product and discount');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${apiUrl}/sales/discounts/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: selectedProduct,
          discount_id: selectedDiscount
        })
      });

      if (!response.ok) throw new Error('Failed to link discount');
      
      toast.success('Discount linked to product');
      setSelectedProduct("");
      setSelectedDiscount("");
      fetchDiscountLinks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error linking discount');
    }
  };

  const handleBulkAssignDiscount = async () => {
    if (!selectedDiscount || selectedProducts.length === 0) {
      toast.error('Select discount and at least one product');
      return;
    }

    try {
      const token = getToken();
      for (const productId of selectedProducts) {
        await fetch(`${apiUrl}/sales/discounts/link`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product_id: productId,
            discount_id: selectedDiscount
          })
        });
      }
      
      toast.success(`Discount assigned to ${selectedProducts.length} product(s)`);
      setSelectedDiscount("");
      setSelectedProducts([]);
      fetchDiscountLinks();
    } catch (err) {
      toast.error('Error assigning discounts');
      console.error('Error in bulk discount assignment:', err);
    }
  };

  const handleUnlinkDiscount = async (linkId: string) => {
    if (!confirm('Unlink this discount?')) return;

    try {
      const token = getToken();
      const link = discountLinks.find(l => l.id === linkId);
      if (!link) return;

      const response = await fetch(`${apiUrl}/sales/discounts/${link.discount_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to unlink');
      
      toast.success('Discount unlinked');
      fetchDiscountLinks();
    } catch (err) {
      toast.error('Error unlinking discount');
      console.error('Error unlinking discount:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3 h-auto bg-gray-900">
          <TabsTrigger value="attributes" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Tag className="h-4 w-4 mr-2" />
            Attributes
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Folder className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="discounts" className="data-[state=active]:bg-black data-[state=active]:text-white">
            <Tag className="h-4 w-4 mr-2" />
            Discounts
          </TabsTrigger>
        </TabsList>

      
        <TabsContent value="attributes">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-900">
              <CardHeader>
                <CardTitle>Create Attribute</CardTitle>
                <CardDescription>Add new product attributes and values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className='flex flex-col gap-2'>
                  <Label htmlFor="attrName">Attribute Name</Label>
                  <Input
                    id="attrName"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    placeholder="e.g., Color, Size, Material"
                  />
                </div>

                <div className='flex flex-col gap-2'> 
                  <Label>Values</Label>
                  <div className="space-y-2">
                    {attrValues.map((value, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={value}
                          onChange={(e) => {
                            const newValues = [...attrValues];
                            newValues[idx] = e.target.value;
                            setAttrValues(newValues);
                          }}
                          placeholder="Value"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAttrValues(attrValues.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setAttrValues([...attrValues, ""])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Value
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full bg-green-400 hover:bg-green-700"
                  onClick={handleCreateAttribute}
                >
                  Create Attribute
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-gray-900">
              <CardHeader>
                <CardTitle>All Attributes</CardTitle>
                <CardDescription>Manage product attributes and their values</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAttributes ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Attribute</TableHead>
                        <TableHead>Values</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attributes.map((attr) => (
                        <TableRow key={attr.id}>
                          <TableCell className="font-medium">{attr.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {attr.values?.map((val) => (
                                <Badge key={val.id} variant="secondary" className="text-xs">
                                  {val.value}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingAttribute(attr);
                                  setIsEditAttrOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => handleDeleteAttribute(attr.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

   
        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-900">
              <CardHeader>
                <CardTitle>Create Category</CardTitle>
                <CardDescription>Add new product categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="catName">Category Name</Label>
                  <Input
                    id="catName"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g., Jackets, Shoes"
                  />
                </div>

                <Button
                  className="w-full bg-green-400 hover:bg-green-700"
                  onClick={handleCreateCategory}
                >
                  Create Category
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-gray-900">
              <CardHeader>
                <CardTitle>All Categories</CardTitle>
                <CardDescription>Manage product categories</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCategories ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setIsEditCatOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

     
        <TabsContent value="discounts">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900">
                <CardHeader>
                  <CardTitle>Create Discount</CardTitle>
                  <CardDescription>Define percentage or fixed discounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className='flex flex-col gap-2'>
                    <Label>Discount Name</Label>
                    <Input
                      value={discountName}
                      onChange={(e) => setDiscountName(e.target.value)}
                      placeholder="e.g., Black Friday 20%"
                    />
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Label>Discount Type</Label>
                    <select
                      className="w-full rounded-md bg-black border border-gray-700 px-3 py-2"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount</option>
                    </select>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Label>{discountType === "percentage" ? "Percentage (%)" : "Fixed Amount"}</Label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder={discountType === "percentage" ? "20" : "500"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className='flex flex-col gap-2'>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={discountStartDate}
                        onChange={(e) => setDiscountStartDate(e.target.value)}
                      />
                    </div>
                    <div className='flex flex-col gap-2'>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={discountEndDate}
                        onChange={(e) => setDiscountEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Label>Description</Label>
                    <Input
                      value={discountDesc}
                      onChange={(e) => setDiscountDesc(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <Button
                    className="w-full bg-green-400 hover:bg-green-700"
                    onClick={handleCreateDiscount}
                  >
                    Create Discount
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-gray-900">
                <CardHeader>
                  <CardTitle>All Discounts</CardTitle>
                  <CardDescription>Manage existing discounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingDiscounts ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {discounts.map((discount) => (
                          <TableRow key={discount.id}>
                            <TableCell className="font-medium">{discount.name}</TableCell>
                            <TableCell>
                              <Badge>
                                {discount.type === 'percentage'
                                  ? `${discount.percentage}%`
                                  : `₦${discount.fixed_amount}`}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingDiscount(discount);
                                    setIsEditDiscountOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleDeleteDiscount(discount.id)} 
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900">
              <CardHeader>
                <CardTitle>Link Discount to Product</CardTitle>
                <CardDescription>Assign an existing discount to a product</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Product</Label>
                  <select
                    className="w-full rounded-md bg-black border border-gray-700 px-3 py-2"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className='flex flex-col gap-2'>
                  <Label>Discount</Label>
                  <select
                    className="w-full rounded-md bg-black border border-gray-700 px-3 py-2"
                    value={selectedDiscount}
                    onChange={(e) => setSelectedDiscount(e.target.value)}
                  >
                    <option value="">Select discount</option>
                    {discounts.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    className="w-full bg-green-400 hover:bg-green-700"
                    onClick={handleLinkDiscount}
                  >
                    Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900">
              <CardHeader>
                <CardTitle>Bulk Assign Discount</CardTitle>
                <CardDescription>Apply one discount to multiple products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className='flex flex-col gap-2'>
                  <Label>Discount</Label>
                  <select
                    className="w-full rounded-md bg-black border border-gray-700 px-3 py-2"
                    value={selectedDiscount}
                    onChange={(e) => setSelectedDiscount(e.target.value)}
                  >
                    <option value="">Select discount</option>
                    {discounts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Products</Label>
                  <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-md p-2 space-y-2">
                    {products.map(product => (
                      <label key={product.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            setSelectedProducts(prev =>
                              e.target.checked
                                ? [...prev, product.id]
                                : prev.filter(id => id !== product.id)
                            );
                          }}
                        />
                        {product.name}
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-green-400 hover:bg-green-700"
                  disabled={!selectedDiscount || selectedProducts.length === 0}
                  onClick={handleBulkAssignDiscount}
                >
                  Assign to {selectedProducts.length} product(s)
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900">
              <CardHeader>
                <CardTitle>Discounted Products</CardTitle>
                <CardDescription>Products with active discounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discountLinks.map(link => (
                      <TableRow key={link.id}>
                        <TableCell>{link.product?.name || 'N/A'}</TableCell>
                        <TableCell>{link.discount?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleUnlinkDiscount(link.id)}
                          >
                            Unlink
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

     
      {editingAttribute && (
        <Dialog open={isEditAttrOpen} onOpenChange={setIsEditAttrOpen}>
          <DialogContent className="bg-gray-900">
            <DialogHeader>
              <DialogTitle>Edit Attribute</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className='flex flex-col gap-2'>
                <Label>Name</Label>
                <Input
                  value={editingAttribute.name}
                  onChange={(e) => setEditingAttribute({...editingAttribute, name: e.target.value})}
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Add New Value</Label>
                <Input
                  id="newValue"
                  placeholder="Enter new value"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val) {
                        handleAddAttributeValue(editingAttribute.id, val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditAttrOpen(false)}>Cancel</Button>
              <Button className="bg-green-400" onClick={() => setIsEditAttrOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    
      {editingCategory && (
        <Dialog open={isEditCatOpen} onOpenChange={setIsEditCatOpen}>
          <DialogContent className="bg-gray-900">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className='flex flex-col gap-2'>
                <Label>Name</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditCatOpen(false)}>Cancel</Button>
              <Button className="bg-green-400" onClick={handleUpdateCategory}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    
      {editingDiscount && (
        <Dialog open={isEditDiscountOpen} onOpenChange={setIsEditDiscountOpen}>
          <DialogContent className="bg-gray-900">
            <DialogHeader>
              <DialogTitle>Edit Discount</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className='flex flex-col gap-2'>
                <Label>Name</Label>
                <Input
                  value={editingDiscount.name}
                  onChange={(e) => setEditingDiscount({...editingDiscount, name: e.target.value})}
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Status</Label>
                  <select
            className="w-full rounded-md bg-black border border-gray-700 px-3 py-2"
            value={editingDiscount.status || 'active'}
            onChange={(e) => setEditingDiscount({...editingDiscount, status: e.target.value as DiscountStatus})}
          >
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDiscountOpen(false)}>Cancel</Button>
              <Button className="bg-green-400" onClick={handleUpdateDiscount}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
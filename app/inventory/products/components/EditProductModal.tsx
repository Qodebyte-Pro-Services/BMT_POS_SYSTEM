'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader, Check, ChevronsUpDown } from "lucide-react";
import { Product } from '@/app/utils/type';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Category {
  id: string | number;
  name: string;
}

interface EditProductModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedProduct: Product) => void;
}

export function EditProductModal({
  product,
  open,
  onOpenChange,
  onSave,
}: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    brand: product.brand,
    category_id: '',
    base_sku: product.sku,
    taxable: product.taxable,
    unit: product.unit,
    hasVariation: product.hasVariation || false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
  

  const getToken = () => localStorage.getItem('adminToken');

 
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${apiUrl}/configure/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setFetchingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open, apiUrl]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'taxable' || name === 'hasVariation') {
      setFormData(prev => ({
        ...prev,
        [name]: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = getToken();

     
      if (!formData.name.trim()) {
        toast.error('Product name is required');
        setLoading(false);
        return;
      }

      if (!formData.category_id) {
        toast.error('Please select a category');
        setLoading(false);
        return;
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description,
        brand: formData.brand,
        category_id: formData.category_id,
        base_sku: formData.base_sku,
        taxable: formData.taxable,
        unit: formData.unit,
        hasVariation: formData.hasVariation,
      };

      const response = await fetch(`${apiUrl}/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      const updatedData = await response.json();

    

      const updatedProduct: Product = {
        ...product,
        name: updatedData.name,
        description: updatedData.description,
        brand: updatedData.brand,
        category: categories.find(c => c.id.toString() === updatedData.category_id)?.name || product.category,
        sku: updatedData.base_sku,
        taxable: updatedData.taxable,
        unit: updatedData.unit,
        hasVariation: updatedData.hasVariation,
      };

      if (onSave) {
        onSave(updatedProduct);
      }

      toast.success('Product updated successfully');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product';
      toast.error(message);
      console.error('Error updating product:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    formData.name !== product.name ||
    formData.description !== product.description ||
    formData.brand !== product.brand ||
    formData.base_sku !== product.sku ||
    formData.taxable !== product.taxable ||
    formData.unit !== product.unit ||
    formData.hasVariation !== product.hasVariation ||
    formData.category_id !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
        
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              disabled={loading}
              className="border-gray-300"
            />
          </div>

       
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="Enter brand name"
              disabled={loading}
              className="border-gray-300"
            />
          </div>

       
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            {fetchingCategories ? (
              <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
                <Loader className="h-4 w-4 animate-spin" />
                Loading categories...
              </div>
            ) : (
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between border-gray-300 font-normal"
                    disabled={loading || fetchingCategories}
                  >
                    {formData.category_id
                      ? categories.find((c) => c.id.toString() === formData.category_id)?.name
                      : "Select a category"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search category..." />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name}
                            onSelect={() => {
                              handleSelectChange('category_id', category.id.toString());
                              setCategoryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.category_id === category.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

         
          <div  className="space-y-2">
            <Label htmlFor="base_sku">Base SKU</Label>
            <Input
              id="base_sku"
              name="base_sku"
              value={formData.base_sku}
              onChange={handleInputChange}
              placeholder="Enter base SKU"
              disabled={loading}
              className="border-gray-300"
            />
          </div>

        
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              placeholder="e.g., Packs, Pieces, Kg"
              disabled={loading}
              className="border-gray-300"
            />
          </div>

      
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product description"
              disabled={loading}
              className="resize-none border-gray-300"
              rows={4}
            />
          </div>

      
          <div className="space-y-2">
            <Label htmlFor="taxable">Taxable</Label>
            <Select
              value={formData.taxable.toString()}
              onValueChange={(value) => handleSelectChange('taxable', value)}
              disabled={loading}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-300">
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

       
          <div className="space-y-2">
            <Label htmlFor="hasVariation">Has Variations</Label>
            <Select
              value={formData.hasVariation.toString()}
              onValueChange={(value) => handleSelectChange('hasVariation', value)}
              disabled={loading}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-300">
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gray-900 hover:bg-gray-700 text-white"
            disabled={loading || !hasChanges}
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Update Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Search, Check, ChevronsUpDown } from "lucide-react";
import { useVariants, VariantWithProduct } from './useVariants';
import { cn } from '@/lib/utils';


interface Category {
  id: string | number;
  name: string;
}

interface Product {
  id: string | number;
  name: string;
  brand: string;
  category?: string | { id: string | number; name: string };
}

interface ProductFiltersProps {
  products: Product[];
  selectedBrand: string;
  selectedCategory: string;
  selectedProduct: string;
  searchQuery: string;
  onBrandChange: (brand: string) => void;
  onCategoryChange: (category: string) => void;
  onProductChange: (product: string) => void;
  onSearchChange: (query: string) => void;
  onVariantsChange?: (variants: VariantWithProduct[]) => void;
}

export function ProductFilters({
  products,
  selectedBrand,
  selectedCategory,
  selectedProduct,
  searchQuery,
  onBrandChange,
  onCategoryChange,
  onProductChange,
  onSearchChange,
  onVariantsChange,
}: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);


  const { variants, loading: variantsLoading } = useVariants();

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingFilters(true);
      setFilterError(null);

      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';

      
        const categoriesResponse = await fetch(`${apiUrl}/configure/categories`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (categoriesResponse.ok) {
          const categoriesData: Category[] = await categoriesResponse.json();
          setCategories(categoriesData);
        } else {
          console.warn('Failed to fetch categories from backend');
        }

     
        const productsResponse = await fetch(`${apiUrl}/products?limit=1000`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const productsList = Array.isArray(productsData.products)
            ? productsData.products
            : Array.isArray(productsData)
            ? productsData
            : [];

          setFetchedProducts(productsList);

          const uniqueBrands = Array.from(
            new Set(productsList.map((p: Product) => p.brand).filter(Boolean))
          ) as string[];
          setBrands(uniqueBrands.sort());
        } else {
          throw new Error('Failed to fetch products');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setFilterError(message);
        console.error('Error fetching filter options:', err);

        setFetchedProducts(products);
        const localBrands = Array.from(
          new Set(products.map(p => p.brand).filter(Boolean))
        ) as string[];
        setBrands(localBrands.sort());
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilterOptions();
  }, [products]);

  // Filter variants based on selected filters
  useEffect(() => {
    if (!variants.length) return;

    let filteredVariants = [...variants];

    // Filter by product
    if (selectedProduct && selectedProduct !== 'all') {
      filteredVariants = filteredVariants.filter(
        v => String(v.product_id) === selectedProduct
      );
    }

    // Filter by brand
    if (selectedBrand && selectedBrand !== 'all') {
      filteredVariants = filteredVariants.filter(
        v => v.brand === selectedBrand
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filteredVariants = filteredVariants.filter(
        v => v.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredVariants = filteredVariants.filter(v => {
        const categoryName = typeof v.category === 'string' ? v.category : '';
        return (
          v.sku.toLowerCase().includes(query) ||
          v.barcode.toLowerCase().includes(query) ||
          v.product_name.toLowerCase().includes(query) ||
          v.brand.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query)
        );
      });
    }

    // Call parent callback with filtered variants
    onVariantsChange?.(filteredVariants);
  }, [variants, selectedProduct, selectedBrand, selectedCategory, searchQuery, onVariantsChange]);

  const productsToDisplay = fetchedProducts.length > 0 ? fetchedProducts : products;
  const displayBrands = brands.length > 0 ? brands : Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];
  const displayCategories = categories.length > 0
    ? categories
    : Array.from(new Set(products.map(p => typeof p.category === 'string' ? p.category : p.category?.name))).map((cat, idx) => ({
      id: idx,
      name: cat as string,
    }));

  const isLoading = loadingFilters || variantsLoading;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    
        <div className="md:col-span-2">
          <Label className="text-sm">Search Products</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, brand, category, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className='border border-gray-900 pl-9'
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm">Brand</Label>
          <Popover open={brandOpen} onOpenChange={setBrandOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={brandOpen}
                className='border border-gray-900 w-full justify-between'
              >
                {selectedBrand && selectedBrand !== 'all'
                  ? displayBrands.find(b => b === selectedBrand)
                  : 'All Brands'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search brands..." />
                <CommandEmpty>No brand found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onBrandChange('all');
                        setBrandOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedBrand === 'all' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      All Brands
                    </CommandItem>
                    {displayBrands.map(brand => (
                      <CommandItem
                        key={brand}
                        value={brand}
                        onSelect={() => {
                          onBrandChange(brand);
                          setBrandOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedBrand === brand ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {brand}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-sm">Category</Label>
          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={categoryOpen}
                className='border border-gray-900 w-full justify-between'
              >
                {selectedCategory && selectedCategory !== 'all'
                  ? displayCategories.find(c => c.name === selectedCategory)?.name
                  : 'All Categories'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onCategoryChange('all');
                        setCategoryOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedCategory === 'all' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      All Categories
                    </CommandItem>
                    {displayCategories.map(category => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => {
                          onCategoryChange(category.name);
                          setCategoryOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedCategory === category.name ? 'opacity-100' : 'opacity-0'
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
        </div>

        <div>
          <Label className="text-sm">Product</Label>
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={productOpen}
                className='border border-gray-900 w-full justify-between'
              >
                {selectedProduct && selectedProduct !== 'all'
                  ? productsToDisplay.find(p => String(p.id) === selectedProduct)?.name
                  : 'All Products'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search products..." />
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onProductChange('all');
                        setProductOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedProduct === 'all' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      All Products
                    </CommandItem>
                    {productsToDisplay.map(product => (
                      <CommandItem
                        key={product.id}
                        value={String(product.id)}
                        onSelect={() => {
                          onProductChange(String(product.id));
                          setProductOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedProduct === String(product.id) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {product.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {filterError && (
        <div className="text-sm text-amber-600 mt-2">
          ⚠️ Using local data - {filterError}
        </div>
      )}
    </div>
  );
}
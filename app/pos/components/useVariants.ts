'use client';

import { ImageUrl } from '@/app/utils/imageHelper';
import { useState, useEffect } from 'react';

export interface VariantWithProduct {
  variant_id: number;
  sku: string;
  barcode: string;
  product_id: number;
  product_name: string;
  brand: string;
  category: string;
  selling_price: number;
  cost_price: number;
  quantity: number;
  threshold: number;
   taxable: boolean;
   image_url?: string | ImageUrl[];
  attributes?: Record<string, string>;
}

interface VariantApiResponse {
  variant_id: number;
  sku: string;
  barcode: string;
  product?: {
    id: number;
    name: string;
    brand: string;
    taxable: boolean;
    category?: {
      name: string;
    };
  };
  pricing?: {
    selling_price: number;
    cost_price: number;
  };
  stock?: {
    quantity: number;
    threshold: number;
  };
  media?: {
    images: Array<{ url: string; filename: string }>;
  };
  attributes?: Record<string, string>;
}

interface UseVariantsResponse {
  variants: VariantWithProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVariants(): UseVariantsResponse {
  const [variants, setVariants] = useState<VariantWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVariants = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';
      const response = await fetch(`${apiUrl}/products/variants/list?limit=1000`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch variants');
      }

      const result = await response.json();
      const variantsList = result.variants || [];

    
      const transformedVariants: VariantWithProduct[] = variantsList.map((item: VariantApiResponse) => ({
        variant_id: item.variant_id,
        sku: item.sku,
        barcode: item.barcode,
        product_id: item.product?.id,
        product_name: item.product?.name,
        brand: item.product?.brand,
        category: item.product?.category?.name,
        selling_price: parseFloat(String(item.pricing?.selling_price || 0)),
        cost_price: parseFloat(String(item.pricing?.cost_price || 0)),
        quantity: item.stock?.quantity || 0,
        threshold: item.stock?.threshold || 0,
        taxable: item.product?.taxable || false,
        image_url: item.media?.images || [],
        attributes: item.attributes || {},
      }));

      setVariants(transformedVariants);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching variants:', err);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  return { variants, loading, error, refetch: fetchVariants };
}
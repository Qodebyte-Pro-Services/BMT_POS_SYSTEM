'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { InventoryLayout } from '../../components/InventoryLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductHeader } from '../components/ProductHeader';
import { ProductKPIs } from '../components/ProductKPIs';
import { ProductTabs } from '../components/ProductTabsProps ';
import { ProductDescriptionTab } from '../components/ProductDescriptionTab';
import { StockMovementTab } from '../components/StockMovementTab';
import { VariantsTab } from '../components/VariantsTab';
import { Product, ProductVariant, ProductVariantDetails } from '@/app/utils/type';
import { toast } from 'sonner';
import { ImageUrl, parseImageUrl } from '@/app/utils/imageHelper';


export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';

  const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://api.bmtpossystem.com';

  const getToken = () => localStorage.getItem('adminToken');

  const mapToAbsoluteUrls = (
  images: ImageUrl[],
  baseUrl: string
): string[] =>
  images
    .map(img =>
      img.url.startsWith('http')
        ? img.url
        : `${baseUrl}${img.url}`
    )
    .filter(Boolean);


//    const extractImageUrls = (imageData: (string | { url: string })[]): string[] => {
//   if (!Array.isArray(imageData)) return [];

//   return imageData
//     .map(img => {
//       const url =
//         typeof img === 'string'
//           ? img
//           : img && typeof img === 'object'
//           ? img.url
//           : null;

//       if (!url) return null;

     
//       if (url.startsWith('http')) return url;

     
//       return `${imageBaseUrl}${url}`;
//     })
//     .filter((url): url is string => Boolean(url));
// };


 useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const response = await fetch(`${apiUrl}/products/${productId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        const imageUrls: ImageUrl[] = parseImageUrl(data.image_url);
const productImages: string[] = mapToAbsoluteUrls(imageUrls, imageBaseUrl);


        
       
        const mappedProduct: Product = {
          id: data.id,
          name: data.name,
          sku: data.sku,
          brand: data.brand,
          category: data.category?.name || 'Uncategorized',
          description: data.description,
          taxable: data.taxable,
          unit: data.unit,
          hasVariation: data.hasVariation || false,
          images: productImages,
        variants: (data.variants || []).map((variant: ProductVariantDetails) => {
  const variantImageUrls = parseImageUrl(variant.image_url);
  const variantImages = mapToAbsoluteUrls(variantImageUrls, imageBaseUrl); 

  return {
    id: variant.id,
    name: variant.name || `Variant ${variant.sku}`,
    sku: variant.sku,
    attributes: variant.attributes || {},
    costPrice: parseFloat(variant.cost_price) || 0,
    sellingPrice: parseFloat(variant.selling_price) || 0,
    quantity: variant.quantity || 0,
    threshold: variant.threshold || 0,
    barcode: variant.barcode || '',
    images: variantImages, 
  };
}),
         
          inventoryValue: data.stock?.inventory_value || 0,
          inventoryCost: data.stock?.inventory_cost || 0,
          totalStock: data.stock?.total_quantity || 0,
          totalRevenue: (data.stock?.inventory_value || 0)
        };

        setProduct(mappedProduct);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, apiUrl]);

   const handleProductUpdate = (updatedProduct: Product) => {
    setProduct(updatedProduct);
    toast.success('Product updated successfully');
  };

  if (loading) {
    return (
      <InventoryLayout>
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </InventoryLayout>
    );
  }

  if (!product) {
    return (
      <InventoryLayout>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
            <p className="text-gray-600 mt-2">The product you&aposre looking for doesn&apost exist.</p>
          </div>
        </div>
      </InventoryLayout>
    );
  }


  return (
    <InventoryLayout>
      <div className="space-y-6 p-1 md:p-3 lg:p-1">
     
        <ProductHeader product={product} />
        
      
        <ProductKPIs product={product} />
        
     
        <ProductTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
       
        <div className="mt-6">
          {activeTab === 'description' && (
            <ProductDescriptionTab product={product} onProductUpdate={handleProductUpdate} />
          )}
          {activeTab === 'movement' && (
            <StockMovementTab productId={productId} />
          )}
          {activeTab === 'variants' && (
            <VariantsTab variants={product.variants} productId={productId} />
          )}
        </div>
      </div>
    </InventoryLayout>
  );
}
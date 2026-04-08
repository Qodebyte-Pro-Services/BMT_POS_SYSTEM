'use client';

import { useState } from 'react';
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
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, X, TrendingUp, TrendingDown } from "lucide-react";
import { Product, ProductVariant } from '@/app/utils/type';
import { toast } from 'sonner';

interface AdjustStockModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VariantAdjustment {
  variantId: string;
  variantName: string;
  sku: string;
  currentQuantity: number;
  quantityChange: number;
  currentCostPrice: number;
  newCostPrice: number;
  currentSellingPrice: number;
  newSellingPrice: number;
}

interface AdjustmentPayloadItem {
  variant_id: string;
  new_quantity: number;
  reason: 'increase' | 'decrease';
  notes: string;
  cost_price?: number;
  selling_price?: number;
}

export function AdjustStockModal({ product, open, onOpenChange }: AdjustStockModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [adjustments, setAdjustments] = useState<VariantAdjustment[]>([]);

  const getToken = () => localStorage.getItem('adminToken');
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bmtpossystem.com/api';

  
  const availableVariants = product.hasVariation 
    ? product.variants 
    : (product.variants && product.variants.length > 0
        ? [product.variants[0]]
        : [{
            id: 'product',
            name: product.name,
            sku: product.sku,
            attributes: {},
            costPrice: 0,
            sellingPrice: 0,
            quantity: product.totalStock,
            threshold: 10,
            barcode: '',
            images: [],
          }]);

 
  const availableForSelection = availableVariants.filter(
    variant => !adjustments.some(adj => adj.variantId === String(variant.id))
  );

  const handleAddVariant = () => {
    if (!selectedVariantId) return;

    const variant = availableVariants.find(v => String(v.id) === selectedVariantId);
    if (!variant) return;

    setAdjustments(prev => [
      ...prev,
      {
        variantId: selectedVariantId,
        variantName: variant.name || product.name,
        sku: variant.sku,
        currentQuantity: variant.quantity,
        quantityChange: 0,
        currentCostPrice: variant.costPrice,
        newCostPrice: variant.costPrice,
        currentSellingPrice: variant.sellingPrice,
        newSellingPrice: variant.sellingPrice,
      }
    ]);

    setSelectedVariantId('');
  };

  const handleRemoveVariant = (variantId: string) => {
    setAdjustments(prev => prev.filter(adj => adj.variantId !== variantId));
  };

  const handleIncrement = (idx: number) => {
    setAdjustments(prev => {
      const copy = [...prev];
      copy[idx].quantityChange += 1;
      return copy;
    });
  };

  const handleDecrement = (idx: number) => {
  setAdjustments(prev => {
    const copy = [...prev];
    const maxDecrease = copy[idx].currentQuantity;
    copy[idx].quantityChange = Math.max(copy[idx].quantityChange - 1, -maxDecrease);
    return copy;
  });
};


  const handleInputChange = (idx: number, value: number) => {
    setAdjustments(prev => {
      const copy = [...prev];
      copy[idx].quantityChange = value;
      return copy;
    });
  };

  const handlePriceChange = (idx: number, field: 'newCostPrice' | 'newSellingPrice', value: number) => {
    setAdjustments(prev => {
      const copy = [...prev];
      copy[idx][field] = value;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adjustments.length === 0) {
      toast.error('Please add at least one variant to adjust');
      return;
    }

    try {
      const token = getToken();
      if (!token) throw new Error('No auth token');

      const payload = adjustments
        .filter(adj => 
          adj.quantityChange !== 0 || 
          adj.newCostPrice !== adj.currentCostPrice || 
          adj.newSellingPrice !== adj.currentSellingPrice
        )
        .map(adj => {
          const payloadItem: AdjustmentPayloadItem = {
            variant_id: adj.variantId,
            new_quantity: adj.currentQuantity + adj.quantityChange,
            reason: adj.quantityChange < 0 ? 'decrease' : 'increase',
            notes: 'Adjusted from UI',
          };

          if (adj.newCostPrice !== adj.currentCostPrice) {
            payloadItem.cost_price = adj.newCostPrice;
          }
          if (adj.newSellingPrice !== adj.currentSellingPrice) {
            payloadItem.selling_price = adj.newSellingPrice;
          }

          return payloadItem;
        });

      if (payload.length === 0) {
        toast.error('No adjustments to submit');
        return;
      }

      const res = await fetch(`${apiUrl}/products/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adjustments: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to adjust stock');
      }

      toast.success('Stock adjusted successfully');
      setAdjustments([]);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to adjust stock');
    }
  };

  const getTotalAdjustment = () => {
    return adjustments.reduce((sum, adj) => sum + adj.quantityChange, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent  className="w-[95vw] max-w-[1600px] max-h-[90vh] bg-white text-gray-900 p-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription className="text-gray-900">
            Select variants and adjust their stock levels
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1 pr-2">
         
          <Card className="bg-gray-900 border border-gray-100 shadow-lg">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Product Name</Label>
                  <div className="font-medium">{product.name}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Total Stock</Label>
                  <div className="font-medium">{product.totalStock} units</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Total Variants</Label>
                  <div className="font-medium">{availableVariants.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

       
          <div className="space-y-4">
            <Label>Select Variant to Adjust</Label>
            <div className="flex gap-2">
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <SelectTrigger className="flex-1 border border-gray-900">
                  <SelectValue placeholder="Choose a variant..." />
                </SelectTrigger>
                <SelectContent>
                  {availableForSelection.map(variant => (
                    <SelectItem key={String(variant.id)} value={String(variant.id)}>
                      {variant.name || product.name} ({variant.sku}) - {variant.quantity} units
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                onClick={handleAddVariant}
                disabled={!selectedVariantId}
                className="bg-green-400 hover:bg-green-500 text-black"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

         
          {adjustments.length > 0 && (
            <div className="space-y-4">
              <Label>Adjustments Table</Label>
             <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
                <Table className="w-full">
                  <TableHeader className="bg-gray-900">
                    <TableRow>
                      <TableHead className="font-semibold">SKU</TableHead>
                      <TableHead className="font-semibold">Current Qty</TableHead>
                      <TableHead className="font-semibold">Adjustment</TableHead>
                      <TableHead className="font-semibold">New Total</TableHead>
                      <TableHead className="font-semibold">Cost Price</TableHead>
                      <TableHead className="font-semibold">Selling Price</TableHead>
                      <TableHead className="font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adj, idx) => {
                      const totalQuantity = adj.currentQuantity + adj.quantityChange;
                      
                      return (
                        <TableRow key={adj.variantId} className="hover:bg-gray-50">
                          <TableCell>{adj.sku}</TableCell>
                          <TableCell>{adj.currentQuantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                            <Button 
                                type="button" 
                                size="icon" 
                                variant="secondary"
                                onClick={() => handleDecrement(idx)}
                                disabled={adjustments[idx].quantityChange <= -adjustments[idx].currentQuantity}
                                className="h-8 w-8"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <Input
                                type="number"
                                value={adj.quantityChange}
                                onChange={(e) => handleInputChange(idx, parseInt(e.target.value) || 0)}
                                className="w-20 text-center border border-gray-900"
                              />
                              <Button 
                                type="button" 
                                size="icon" 
                                variant="secondary"
                                onClick={() => handleIncrement(idx)}
                                className="h-8 w-8"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${adj.quantityChange > 0 ? 'text-green-600' : adj.quantityChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {totalQuantity}
                              </span>
                              {adj.quantityChange !== 0 && (
                                <span className={`text-xs flex items-center ${adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {adj.quantityChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                  {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400">Current: {adj.currentCostPrice}</div>
                              <Input
                                type="number"
                                value={adj.newCostPrice}
                                onChange={(e) => handlePriceChange(idx, 'newCostPrice', parseFloat(e.target.value) || 0)}
                                className="w-24 text-sm border border-gray-900 h-8"
                                step="0.01"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400">Current: {adj.currentSellingPrice}</div>
                              <Input
                                type="number"
                                value={adj.newSellingPrice}
                                onChange={(e) => handlePriceChange(idx, 'newSellingPrice', parseFloat(e.target.value) || 0)}
                                className="w-24 text-sm border border-gray-900 h-8"
                                step="0.01"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveVariant(adj.variantId)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

            
              <Card className="bg-gray-900 text-white">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-300">Total Adjustment</div>
                      <div className="text-2xl font-bold">
                        {getTotalAdjustment() > 0 ? '+' : ''}{getTotalAdjustment()} units
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-300">Variants to Update</div>
                      <div className="text-2xl font-bold">{adjustments.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-400 hover:bg-green-500 text-black"
              disabled={adjustments.length === 0}
            >
              Update Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
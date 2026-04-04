// Utility for managing offline inventory snapshots
// Tracks available stock when device was last online

import { VariantWithProduct } from './useVariants';

export interface OfflineInventorySnapshot {
  variantId: number;
  quantity: number;
  sold: number; // Track how much has been sold offline
  lastUpdated: string;
}

const OFFLINE_INVENTORY_KEY = 'pos_offline_inventory_snapshot';

export class OfflineInventoryManager {
  /**
   * Save current inventory snapshot when going online or fetching variants
   * This creates a baseline for offline sales validation
   */
  static saveInventorySnapshot(variants: VariantWithProduct[]): void {
    try {
      // Get current snapshot to preserve sold counts if they exist
      const currentSnapshot = this.getSnapshot();
      
      const snapshot: OfflineInventorySnapshot[] = variants.map(v => {
        const existing = currentSnapshot.find(s => s.variantId === v.variant_id);
        return {
          variantId: v.variant_id,
          quantity: v.quantity, // This is the "available when last online" amount
          sold: existing ? existing.sold : 0, // Preserve sold counter if it exists
          lastUpdated: new Date().toISOString(),
        };
      });

      localStorage.setItem(OFFLINE_INVENTORY_KEY, JSON.stringify(snapshot));
      console.log(`📦 Offline inventory snapshot saved: ${snapshot.length} variants (preserved sold counts)`);
    } catch (error) {
      console.error('Error saving offline inventory snapshot:', error);
    }
  }

  /**
   * Get the current offline inventory snapshot
   * Returns empty array if no snapshot exists (force online sync)
   */
  static getSnapshot(): OfflineInventorySnapshot[] {
    try {
      const data = localStorage.getItem(OFFLINE_INVENTORY_KEY);
      return data ? JSON.parse(data) as OfflineInventorySnapshot[] : [];
    } catch (error) {
      console.error('Error reading offline inventory snapshot:', error);
      return [];
    }
  }

  /**
   * Check if a variant has enough stock for an offline sale
   * Returns available quantity remaining for this variant
   */
  static checkAvailableStock(variantId: number): { available: number; sold: number; original: number } {
    const snapshot = this.getSnapshot();
    const variant = snapshot.find(v => v.variantId === variantId);

    if (!variant) {
      // No snapshot - assume unlimited (shouldn't happen, but fail-safe)
      console.warn(`⚠️ No offline inventory data for variant ${variantId}. Allowing sale.`);
      return { available: Infinity, sold: 0, original: 0 };
    }

    const available = variant.quantity - variant.sold;
    return {
      available: Math.max(0, available),
      sold: variant.sold,
      original: variant.quantity,
    };
  }

  /**
   * Check if adding quantity to cart would exceed offline inventory
   */
  static canAddToCart(variantId: number, quantity: number): { canAdd: boolean; reason?: string } {
    const { available, original, sold } = this.checkAvailableStock(variantId);

    if (available < quantity) {
      return {
        canAdd: false,
        reason: `⚠️ Only ${available} unit(s) available offline (${sold}/${original} already sold). Cannot add ${quantity} more.`,
      };
    }

    return { canAdd: true };
  }

  /**
   * Record a sale to update the snapshot
   * Called when a transaction is saved offline
   */
  static recordOfflineSale(variantId: number, quantity: number): boolean {
    try {
      const snapshot = this.getSnapshot();
      const variant = snapshot.find(v => v.variantId === variantId);

      if (!variant) {
        console.warn(`⚠️ Cannot record sale: variant ${variantId} not in snapshot`);
        return false;
      }

      // Check before recording
      if (variant.sold + quantity > variant.quantity) {
        console.error(
          `❌ Cannot record sale: would exceed limits. ` +
          `Available: ${variant.quantity}, Already sold: ${variant.sold}, Requesting: ${quantity}`
        );
        return false;
      }

      variant.sold += quantity;
      localStorage.setItem(OFFLINE_INVENTORY_KEY, JSON.stringify(snapshot));
      console.log(`📦 Recorded offline sale: variant ${variantId}, qty ${quantity}, total sold: ${variant.sold}/${variant.quantity}`);
      return true;
    } catch (error) {
      console.error('Error recording offline sale:', error);
      return false;
    }
  }

  /**
   * Reverse a sale (e.g., when user removes item from cart)
   */
  static reverseOfflineSale(variantId: number, quantity: number): void {
    try {
      const snapshot = this.getSnapshot();
      const variant = snapshot.find(v => v.variantId === variantId);

      if (!variant) return;

      variant.sold = Math.max(0, variant.sold - quantity);
      localStorage.setItem(OFFLINE_INVENTORY_KEY, JSON.stringify(snapshot));
      console.log(`↩️ Reversed offline sale: variant ${variantId}, qty ${quantity}, total sold: ${variant.sold}/${variant.quantity}`);
    } catch (error) {
      console.error('Error reversing offline sale:', error);
    }
  }

  /**
   * Reset the offline inventory when returning online
   * Called after successful sync
   */
  static resetSnapshot(): void {
    try {
      localStorage.removeItem(OFFLINE_INVENTORY_KEY);
      console.log('🔄 Offline inventory snapshot cleared');
    } catch (error) {
      console.error('Error clearing offline inventory:', error);
    }
  }

  /**
   * Get summary of offline sales
   */
  static getOfflineSalesSummary() {
    const snapshot = this.getSnapshot();
    return {
      totalVariants: snapshot.length,
      variantsWithSales: snapshot.filter(v => v.sold > 0).length,
      totalItemsSold: snapshot.reduce((sum, v) => sum + v.sold, 0),
      details: snapshot.filter(v => v.sold > 0).map(v => ({
        variantId: v.variantId,
        sold: v.sold,
        original: v.quantity,
        remaining: v.quantity - v.sold,
      })),
    };
  }

  /**
   * Force update a specific variant's stock (for emergencies)
   */
  static updateVariantStock(variantId: number, newQuantity: number): void {
    try {
      const snapshot = this.getSnapshot();
      const variant = snapshot.find(v => v.variantId === variantId);

      if (variant) {
        variant.quantity = newQuantity;
        variant.lastUpdated = new Date().toISOString();
        localStorage.setItem(OFFLINE_INVENTORY_KEY, JSON.stringify(snapshot));
        console.log(`📝 Updated variant ${variantId} stock to ${newQuantity}`);
      }
    } catch (error) {
      console.error('Error updating variant stock:', error);
    }
  }

  /**
   * Check if device is currently offline
   */
  static isOffline(): boolean {
    return typeof window !== 'undefined' && !navigator.onLine;
  }
}

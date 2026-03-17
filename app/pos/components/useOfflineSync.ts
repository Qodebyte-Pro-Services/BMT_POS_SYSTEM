'use client';

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { OfflineTransactionManager } from './OfflineTransactionManager';
import { useSales, type CreateSalePayload, type SaleResponse } from './useSales';

export interface UseOfflineSyncReturn {
  syncPendingTransactions: () => Promise<void>;
}

export function useOfflineSync(onWalkInSynced?: () => Promise<void>): UseOfflineSyncReturn {
  const { createSale } = useSales();

  const syncPendingTransactions = useCallback(async (): Promise<void> => {
    const unsyncedTransactions = OfflineTransactionManager.getUnsyncedTransactions();

    if (unsyncedTransactions.length === 0) {
      return;
    }

    if (!navigator.onLine) {
      console.log('📴 No internet connection. Cannot sync offline transactions.');
      return;
    }

    console.log(`🔄 Syncing ${unsyncedTransactions.length} offline transactions...`);

    let successCount = 0;
    let failureCount = 0;
    let hasWalkInCustomer = false;

    for (const transaction of unsyncedTransactions) {
      try {
        const { transactionData } = transaction;
        
     
        const isWalkIn = 
          transactionData.customer.is_walk_in === true ||
          transactionData.customer.id === 'walk-in' || 
          transactionData.customer.id === 'walk-in-temp';

        if (isWalkIn) {
          hasWalkInCustomer = true;
        }
       
        const salePayload: CreateSalePayload = {
          customer_id:
            !isWalkIn
              ? transactionData.customer.id
              : undefined,
          customer:
            isWalkIn
              ? {
                  name: transactionData.customer.name || 'Walk-in',
                  email: transactionData.customer.email || undefined,
                  phone: transactionData.customer.phone || undefined,
                }
              : undefined,
          items: transactionData.items.map((item) => ({
            variant_id: item.variantId,
            quantity: item.quantity,
            unit_price: Math.round(item.price * 100) / 100, 
          })),
         
          payments: [
            {
              method: transactionData.paymentMethod as 'cash' | 'card' | 'transfer' | 'split' | 'installment' | 'credit',
              amount: Math.round(transactionData.amountPaid * 100) / 100,
              reference: transactionData.id,
            },
          ],
          ...(transactionData.credit && {
            credit: {
              issuedAt: transactionData.credit.issuedAt,
              creditType: transactionData.credit.creditType,
              creditBalance: Math.round(transactionData.credit.creditBalance * 100) / 100,
              amountPaidTowardCredit: Math.round(transactionData.credit.amountPaidTowardCredit * 100) / 100,
            },
          }),
          ...(transactionData.installmentPlan && {
            installment: {
              downPayment: Math.round(transactionData.installmentPlan.downPayment * 100) / 100,
              numberOfPayments: transactionData.installmentPlan.numberOfPayments,
              paymentFrequency: transactionData.installmentPlan.paymentFrequency,
              startDate: transactionData.installmentPlan.startDate,
              notes: transactionData.installmentPlan.notes || '',
            },
          }),
          discount: Math.round((transactionData.totalDiscount || 0) * 100) / 100,
          taxes: Math.round(transactionData.tax * 100) / 100,
          note: `Synced offline transaction ${transactionData.id}`,
        };

        const _result: SaleResponse = await createSale(salePayload);

     
        OfflineTransactionManager.markAsSynced(transaction.id);
        
     
        const allTransactions = JSON.parse(
          localStorage.getItem('pos_transactions') || '[]'
        ) as Array<Record<string, unknown>>;
        const txIndex = allTransactions.findIndex((t) => t.id === transactionData.id);
        if (txIndex >= 0) {
          allTransactions[txIndex] = {
            ...allTransactions[txIndex],
            synced: true,
            status: 'completed',
            backendId: _result.id,
          };
          localStorage.setItem('pos_transactions', JSON.stringify(allTransactions));
        }
        
        successCount++;

        console.log(`✅ Synced transaction ${transaction.id}`);
      }catch (error) {
  failureCount++;
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
 
 
  const isPermanentError = errorMessage.includes('validation') || 
                           errorMessage.includes('required') || 
                           errorMessage.includes('invalid') ||
                           errorMessage.includes('not found');
  
  if (isPermanentError) {
  
    OfflineTransactionManager.markAsFailed(transaction.id, errorMessage);
  } else {
  
    OfflineTransactionManager.markSyncAttempt(transaction.id, errorMessage);
  }
  
        console.warn(
          `⚠️ Failed to sync transaction ${transaction.id}: ${errorMessage}`,
          `${isPermanentError ? '(Permanent error - marked as failed)' : '(Temporary error - will retry later)'}`
        );
      }
    }

    if (successCount > 0) {
      toast.success(`✅ Synced ${successCount} transaction(s)`, {
        description: `${failureCount} transaction(s) will be retried later`,
      });
    }

    if (failureCount > 0) {
      toast.warning(`⚠️ ${failureCount} transaction(s) failed to sync`, {
        description: 'They will be retried when possible',
      });
    }

   
    if (hasWalkInCustomer && successCount > 0 && onWalkInSynced) {
      try {
        await onWalkInSynced();
      } catch (err) {
        console.warn('Failed to refetch walk-in customer after sync:', err);
      }
    }
  }, [createSale, onWalkInSynced]);

  useEffect(() => {
    const handleOnline = (): void => {
      console.log('📡 Connection restored. Syncing offline transactions...');
      toast.loading('🔄 Syncing offline transactions...', { id: 'sync-offline' });
      syncPendingTransactions().finally(() => {
        toast.dismiss('sync-offline');
      });
    };

    // Listen for online event
    window.addEventListener('online', handleOnline);

    // Sync on component mount if online
    if (navigator.onLine) {
      syncPendingTransactions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncPendingTransactions]);

  return { syncPendingTransactions };
}

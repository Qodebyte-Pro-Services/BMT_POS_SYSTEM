// Utility for managing offline transactions and syncing with backend

import { Transaction } from '@/app/utils/type';

export interface OfflineTransaction {
  id: string;
  transactionData: Transaction;
  createdAt: string;
  synced: boolean;
  syncAttempts: number;
  lastSyncError?: string;
  status?: 'pending' | 'failed' | 'synced'; 
}

const OFFLINE_TRANSACTIONS_KEY = 'pos_offline_transactions'; 

export class OfflineTransactionManager {
  static addTransaction(transactionData: Transaction): string {
    const transactions = this.getTransactions();
    
  
    const existingTransaction = transactions.find(t => t.transactionData.id === transactionData.id);
    if (existingTransaction) {
      console.warn(`⚠️ Transaction ${transactionData.id} is already being tracked for offline sync`);
      return existingTransaction.id;
    }
    
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const offlineTransaction: OfflineTransaction = {
      id,
      transactionData,
      createdAt: new Date().toISOString(),
      synced: false,
      syncAttempts: 0,
      status: 'pending',
    };

    transactions.push(offlineTransaction);
    localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));

    return id;
  }

 
  static cleanupOldRetries(): { removed: number; stats: string } {
    const transactions = this.getTransactions();
 
    const beforeCleanup = transactions.length;
    const nonFailedTransactions = transactions.filter(t => t.status !== 'failed');
  
    const seen = new Set<string>();
    const deduplicatedTransactions = nonFailedTransactions.filter(t => {
      const txId = t.transactionData.id;
      if (seen.has(txId)) {
        return false; 
      }
      seen.add(txId);
      return true;
    });
    localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(deduplicatedTransactions));
    const removed = beforeCleanup - deduplicatedTransactions.length;
    const stats = `Cleaned up ${removed} old failed/duplicate transactions. ${deduplicatedTransactions.length} valid transactions remaining.`;
    console.log(stats);
    return { removed, stats };
  }

  static cleanupLocalTransactions(): { removed: number; stats: string } {
    try {
      const transactions = JSON.parse(
        localStorage.getItem('pos_transactions') || '[]'
      ) as Array<Record<string, unknown>>;
      if (transactions.length === 0) {
        return { removed: 0, stats: 'No transactions to clean up.' };
      }
    
      const latestByTxId = new Map<string, Record<string, unknown> & { id: string }>();
      transactions.forEach((tx: Record<string, unknown> & { id?: string }) => {
        if (!tx.id) return;
        const txId = tx.id as string;
        const existing = latestByTxId.get(txId);
      
        if (!existing || (tx.synced && !existing.synced)) {
          latestByTxId.set(txId, tx as Record<string, unknown> & { id: string });
        }
      });
      const deduplicatedTransactions = Array.from(latestByTxId.values());
      const removed = transactions.length - deduplicatedTransactions.length;
      localStorage.setItem('pos_transactions', JSON.stringify(deduplicatedTransactions));
      const stats = `Cleaned up ${removed} duplicate transactions from local storage. ${deduplicatedTransactions.length} valid transactions remaining.`;
      console.log(stats);
      return { removed, stats };
    } catch (error) {
      console.error('Error cleaning up local transactions:', error);
      return { removed: 0, stats: 'Error during cleanup - no changes made.' };
    }
  }



  static getTransactions(): OfflineTransaction[] {
    try {
      const data = localStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
      return data ? JSON.parse(data) as OfflineTransaction[] : [];
    } catch (error) {
      console.error('Error reading offline transactions:', error);
      return [];
    }
  }

  static getUnsyncedTransactions(): OfflineTransaction[] {
    return this.getTransactions().filter(t => !t.synced);
  }

  static markAsSynced(transactionId: string): void {
    const transactions = this.getTransactions();
    const transaction = transactions.find(t => t.id === transactionId);

    if (transaction) {
      transaction.synced = true;
      transaction.status = 'synced'; 
      localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
  }

  static markSyncAttempt(transactionId: string, error?: string): void {
    const transactions = this.getTransactions();
    const transaction = transactions.find(t => t.id === transactionId);

    if (transaction) {
      transaction.syncAttempts++;
      if (error) {
        transaction.lastSyncError = error;
      }
      localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
  }

    static markAsFailed(transactionId: string, error?: string): void {
    const transactions = this.getTransactions();
    const transaction = transactions.find(t => t.id === transactionId);

    if (transaction) {
      transaction.status = 'failed';
      transaction.lastSyncError = error;
      localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
  }

  static removeTransactionsWithoutStatus(): void {
    const transactions = this.getTransactions().filter(
      t => typeof t.status !== 'undefined' || t.synced === true
    );
    localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
  }

  static removeTransaction(transactionId: string): void {
    const transactions = this.getTransactions().filter(t => t.id !== transactionId);
    localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
  }

    static clearFailedTransactions(): void {
    const transactions = this.getTransactions().filter(t => t.status !== 'failed');
    localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(transactions));
  }

  static clearAllTransactions(): void {
    localStorage.removeItem(OFFLINE_TRANSACTIONS_KEY);
  }

  static isOnline(): boolean {
    return typeof window !== 'undefined' && navigator.onLine;
  }

  static getSyncStats() {
    const all = this.getTransactions();
    const synced = all.filter(t => t.synced).length;
    const unsynced = all.filter(t => !t.synced).length;

    return {
      total: all.length,
      synced,
      unsynced,
      isOnline: this.isOnline(),
    };
  }
}

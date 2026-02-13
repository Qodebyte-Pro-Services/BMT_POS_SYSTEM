// Receipt.tsx - Updated with inline styles
import { CartItem, Customer } from "@/app/utils/type";

interface ReceiptProps {
  customer: Customer;
  cart: CartItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number | string;
  change: number;
  purchaseType: 'in-store' | 'online';
  splitPayments?: { method: string; amount: string }[];
  installmentPlan?: {
    numberOfPayments: number;
    amountPerPayment: number;
    paymentFrequency: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    notes: string;
    downPayment: number | string;
    remainingBalance: number;
  };
  transactionId?: string; 
  receiptDate?: string; 
}

export function Receipt({
  customer,
  cart,
  subtotal,
  discount,
  tax,
  total,
  paymentMethod,
  amountPaid,
  change,
  purchaseType,
  splitPayments = [],
  installmentPlan,
  transactionId = `TXN-${Date.now().toString().slice(-8)}`,
  receiptDate = new Date().toLocaleString(),
}: ReceiptProps) {
  // Inline styles for better rendering in print window
  const styles = {
    container: {
      fontFamily: "'Courier New', monospace",
      fontSize: '14px',
      lineHeight: '1.4',
      padding: '20px',
      backgroundColor: '#fff',
      color: '#000',
      maxWidth: '400px',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '15px',
      borderBottom: '2px dashed #000',
      paddingBottom: '10px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '10px',
    },
    logoBox: {
      height: '32px',
      width: '32px',
      backgroundColor: '#facc15',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '2px',
    },
    subtitle: {
      fontSize: '12px',
      color: '#666',
      marginBottom: '5px',
    },
    divider: {
      borderTop: '1px dashed #000',
      margin: '15px 0',
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '4px',
    },
    boldRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '4px',
      fontWeight: 'bold',
    },
    section: {
      marginBottom: '15px',
    },
    sectionTitle: {
      fontWeight: 'bold',
      marginBottom: '8px',
      fontSize: '14px',
    },
    badge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
    },
    installmentSection: {
      backgroundColor: '#fef3c7',
      padding: '10px',
      borderRadius: '8px',
      marginTop: '10px',
      marginBottom: '15px',
    },
    footer: {
      textAlign: 'center' as const,
      fontSize: '11px',
      color: '#666',
      marginTop: '20px',
      borderTop: '1px dashed #000',
      paddingTop: '10px',
    },
    terms: {
      fontSize: '10px',
      color: '#666',
      marginTop: '10px',
      fontStyle: 'italic' as const,
    },
  };

const formatCurrency = (amount: number | string | undefined) => {
  if (amount === undefined || amount === null) return 'NGN 0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `NGN ${num.toFixed(2)}`;
};

const toNumber = (val: number | string | undefined): number => {
  if (val === undefined || val === null) return 0;
  return typeof val === 'string' ? parseFloat(val) : val;
};

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoBox}>
            <span style={{ color: '#000', fontWeight: 'bold', fontSize: '12px' }}>BMT</span>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Big Men</div>
            <div style={{ fontSize: '11px', color: '#666' }}>Transaction Apparel</div>
          </div>
        </div>
        
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          Big Men Transaction Apparel
        </div>
        <div style={{ fontSize: '14px', marginBottom: '5px' }}>
          {installmentPlan ? 'INSTALLMENT SALES RECEIPT' : 'SALES RECEIPT'}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {receiptDate}
        </div>
      </div>

      {/* Transaction Info */}
      <div style={styles.section}>
        <div style={styles.row}>
          <span>Receipt ID:</span>
          <span style={{ fontWeight: 'bold' }}>{transactionId}</span>
        </div>
        <div style={styles.row}>
          <span>Purchase Type:</span>
          <span style={{
            ...styles.badge,
            backgroundColor: '#e5e7eb',
            color: '#374151',
          }}>
            {purchaseType === 'in-store' ? 'In-Store' : 'Online'}
          </span>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Customer Info */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>CUSTOMER INFORMATION</div>
        <div style={styles.row}>
          <span>Name:</span>
          <span style={{ fontWeight: 'bold' }}>{customer.name}</span>
        </div>
        {customer.email && (
          <div style={styles.row}>
            <span>Email:</span>
            <span>{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div style={styles.row}>
            <span>Phone:</span>
            <span>{customer.phone}</span>
          </div>
        )}
      </div>

      <div style={styles.divider} />

      {/* Items */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>ITEMS PURCHASED</div>
        {cart.map((item, index) => (
          <div key={index} style={styles.row}>
            <div>
              {item.productName} ({item.variantName})
              <div style={{ fontSize: '12px', color: '#666' }}>
                Qty: {item.quantity} × {formatCurrency(item.price)}
              </div>
            </div>
            <div style={{ fontWeight: 'bold' }}>
              {formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.divider} />

      {/* Payment Info */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>PAYMENT INFORMATION</div>
        <div style={styles.row}>
          <span>Method:</span>
          <span style={{
            ...styles.badge,
            backgroundColor: installmentPlan ? '#fbbf24' : '#dbeafe',
            color: installmentPlan ? '#000' : '#1e40af',
          }}>
            {paymentMethod === 'split' ? 'Split Payment' : 
             paymentMethod === 'installment' ? 'Installment' : 
             paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
          </span>
        </div>

        {paymentMethod === 'split' && splitPayments.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}>Split Payments:</div>
            {splitPayments.map((p, i) => (
              <div key={i} style={{ ...styles.row, fontSize: '12px' }}>
                <span>{p.method}:</span>
                <span>{formatCurrency(parseFloat(p.amount || '0'))}</span>
              </div>
            ))}
          </div>
        )}

        {installmentPlan && (
          <div style={styles.installmentSection}>
            <div style={{ ...styles.sectionTitle, marginBottom: '10px' }}>
              INSTALLMENT PLAN
            </div>
            <div style={styles.row}>
              <span>Down Payment:</span>
              <span style={{ fontWeight: 'bold' }}>
                {formatCurrency(installmentPlan.downPayment)}
              </span>
            </div>
            <div style={styles.row}>
              <span>Remaining Balance:</span>
              <span style={{ fontWeight: 'bold' }}>
                {formatCurrency(installmentPlan.remainingBalance)}
              </span>
            </div>
            <div style={styles.row}>
              <span>Payment Plan:</span>
              <span>
                {installmentPlan.numberOfPayments} × {formatCurrency(installmentPlan.amountPerPayment)}
              </span>
            </div>
            <div style={styles.row}>
              <span>Frequency:</span>
              <span style={{ textTransform: 'capitalize' }}>
                {installmentPlan.paymentFrequency}
              </span>
            </div>
            <div style={{ fontSize: '11px', marginTop: '8px', color: '#666' }}>
              Next payment: {new Date(installmentPlan.startDate).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      <div style={styles.divider} />

      {/* Totals */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>TOTALS</div>
        <div style={styles.row}>
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
         {discount && discount > 0 && (
            <div style={styles.row}>
              <span>Discount:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
        <div style={styles.row}>
          <span>Tax:</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div style={styles.boldRow}>
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Payment Summary */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>PAYMENT SUMMARY</div>
        <div style={styles.row}>
          <span>Amount Paid:</span>
          <span style={{ fontWeight: 'bold' }}>{formatCurrency(amountPaid)}</span>
        </div>
        
        {paymentMethod !== 'installment' && (
          <div style={styles.row}>
            <span>Change:</span>
            <span>{formatCurrency(change)}</span>
          </div>
        )}

        {installmentPlan && (
          <>
            <div style={{ ...styles.row, color: '#92400e' }}>
              <span>Down Payment (Paid):</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(amountPaid)}</span>
            </div>
            <div style={styles.row}>
              <span>Balance Due:</span>
              <span style={{ fontWeight: 'bold' }}>
                {formatCurrency(toNumber(total) - toNumber(amountPaid))}
              </span>
            </div>
          </>
        )}
      </div>

      <div style={styles.divider} />

      {/* Terms & Footer */}
      {installmentPlan && (
        <div style={styles.terms}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>INSTALLMENT TERMS:</div>
          <div>1. Payments due {installmentPlan.paymentFrequency}.</div>
          <div>2. Late payments incur additional fees.</div>
          <div>3. Ownership transfers upon full payment.</div>
          <div>4. Default may result in collection proceedings.</div>
        </div>
      )}

      <div style={styles.footer}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          Thank you for your business!
        </div>
        <div>For inquiries: contact@bigmenapparel.com</div>
        <div>Phone: 0800-BIG-MEN</div>
        <div style={{ marginTop: '10px', fontSize: '10px' }}>
          Receipt ID: {transactionId} • Printed: {new Date().toLocaleString()}
        </div>
        <div style={{ marginTop: '2px', fontSize: '10px' }}>
          <span>
           Qodebyte Digital Solutions. All rights reserved.
          </span>

          <span >
            Powered by
            <span>
              Qodebyte Digital Solutions 
            </span>
    </span>
        </div>
      </div>
    </div>
  );
}
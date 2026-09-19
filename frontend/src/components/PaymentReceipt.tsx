import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import type { SuccessResult } from './PaymentModal';

interface PaymentReceiptProps {
  result: SuccessResult;
  loanId: string;
  paymentType: 'repayment' | 'disbursement';
  borrowerName: string;
  onClose: () => void;
}

export default function PaymentReceipt({
  result, loanId, paymentType, borrowerName, onClose
}: PaymentReceiptProps) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(18,35,21,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm bg-cream-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Print-only styles — injected inline */}
        <style>{`
          @media print {
            body > *:not(#receipt-print-root) { display: none !important; }
            #receipt-print-root { position: fixed; top: 0; left: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}</style>

        <div id="receipt-print-root">
          {/* Header */}
          <div className="bg-forest-black px-6 pt-6 pb-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-7 h-7 bg-neon-gradient rounded-lg flex items-center justify-center">
                <span className="text-forest-black font-black text-sm">L</span>
              </div>
              <span className="text-cream font-black text-xl tracking-tight">LendX</span>
            </div>
            <p className="text-cream/40 text-xs">
              {paymentType === 'disbursement' ? 'Demo Disbursement Receipt' : 'Demo Payment Receipt'}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex justify-center -mt-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-neon-green flex items-center justify-center shadow-neon border-4 border-cream-white">
              <CheckCircle2 size={28} className="text-forest-black" />
            </div>
          </div>

          {/* Receipt body */}
          <div className="px-6 pb-6">
            <div className="text-center mb-5">
              <h3 className="font-black text-forest-black text-xl">
                {paymentType === 'disbursement' ? 'Disbursement Successful' : 'Payment Successful'}
              </h3>
              <p className="text-3xl font-black text-neon-green mt-1">
                ₹{result.amount.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Details grid */}
            <div className="border border-cream-soft rounded-xl overflow-hidden mb-5">
              {[
                { label: 'Transaction ID', value: result.transaction_id, mono: true, highlight: true },
                { label: 'Loan ID', value: loanId.slice(0, 18) + '…', mono: true },
                { label: 'Borrower', value: borrowerName },
                ...(paymentType === 'disbursement' ? [{ label: 'Lender', value: 'LendX Admin' }] : []),
                { label: 'Payment Type', value: paymentType === 'disbursement' ? 'Loan Disbursement' : 'EMI Repayment' },
                { label: 'Payment Method', value: result.payment_method },
                { label: 'Date & Time', value: new Date(result.timestamp).toLocaleString('en-IN') },
                { label: 'Status', value: 'Successful', badge: true },
              ].map((row, i) => (
                <div key={row.label}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? 'border-t border-cream-soft' : ''}`}>
                  <span className="text-muted-green">{row.label}</span>
                  {row.badge ? (
                    <span className="badge-green text-xs">✓ {row.value}</span>
                  ) : (
                    <span className={`font-semibold text-right max-w-[55%] truncate ${row.mono ? 'font-mono text-xs text-neon-green' : 'text-forest-black'}`}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Demo disclaimer */}
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-xs text-yellow-700 text-center mb-5 font-medium">
              ⚠️ Demo Transaction — No Real Money Transferred
            </div>

            {/* Actions */}
            <div className="no-print flex gap-3">
              <button
                onClick={handlePrint}
                className="btn-secondary flex-1 justify-center py-2.5 text-sm gap-2"
              >
                <Printer size={15} /> Print Receipt
              </button>
              <button
                onClick={onClose}
                className="btn-primary flex-1 justify-center py-2.5 text-sm gap-2"
              >
                <X size={15} /> Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

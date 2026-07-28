'use client';

import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { updateRequestStatus } from '@/lib/api';

interface InvoiceModalProps {
  requestId: string;
  clientName: string;
  messageText: string;
  onClose: () => void;
  onInvoiced: () => void;
}

export default function InvoiceModal({
  requestId,
  clientName,
  messageText,
  onClose,
  onInvoiced,
}: InvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fee, setFee] = useState(500);

  const handleInvoice = async () => {
    setLoading(true);
    setError('');
    try {
      await updateRequestStatus(requestId, 'invoiced');
      onInvoiced();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to mark as invoiced');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Generate Billable Overage
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Client
            </label>
            <input
              value={clientName}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Out-of-Scope Request
            </label>
            <textarea
              value={messageText}
              readOnly
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Estimated Fee (will be recorded when invoiced)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 text-sm">
                $
              </span>
              <input
                value={fee}
                onChange={(e) => setFee(Math.max(0, parseInt(e.target.value) || 0))}
                type="number"
                min={0}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleInvoice}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Mark as Invoiced ($${fee.toLocaleString()})`
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

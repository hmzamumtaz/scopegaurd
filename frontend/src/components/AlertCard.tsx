'use client';

import { useState } from 'react';
import { ShieldAlert, BotMessageSquare, Mail, X, DollarSign } from 'lucide-react';
import { updateRequestStatus } from '@/lib/api';
import type { RequestRecord } from '@/lib/types';
import InvoiceModal from './InvoiceModal';

interface AlertCardProps {
  request: RequestRecord;
  onRemoved: (id: string) => void;
}

function ChannelIcon({ channel }: { channel: string }) {
  const cls = 'w-4 h-4';
  const c = (channel || '').toLowerCase();
  if (c === 'slack') {
    return <BotMessageSquare className={`${cls} text-purple-500`} />;
  }
  return <Mail className={`${cls} text-blue-500`} />;
}

function formatTimestamp(ts: string | undefined | null): string {
  if (!ts) return 'Unknown date';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleString();
  } catch {
    return 'Unknown date';
  }
}

export default function AlertCard({ request, onRemoved }: AlertCardProps) {
  const [dismissing, setDismissing] = useState(false);
  const [dismissError, setDismissError] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [visible, setVisible] = useState(true);

  const handleDismiss = async () => {
    setDismissing(true);
    setDismissError('');
    try {
      await updateRequestStatus(request.id, 'dismissed');
      setVisible(false);
      setTimeout(() => onRemoved(request.id), 300);
    } catch (err: unknown) {
      setDismissError(err instanceof Error ? err.message : 'Failed to dismiss');
      setDismissing(false);
    }
  };

  if (!visible) return null;

  const companyName = request.clients?.company || 'Unknown Company';
  const clientName = request.clients?.name || '';

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm transition-all duration-300 ${
          dismissing ? 'opacity-0 scale-95' : 'opacity-100'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChannelIcon channel={request.source_channel} />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {companyName}
            </span>
            {clientName && (
              <span className="text-xs text-slate-400">({clientName})</span>
            )}
            <span className="text-xs text-slate-400">
              {formatTimestamp(request.created_at)}
            </span>
          </div>
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
        </div>

        {request.ai_verdict === 'unclear' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 mb-3">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              AI verdict unclear &mdash; manual review recommended
            </p>
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            &ldquo;{request.message_text}&rdquo;
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            AI Audit Explanation
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{request.explanation}</p>
        </div>

        {dismissError && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">{dismissError}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowInvoice(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Generate Billable Overage
          </button>
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            {dismissing ? 'Dismissing...' : 'Dismiss / Included'}
          </button>
        </div>
      </div>

      {showInvoice && (
        <InvoiceModal
          requestId={request.id}
          clientName={clientName || companyName}
          messageText={request.message_text}
          onClose={() => setShowInvoice(false)}
          onInvoiced={() => {
            setShowInvoice(false);
            setVisible(false);
            setTimeout(() => onRemoved(request.id), 300);
          }}
        />
      )}
    </>
  );
}

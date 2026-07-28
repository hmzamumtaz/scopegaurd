'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, DollarSign, Clock, ShieldCheck, WifiOff } from 'lucide-react';
import { getRequests } from '@/lib/api';
import { useAgency } from '@/lib/useAgency';
import type { RequestRecord } from '@/lib/types';
import MetricCard from '@/components/MetricCard';
import AlertCard from '@/components/AlertCard';

export default function DashboardPage() {
  const router = useRouter();
  const { agency, loading: agencyLoading } = useAgency();
  const [alerts, setAlerts] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const mountedRef = useRef(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    setFetchError('');
    try {
      const res = await getRequests({ ai_verdict: 'out_of_scope', status: 'pending', limit: 100 });
      if (mountedRef.current) setAlerts(res.requests);
    } catch (err) {
      if (mountedRef.current) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load alerts');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (agency) {
      fetchAlerts();
      pollRef.current = setInterval(fetchAlerts, 15000);
    }
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [agency, fetchAlerts]);

  const handleRemoved = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const revenueSaved = alerts.length * 500;

  if (agencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
        Loading...
      </div>
    );
  }

  useEffect(() => {
    if (!agencyLoading && !agency) {
      router.push('/login');
    }
  }, [agency, agencyLoading, router]);

  if (!agency) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {agency.name} &mdash; Real-time scope creep monitoring
          </p>
        </div>
        {fetchError && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
            <WifiOff className="w-3.5 h-3.5" />
            {fetchError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Scope Creep Caught Today"
          value={String(alerts.length)}
          icon={<ShieldAlert className="w-6 h-6" />}
        />
        <MetricCard
          title="Potential Revenue Saved"
          value={`$${revenueSaved.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <MetricCard
          title="Pending Reviews"
          value={String(alerts.length)}
          icon={<Clock className="w-6 h-6" />}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Active Scope Alerts
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
            Loading alerts...
          </div>
        ) : fetchError && alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <WifiOff className="w-12 h-12 mb-3 text-red-400" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              Unable to load alerts
            </p>
            <p className="text-sm">{fetchError}</p>
            <button
              onClick={fetchAlerts}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-12 h-12 mb-3 text-emerald-400" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              All clear! No scope creep detected.
            </p>
            <p className="text-sm">Incoming requests are being monitored automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((req) => (
              <AlertCard key={req.id} request={req} onRemoved={handleRemoved} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

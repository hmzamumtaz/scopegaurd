'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FileText, Plus, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/lib/useAgency';
import { getClients, createClient, getSows, getRequests } from '@/lib/api';
import type { Client, Sow, RequestRecord } from '@/lib/types';

interface EnrichedClient extends Client {
  sowCount: number;
  alertCount: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const { agency, loading: agencyLoading } = useAgency();
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchClients = useCallback(async () => {
    if (!agency) return;
    setLoading(true);
    setFetchError('');

    try {
      const res = await getClients(agency.id);
      const baseClients = res.clients || [];

      const enriched: EnrichedClient[] = await Promise.all(
        baseClients.map(async (c) => {
          try {
            const [sowsRes, requestsRes] = await Promise.all([
              getSows(c.id),
              getRequests({ client_id: c.id }),
            ]);
            return {
              ...c,
              sowCount: sowsRes.sows.length,
              alertCount: requestsRes.requests.filter(
                (r) => r.ai_verdict === 'out_of_scope' && r.status === 'pending'
              ).length,
            };
          } catch {
            return { ...c, sowCount: 0, alertCount: 0 };
          }
        })
      );

      setClients(enriched);
    } catch {
      setFetchError('Failed to load clients. Is the backend running?');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [agency]);

  useEffect(() => {
    if (agency) fetchClients();
  }, [agency, fetchClients]);

  useEffect(() => {
    if (!agencyLoading && !agency) {
      router.push('/login');
    }
  }, [agency, agencyLoading, router]);

  const handleCreate = async () => {
    if (!newName.trim() || !newCompany.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await createClient(agency!.id, newName.trim(), newCompany.trim());
      setNewName('');
      setNewCompany('');
      setShowNew(false);
      fetchClients();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  if (agencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!agency) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {agency.name} &mdash; Manage client contracts and monitoring
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {fetchError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          {fetchError}
          <button onClick={fetchClients} className="ml-auto text-xs underline">
            Retry
          </button>
        </div>
      )}

      {showNew && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">New Client</h3>
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contact name"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
            <input
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Company name"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || !newCompany.trim() || creating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
          {createError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createError}</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading clients...
        </div>
      ) : clients.length === 0 && !fetchError ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
          <Building2 className="w-12 h-12 mb-3" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
            No clients yet
          </p>
          <p className="text-sm mb-4">Add your first client to start monitoring scope.</p>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {client.company}
                    </h3>
                    <p className="text-xs text-slate-500">{client.name}</p>
                  </div>
                </div>
                {client.alertCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {client.alertCount} alerts
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {client.sowCount} SOWs
                </span>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <Link
                  href="/sows/upload"
                  className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  Upload SOW
                </Link>
                <Link
                  href="/dashboard"
                  className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  View Alerts
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

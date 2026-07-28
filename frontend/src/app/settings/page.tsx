'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAgency } from '@/lib/useAgency';
import { updateAgency, seedData } from '@/lib/api';
import { ShieldCheck, LogOut, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { agency, loading, logout, reload } = useAgency();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    if (agency) setName(agency.name);
  }, [agency]);

  useEffect(() => {
    if (!loading && !agency) {
      router.push('/login');
    }
  }, [agency, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!agency) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await updateAgency(agency.id, name.trim());
      setSaveMsg('Saved!');
      reload();
    } catch {
      setSaveMsg('Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await seedData(agency.id);
      setSeedMsg(res.message);
    } catch (err) {
      setSeedMsg(err instanceof Error ? err.message : 'Failed to load demo data');
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMsg(''), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your agency</p>
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Agency Profile</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Agency Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Owner Email
          </label>
          <input
            type="email"
            value={agency.owner_email}
            disabled
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saveMsg && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">{saveMsg}</span>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Demo Data
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Populate your agency with sample clients, contracts, and scope alerts to explore
              the product.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            {seeding ? 'Loading...' : 'Load Demo Data'}
          </button>
          {seedMsg && (
            <span
              className={`flex items-center gap-1 text-sm ${
                seedMsg.includes('Failed') || seedMsg.includes('fail')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {seedMsg.includes('Failed') || seedMsg.includes('fail') ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {seedMsg}
            </span>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sign out of your agency</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}

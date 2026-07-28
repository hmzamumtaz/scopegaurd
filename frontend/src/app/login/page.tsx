'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAgency } from '@/lib/useAgency';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAgency();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(email.trim());
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ScopeGuard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in with your agency email
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.com"
              required
              autoFocus
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            A new agency will be created if this email doesn&apos;t exist yet.
          </p>
        </form>
      </div>
    </div>
  );
}

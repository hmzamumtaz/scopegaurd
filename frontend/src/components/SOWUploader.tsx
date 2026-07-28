'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { parseSow, getClients, createClient } from '@/lib/api';
import type { Sow, Client } from '@/lib/types';

interface SOWUploaderProps {
  agencyId: string;
  onSuccess?: (sow: Sow) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function SOWUploader({ agencyId, onSuccess }: SOWUploaderProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Sow | null>(null);
  const [error, setError] = useState('');
  const [clientError, setClientError] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const loadClients = useCallback(async () => {
    setClientError('');
    try {
      const res = await getClients(agencyId);
      setClients(res.clients);
    } catch {
      setClientError('Failed to load clients. Is the backend running?');
      setClients([]);
    }
  }, [agencyId]);

  useEffect(() => {
    if (agencyId) loadClients();
  }, [agencyId, loadClients]);

  const handleCreateClient = async () => {
    if (!newName.trim() || !newCompany.trim()) return;
    try {
      setError('');
      const res = await createClient(agencyId, newName.trim(), newCompany.trim());
      setClients((prev) => [...prev, res.client]);
      setClientId(res.client.id);
      setShowNewClient(false);
      setNewName('');
      setNewCompany('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragging(true);
    else setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const validateAndSetFile = (f: File | undefined) => {
    setError('');
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setError('File exceeds 20MB limit');
      return;
    }
    if (f.size === 0) {
      setError('File is empty');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!clientId || !file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('agency_id', agencyId);
    formData.append('client_id', clientId);
    formData.append('sow_file', file);

    try {
      const res = await parseSow(formData);
      setResult(res.sow);
      onSuccess?.(res.sow);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setClientId('');
    setError('');
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-200">
              Contract Processed Successfully
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              AI summary generated
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            AI-Generated Contract Summary
          </h3>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {result.summary || 'No summary generated.'}
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Upload Another Contract
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Select Client
          </label>
          {!showNewClient && clients.length > 0 && (
            <button
              onClick={() => setShowNewClient(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + New Client
            </button>
          )}
        </div>

        {clientError ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {clientError}
            <button onClick={loadClients} className="ml-auto text-xs underline">
              Retry
            </button>
          </div>
        ) : showNewClient ? (
          <div className="flex gap-2">
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
              onClick={handleCreateClient}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
            >
              Add
            </button>
            <button
              onClick={() => setShowNewClient(false)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
        ) : (
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Choose a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company} ({c.name})
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-500" />
            <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-slate-400">PDF or TXT up to 20MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!clientId || !file || loading || clients.length === 0}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing Contract...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload &amp; Analyze Contract
          </>
        )}
      </button>
    </div>
  );
}

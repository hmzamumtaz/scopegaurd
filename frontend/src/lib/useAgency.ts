'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAgencies, createAgency } from './api';
import type { Agency } from './types';

const STORAGE_KEY = 'scopeguard_agency_id';

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (private browsing, full, etc.)
  }
}

export function useAgency() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setError('');
      const res = await getAgencies();
      if (!mountedRef.current) return;

      const storedId = safeStorageGet(STORAGE_KEY);

      if (res.agencies.length === 0) {
        setAgency(null);
      } else if (res.agencies.length === 1) {
        setAgency(res.agencies[0]);
        safeStorageSet(STORAGE_KEY, res.agencies[0].id);
      } else {
        const match = res.agencies.find((a) => a.id === storedId);
        setAgency(match || res.agencies[0]);
        if (!match) safeStorageSet(STORAGE_KEY, res.agencies[0].id);
      }
    } catch {
      if (mountedRef.current) setError('Failed to connect to server. Is the backend running?');
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const selectAgency = (a: Agency) => {
    setAgency(a);
    safeStorageSet(STORAGE_KEY, a.id);
  };

  const setupAgency = async (name: string, owner_email: string) => {
    setError('');
    try {
      const res = await createAgency(name, owner_email);
      if (!mountedRef.current) return res.agency;
      setAgency(res.agency);
      safeStorageSet(STORAGE_KEY, res.agency.id);
      return res.agency;
    } catch (err: unknown) {
      if (!mountedRef.current) throw err;
      const msg = err instanceof Error ? err.message : 'Failed to create agency';
      setError(msg);
      throw err;
    }
  };

  return { agency, loading, error, selectAgency, setupAgency, reload: load };
}

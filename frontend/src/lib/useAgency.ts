'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAgency, lookupAgency as lookupAgencyApi } from './api';
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
    // localStorage unavailable
  }
}

function safeStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable
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
      const storedId = safeStorageGet(STORAGE_KEY);

      if (!storedId) {
        if (mountedRef.current) setAgency(null);
      } else {
        const res = await getAgency(storedId);
        if (mountedRef.current) setAgency(res.agency);
      }
    } catch {
      safeStorageRemove(STORAGE_KEY);
      if (mountedRef.current) {
        setAgency(null);
        setError('Failed to load agency');
      }
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

  const login = async (owner_email: string): Promise<Agency> => {
    setError('');
    const res = await lookupAgencyApi(owner_email);
    if (!mountedRef.current) return res.agency;
    setAgency(res.agency);
    safeStorageSet(STORAGE_KEY, res.agency.id);
    return res.agency;
  };

  const logout = () => {
    safeStorageRemove(STORAGE_KEY);
    setAgency(null);
  };

  return { agency, loading, error, login, logout, reload: load };
}

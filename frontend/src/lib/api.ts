const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const DEFAULT_TIMEOUT = 30000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  const url = `${API_BASE}${path}`;
  let res: Response;

  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      signal: controller.signal,
      ...options,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'Request timed out');
    }
    throw new ApiError(0, 'Network error - unable to reach server');
  }

  clearTimeout(timeout);

  let body: unknown;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      throw new ApiError(res.status, 'Server returned invalid JSON');
    }
  } else {
    const text = await res.text();
    throw new ApiError(res.status, `Server returned non-JSON response: ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export async function getAgencies() {
  return request<{ agencies: import('./types').Agency[] }>('/agencies');
}

export async function getAgency(id: string) {
  return request<{ agency: import('./types').Agency }>(`/agencies/${id}`);
}

export async function createAgency(name: string, owner_email: string) {
  return request<{ agency: import('./types').Agency }>('/agencies', {
    method: 'POST',
    body: JSON.stringify({ name, owner_email }),
  });
}

export async function getClients(agencyId?: string) {
  const qs = agencyId ? `?agency_id=${agencyId}` : '';
  return request<{ clients: import('./types').Client[] }>(`/clients${qs}`);
}

export async function getClient(id: string) {
  return request<{ client: import('./types').Client }>(`/clients/${id}`);
}

export async function createClient(agency_id: string, name: string, company: string) {
  return request<{ client: import('./types').Client }>('/clients', {
    method: 'POST',
    body: JSON.stringify({ agency_id, name, company }),
  });
}

export async function parseSow(formData: FormData) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const url = `${API_BASE}/parse-sow`;
  let res: Response;

  try {
    res = await fetch(url, { method: 'POST', body: formData, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'Request timed out');
    }
    throw new ApiError(0, 'Network error - unable to reach server');
  }

  clearTimeout(timeout);

  let body: unknown;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      throw new ApiError(res.status, 'Server returned invalid JSON');
    }
  } else {
    const text = await res.text();
    throw new ApiError(res.status, `Server returned non-JSON response: ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : `Upload failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return body as import('./types').ParseSowResponse;
}

export async function getSows(clientId?: string) {
  const qs = clientId ? `?client_id=${clientId}` : '';
  return request<{ sows: import('./types').Sow[] }>(`/sows${qs}`);
}

export async function getRequests(params?: {
  client_id?: string;
  ai_verdict?: string;
  status?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.client_id) searchParams.set('client_id', params.client_id);
  if (params?.ai_verdict) searchParams.set('ai_verdict', params.ai_verdict);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  return request<{ requests: import('./types').RequestRecord[] }>(
    `/requests${qs ? `?${qs}` : ''}`
  );
}

export async function getRequest(id: string) {
  return request<{ request: import('./types').RequestRecord }>(`/requests/${id}`);
}

export async function updateRequestStatus(id: string, status: string) {
  return request<{ request: import('./types').RequestRecord }>(`/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

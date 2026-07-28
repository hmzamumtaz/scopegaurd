export interface Agency {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
}

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  company: string;
  created_at: string;
  sows?: { count: number };
  requests?: { count: number };
}

export interface Sow {
  id: string;
  client_id: string;
  raw_text: string;
  summary: string;
  created_at: string;
}

export type AiVerdict = 'in_scope' | 'out_of_scope' | 'unclear';
export type RequestStatus = 'pending' | 'invoiced' | 'dismissed';

export interface RequestRecord {
  id: string;
  client_id: string;
  source_channel: string;
  message_text: string;
  ai_verdict: AiVerdict;
  explanation: string;
  status: RequestStatus;
  created_at: string;
  clients?: {
    name: string;
    company: string;
  };
}

export interface ParseSowResponse {
  sow: Sow;
  summary: string;
}

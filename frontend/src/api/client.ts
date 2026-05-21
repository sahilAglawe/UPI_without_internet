import type {
  Account,
  FlushResponse,
  GossipResponse,
  MeshState,
  SendPacketRequest,
  SendPacketResponse,
  Transaction,
} from './types';

const API = '/api';

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  meshState: () => get<MeshState>('/mesh/state'),
  accounts: () => get<Account[]>('/accounts'),
  transactions: () => get<Transaction[]>('/transactions'),
  sendPacket: (body: SendPacketRequest) => post<SendPacketResponse>('/demo/send', body),
  gossip: () => post<GossipResponse>('/mesh/gossip'),
  flush: () => post<FlushResponse>('/mesh/flush'),
  reset: () => post<{ status: string }>('/mesh/reset'),
};

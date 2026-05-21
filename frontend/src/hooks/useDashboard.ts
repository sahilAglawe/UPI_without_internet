import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Account, MeshState, Transaction } from '../api/types';

export interface LogEntry {
  id: number;
  time: string;
  message: string;
  level: 'success' | 'warn' | 'info' | 'danger' | 'default';
}

function logLevel(msg: string): LogEntry['level'] {
  if (/SETTLED|encrypted|injected/i.test(msg)) return 'success';
  if (/DUPLICATE/i.test(msg)) return 'warn';
  if (/INVALID|error|cleared|reject|failed/i.test(msg)) return 'danger';
  if (/Gossip|upload|Packet/i.test(msg)) return 'info';
  return 'default';
}

let logId = 0;

export function useDashboard() {
  const [mesh, setMesh] = useState<MeshState | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<string[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const appendLog = useCallback((message: string) => {
    const entry: LogEntry = {
      id: ++logId,
      time: new Date().toLocaleTimeString(),
      message,
      level: logLevel(message),
    };
    setLogs((prev) => [entry, ...prev].slice(0, 80));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToasts((prev) => [...prev, msg]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 3200);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [m, accs, txs] = await Promise.all([
        api.meshState(),
        api.accounts(),
        api.transactions(),
      ]);
      setMesh(m);
      setAccounts(accs);
      setTransactions(txs);
    } catch (e) {
      appendLog('Failed to refresh: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [appendLog]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoading((s) => ({ ...s, [key]: true }));
    try {
      await fn();
    } finally {
      setLoading((s) => ({ ...s, [key]: false }));
    }
  };

  const totalPackets =
    mesh?.devices.reduce((sum, d) => sum + d.packetCount, 0) ?? 0;

  return {
    mesh,
    accounts,
    transactions,
    logs,
    toasts,
    loading,
    totalPackets,
    appendLog,
    showToast,
    refresh,
    withLoading,
  };
}

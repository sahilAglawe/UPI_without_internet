import { useState } from 'react';
import { api } from './api/client';
import { useDashboard } from './hooks/useDashboard';
import './App.css';

const DEVICE_ICONS: Record<string, string> = {
  'phone-alice': '👩',
  'phone-stranger1': '🧑',
  'phone-stranger2': '🧔',
  'phone-stranger3': '👤',
  'phone-bridge': '🌉',
};

const SENDERS = ['alice@demo', 'bob@demo', 'carol@demo'];
const RECEIVERS = ['bob@demo', 'carol@demo', 'alice@demo', 'dave@demo'];

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatInr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function App() {
  const {
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
  } = useDashboard();

  const [senderVpa, setSenderVpa] = useState('alice@demo');
  const [receiverVpa, setReceiverVpa] = useState('bob@demo');
  const [amount, setAmount] = useState(500);
  const [pin, setPin] = useState('1234');

  const handleInject = () =>
    withLoading('inject', async () => {
      const r = await api.sendPacket({
        senderVpa,
        receiverVpa,
        amount,
        pin,
        ttl: 5,
        startDevice: 'phone-alice',
      });
      appendLog(
        `Packet ${r.packetId.substring(0, 8)}… encrypted & injected at ${r.injectedAt} (TTL ${r.ttl})`
      );
      appendLog(`ciphertext: ${r.ciphertextPreview}`);
      showToast('Payment injected into mesh');
      await refresh();
    });

  const handleGossip = () =>
    withLoading('gossip', async () => {
      const r = await api.gossip();
      appendLog(`Gossip: ${r.transfers} transfer(s) — ${JSON.stringify(r.deviceCounts)}`);
      showToast(`${r.transfers} packet transfer(s)`);
      await refresh();
    });

  const handleFlush = () =>
    withLoading('flush', async () => {
      const r = await api.flush();
      appendLog(`${r.uploadsAttempted} bridge upload(s):`);
      r.results.forEach((res) => {
        appendLog(
          `  ${res.bridgeNode} · ${res.packetId} → ${res.outcome}` +
            (res.reason ? ` (${res.reason})` : '')
        );
      });
      const settled = r.results.filter((x) => x.outcome === 'SETTLED').length;
      showToast(
        settled ? `${settled} payment(s) settled` : 'Upload complete — check log'
      );
      await refresh();
    });

  const handleReset = () =>
    withLoading('reset', async () => {
      await api.reset();
      appendLog('Mesh + idempotency cache cleared');
      showToast('Mesh reset');
      await refresh();
    });

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo" aria-hidden="true">
            📡
          </div>
          <div>
            <h1>UPI Offline Mesh</h1>
            <p className="tagline">
              Basement में बिना internet — encrypted payment mesh से phone-to-phone hop
              करके bridge node पर backend तक पहुँचती है।
            </p>
          </div>
        </div>
        <div className="live-pill">Live Demo</div>
      </header>

      <div className="stats">
        <div className="stat-card">
          <div className="label">Mesh devices</div>
          <div className="value">{mesh?.devices.length ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Packets in mesh</div>
          <div className="value">{mesh ? totalPackets : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Idempotency cache</div>
          <div className="value">{mesh?.idempotencyCacheSize ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Transactions</div>
          <div className="value">{transactions.length}</div>
        </div>
      </div>

      <section className="flow-panel">
        <h2>
          🎬 <span>Demo Flow</span>
        </h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <h3>Compose payment</h3>
              <p>Sender phone — encrypt & inject at phone-alice</p>
            </div>
            <div className="step-actions">
              <div className="field-group">
                <div className="field">
                  <label>From</label>
                  <select value={senderVpa} onChange={(e) => setSenderVpa(e.target.value)}>
                    {SENDERS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="arrow">→</span>
                <div className="field">
                  <label>To</label>
                  <select
                    value={receiverVpa}
                    onChange={(e) => setReceiverVpa(e.target.value)}
                  >
                    {RECEIVERS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Amount</label>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>PIN</label>
                  <input
                    className="pin"
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="btn-primary"
                disabled={loading.inject}
                onClick={handleInject}
              >
                {loading.inject ? <span className="spinner" /> : 'Inject into Mesh'}
              </button>
            </div>
          </div>

          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <h3>Gossip round</h3>
              <p>Packets hop device-to-device; TTL decreases each hop</p>
            </div>
            <div className="step-actions">
              <button
                className="btn-secondary"
                disabled={loading.gossip}
                onClick={handleGossip}
              >
                {loading.gossip ? <span className="spinner" /> : 'Run Gossip Round'}
              </button>
            </div>
          </div>

          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <h3>Bridge uploads</h3>
              <p>phone-bridge gets 4G — parallel upload tests idempotency</p>
            </div>
            <div className="step-actions">
              <button
                className="btn-secondary"
                disabled={loading.flush}
                onClick={handleFlush}
              >
                {loading.flush ? (
                  <span className="spinner" />
                ) : (
                  'Bridges Upload to Backend'
                )}
              </button>
            </div>
          </div>

          <div className="step-reset">
            <button
              className="btn-danger"
              disabled={loading.reset}
              onClick={handleReset}
            >
              {loading.reset ? <span className="spinner" /> : 'Reset Mesh + Cache'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid-main">
        <div className="card">
          <div className="card-header">
            <h2>📱 Mesh Network</h2>
            <span className="hint">Virtual Bluetooth devices</span>
          </div>
          <div className="card-body">
            <div className="devices">
              {mesh?.devices.map((d) => (
                <div
                  key={d.deviceId}
                  className={`device ${d.hasInternet ? 'bridge' : ''} ${
                    d.packetCount > 0 ? 'has-packets' : ''
                  }`}
                >
                  <div className="device-icon">
                    {DEVICE_ICONS[d.deviceId] ?? '📱'}
                  </div>
                  <div className="device-info">
                    <strong>{d.deviceId}</strong>
                    <div className="device-meta">
                      <span
                        className={`badge ${
                          d.hasInternet ? 'badge-online' : 'badge-offline'
                        }`}
                      >
                        {d.hasInternet ? '4G Online' : 'Offline'}
                      </span>
                    </div>
                    {d.packetIds.length > 0 && (
                      <div className="device-packets">
                        {d.packetIds.map((id) => (
                          <span key={id} className="packet-id">
                            {id}…
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`packet-count ${d.packetCount === 0 ? 'zero' : ''}`}>
                    {d.packetCount}
                  </div>
                </div>
              ))}
            </div>
            {mesh && (
              <p className="cache-info">
                Idempotency cache: {mesh.idempotencyCacheSize} seen packet hash(es)
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>🏦 Accounts</h2>
            <span className="hint">Live balances</span>
          </div>
          <div className="card-body table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>VPA</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty">
                      No accounts
                    </td>
                  </tr>
                ) : (
                  accounts.map((a) => (
                    <tr key={a.vpa}>
                      <td>
                        <div className="vpa-cell">
                          <span className="avatar">{initials(a.holderName)}</span>
                          <span>{a.holderName}</span>
                        </div>
                      </td>
                      <td className="vpa-mono">{a.vpa}</td>
                      <td className="balance">{formatInr(Number(a.balance))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header">
          <h2>📜 Transaction Ledger</h2>
          <span className="hint">Last 20 settlements</span>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Bridge</th>
                <th>Hops</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    No transactions yet — run the demo flow above
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="vpa-mono">#{t.id}</td>
                    <td>{t.senderVpa}</td>
                    <td>{t.receiverVpa}</td>
                    <td className="balance">{formatInr(Number(t.amount))}</td>
                    <td>
                      <span className={`status-pill status-${t.status}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="vpa-mono">{t.bridgeNodeId}</td>
                    <td className="vpa-mono">{t.hopCount}</td>
                    <td className="vpa-mono">
                      {new Date(t.settledAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>🪵 Activity Log</h2>
          <span className="hint">Real-time events</span>
        </div>
        <div className="card-body">
          <div className="log">
            {logs.length === 0 ? (
              <div className="empty">Actions will appear here…</div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className={`log-line log-${l.level}`}>
                  <span className="log-time">[{l.time}]</span>
                  {l.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="toasts">
        {toasts.map((t, i) => (
          <div key={`${t}-${i}`} className="toast">
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

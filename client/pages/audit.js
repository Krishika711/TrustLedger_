import { useState, useEffect } from 'react';
import { apiGet } from '../lib/api';

export default function Audit() {
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const auditStatus = await apiGet('/audit/verify');
      const ledgerEvents = await apiGet('/ledger');

      setStatus(auditStatus);
      setEvents(Array.isArray(ledgerEvents) ? ledgerEvents : []);
    } catch (err) {
      console.error('Audit load error:', err);
      setError('Failed to load audit data.');
      setStatus(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Safely handle missing or invalid brokenAt
  const brokenAt = Array.isArray(status?.brokenAt)
    ? status.brokenAt
    : [];

  return (
    <div
      style={{
        padding: 40,
        fontFamily: 'sans-serif',
        maxWidth: 1000,
        margin: '0 auto',
      }}
    >
      <h1>Audit — Ledger Verification</h1>

      {error && (
        <div
          style={{
            padding: 15,
            marginBottom: 20,
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: 8,
          }}
        >
          ❌ {error}
        </div>
      )}

      {status && (
        <div
          style={{
            padding: 20,
            marginBottom: 20,
            borderRadius: 10,
            background: status.valid ? '#dcfce7' : '#fee2e2',
            color: status.valid ? '#166534' : '#991b1b',
          }}
        >
          <h2 style={{ margin: 0 }}>
            {status.valid
              ? '✅ Chain verified — no tampering detected'
              : brokenAt.length > 0
                ? `⚠️ Tampering detected at event IDs: ${brokenAt.join(', ')}`
                : '⚠️ Tampering detected — affected event IDs unavailable'}
          </h2>
        </div>
      )}

      <button
        onClick={load}
        disabled={loading}
        style={{
          padding: '10px 18px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 20,
        }}
      >
        {loading ? 'Checking...' : 'Re-check'}
      </button>

      <h3>Ledger events</h3>

      <pre
        style={{
          background: '#f4f4f4',
          padding: 20,
          borderRadius: 8,
          overflowX: 'auto',
        }}
      >
        {JSON.stringify(events, null, 2)}
      </pre>
    </div>
  );
}
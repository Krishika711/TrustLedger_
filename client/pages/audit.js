// Tejas: this is your page. Make the valid/tampered banner impossible to miss
// during the demo — that's the moment that sells the whole idea.
import { useState, useEffect } from 'react';
import { apiGet } from '../lib/api';

export default function Audit() {
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);

  const load = async () => {
    setStatus(await apiGet('/audit/verify'));
    setEvents(await apiGet('/ledger'));
  };
  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Audit — Ledger Verification</h1>
      {status && (
        <h2 style={{ color: status.valid ? 'green' : 'red' }}>
          {status.valid
            ? '✅ Chain verified — no tampering detected'
            : `⚠️ Tampering detected at event IDs: ${status.brokenAt.join(', ')}`}
        </h2>
      )}
      <button onClick={load}>Re-check</button>
      <h3>Ledger events</h3>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  );
}
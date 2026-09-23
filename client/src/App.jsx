import { useEffect, useMemo, useRef, useState } from 'react';
import { makeClient, MOCK_DEFAULT } from './api';
import { mock } from './mock';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const short = (h) => (h ? `${h.slice(0, 8)}…${h.slice(-6)}` : 'none');
const when = (t) => (t ? new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const verb = (a) => (a === 'GRANT' ? 'Granted' : a === 'REVOKE' ? 'Revoked' : a || 'Changed');

export default function App() {
  const [useMock, setUseMock] = useState(MOCK_DEFAULT);
  const client = useMemo(() => makeClient(useMock), [useMock]);
  const [blocks, setBlocks] = useState([]);
  const [phase, setPhase] = useState('loading'); // loading | scanning | verified | tampered | error
  const [scan, setScan] = useState(0);
  const [broken, setBroken] = useState(null); // { ord, reason }
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const run = useRef(0);

  async function check(list, id) {
    setPhase('scanning'); setScan(0); setBroken(null);
    try {
      const res = await client.verify();
      const link = list.findIndex((b, i) => i > 0 && b.prevHash !== list[i - 1].hash);
      const srv = !res.valid && res.brokenAt != null ? list.findIndex((b) => b.index === res.brokenAt) : -1;
      let ord = -1, reason = '';
      if (srv >= 0 && (link < 0 || srv < link)) { ord = srv; reason = 'content'; }
      else if (link >= 0) { ord = link; reason = 'link'; }
      const stop = ord >= 0 ? ord : list.length;
      if (!reduced()) for (let i = 0; i < stop; i++) { if (id !== run.current) return; setScan(i + 1); await sleep(90); }
      if (id !== run.current) return;
      setScan(list.length);
      setBroken(ord >= 0 ? { ord, reason } : null);
      setPhase(ord >= 0 || !res.valid ? 'tampered' : 'verified');
    } catch (e) { if (id === run.current) { setError(e.message); setPhase('error'); } }
  }

  async function load() {
    const id = ++run.current;
    setError(''); setPhase('loading'); setBroken(null); setOpen(null);
    try {
      const list = await client.ledger();
      if (id !== run.current) return;
      setBlocks(list);
      await check(list, id);
    } catch (e) { if (id === run.current) { setError(e.message); setPhase('error'); } }
  }

  useEffect(() => { load(); }, [client]);

  const n = blocks.length;
  const state = (i) =>
    phase === 'scanning' ? (i < scan ? 'ok' : 'pending')
    : phase === 'verified' ? 'ok'
    : phase === 'tampered' && broken ? (i < broken.ord ? 'ok' : i === broken.ord ? 'bad' : 'after')
    : 'pending';
  const match = (b) => (filter === 'all' || b.action === filter) && (!q || [b.actor, b.subject, b.resource].join(' ').toLowerCase().includes(q.toLowerCase()));

  const headline = {
    loading: 'Reading the ledger',
    scanning: `Checking block ${Math.min(scan + 1, n)} of ${n}`,
    verified: 'Chain intact',
    tampered: broken ? `Chain broken at block #${blocks[broken.ord].index}` : 'Chain failed verification',
    error: 'Ledger unreachable',
  }[phase];
  const detail = {
    loading: 'Fetching every access change on record.',
    scanning: 'Each block must point back to the hash of the one before it.',
    verified: `All ${n} blocks link back to the first one. Nothing was altered after it was written.`,
    tampered: !broken ? 'The server reported a mismatch but not where.'
      : broken.reason === 'link' ? 'This block points to a different parent than the one on record. Everything after it is untrusted.'
      : 'This record changed after it was written. Everything after it is untrusted.',
    error: `${error}. Check VITE_API_URL and your token, or switch to demo data.`,
  }[phase];

  function corrupt() {
    const ord = blocks.findIndex((b) => b.index === open);
    mock.tamper(ord >= 0 ? ord : Math.floor(n / 2));
    load();
  }

  return (
    <main className="shell">
      <aside className="panel">
        <p className="brand">TrustLedger</p>
        <h1 className={`verdict ${phase}`} aria-live="polite">{headline}</h1>
        <p className="lede">{detail}</p>
        <button className="btn primary" disabled={phase === 'loading' || phase === 'scanning'} onClick={load}>Verify again</button>

        <div className="group">
          <div className="seg" role="group" aria-label="Filter events">
            {[['all', 'All'], ['GRANT', 'Grants'], ['REVOKE', 'Revokes']].map(([v, l]) => (
              <button key={v} className={filter === v ? 'on' : ''} aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <input className="search" placeholder="Search person or permission" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
        </div>

        <div className="group foot">
          <div className="seg" role="group" aria-label="Data source">
            <button className={useMock ? 'on' : ''} onClick={() => setUseMock(true)}>Demo data</button>
            <button className={!useMock ? 'on' : ''} onClick={() => setUseMock(false)}>Live API</button>
          </div>
          {useMock && (
            <div className="demo">
              <button className="btn" onClick={corrupt} disabled={phase === 'scanning' || phase === 'loading'}>Corrupt {open != null ? `block #${open}` : 'a record'}</button>
              <button className="btn ghost" onClick={() => { mock.reset(); load(); }}>Restore ledger</button>
            </div>
          )}
        </div>
      </aside>

      <section className="chain" aria-label="Ledger events">
        {phase === 'error' && <p className="empty">No events to show yet.</p>}
        {phase !== 'error' && n === 0 && phase !== 'loading' && <p className="empty">The ledger is empty. Grant or revoke access to create the first block.</p>}
        <ol>
          {blocks.map((b, i) => {
            const s = state(i);
            const isOpen = open === b.index;
            return (
              <li key={b.index} className={`blk ${s} ${match(b) ? '' : 'dim'} ${isOpen ? 'open' : ''}`}>
                <span className="node" aria-hidden="true" />
                <button className="head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : b.index)}>
                  <span className="idx">#{b.index}</span>
                  <span className={`act ${b.action.toLowerCase()}`}>{verb(b.action)}</span>
                  <span className="what"><b>{b.subject}</b> {b.resource}</span>
                  <span className="by">{b.actor}</span>
                  <time>{when(b.timestamp)}</time>
                </button>
                {isOpen && (
                  <div className="detail">
                    <dl>
                      <dt>This block</dt><dd title={b.hash}>{short(b.hash)}</dd>
                      <dt>Points back to</dt><dd title={b.prevHash}>{short(b.prevHash)}</dd>
                    </dl>
                    <p className={`note ${s}`}>
                      {s === 'ok' && (i === 0 ? 'First block. Nothing to link back to.' : `Link to block #${blocks[i - 1].index} checks out.`)}
                      {s === 'bad' && (broken.reason === 'link' ? `Parent hash does not match block #${blocks[i - 1].index}.` : 'Stored hash no longer matches this record.')}
                      {s === 'after' && 'Follows a broken block, so it cannot be trusted.'}
                      {s === 'pending' && 'Not checked yet.'}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

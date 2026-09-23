import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import s from '../../styles/admin.module.css';

const short = (h) => (h && h.length > 18 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h || '');

function formatTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function CopyHash({ hash }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (for example non-secure context). Nothing to do.
    }
  }

  return (
    <button type="button" className={s.hashBtn} onClick={copy} title={hash} aria-label={`Copy full hash ${hash}`}>
      <code>{short(hash)}</code>
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

export default function Receipts({ receipts }) {
  return (
    <section className={s.receipts} aria-labelledby="receipts-title">
      <h2 id="receipts-title" className={s.sectionTitle}>
        Ledger receipts
      </h2>

      {receipts.length === 0 ? (
        <p className={s.emptyNote}>
          Nothing sealed in this session. Grant or revoke access and its ledger receipt appears here.
        </p>
      ) : (
        <ol className={s.chain}>
          {receipts.map((r) => (
            <li key={r.key} className={s.receipt}>
              <span className={s.seal} aria-hidden="true" />
              <p className={s.receiptTitle}>
                {r.kind === 'grant'
                  ? `Granted ${r.accessType} on ${r.resource.name} to ${r.user.name}`
                  : `Revoked all access to ${r.resource.name} for ${r.user.name}`}
              </p>
              {r.event ? (
                <dl className={s.receiptMeta}>
                  <div>
                    <dt>Ledger event</dt>
                    <dd>
                      {r.event.id}
                      {formatTime(r.event.created_at) && `, ${formatTime(r.event.created_at)}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Hash</dt>
                    <dd>
                      <CopyHash hash={r.event.event_hash} />
                    </dd>
                  </div>
                  <div>
                    <dt>Follows</dt>
                    <dd>
                      <code>{short(r.event.prev_hash)}</code>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className={s.hint}>The server did not return a ledger event for this change.</p>
              )}
            </li>
          ))}
        </ol>
      )}

      <p className={s.auditLink}>
        <Link href="/audit">Check the chain on the audit dashboard</Link>
      </p>
    </section>
  );
}

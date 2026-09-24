// Tejas: audit dashboard. Verifies the hash chain, lists every ledger event
// with actor/location/day/time, highlights whichever events broke the chain
// (loudest on the most recent one), and lets a signed-in admin mark a flagged
// event as reviewed without ever removing it from the list.
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiGet } from '../lib/api';
import { listResources, listUsers } from '../lib/adminApi';
import { FALLBACK_RESOURCES, FALLBACK_USERS, completeList } from '../lib/directory';
import { useSession } from '../lib/session';
import Header from '../components/admin/Header';
import s from '../styles/admin.module.css';

const READ_KEY = 'trustledger.audit.read.v1';

function formatDateDay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Which flagged event IDs an admin has already reviewed. Kept in
// localStorage (no backend "read" column yet) — reviewed events are never
// removed from the ledger view, they just lose the loud styling.
function useReviewed() {
  const [reviewed, setReviewed] = useState(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(READ_KEY);
      setReviewed(new Set(raw ? JSON.parse(raw) : []));
    } catch {
      setReviewed(new Set());
    }
  }, []);

  const persist = (next) => {
    setReviewed(next);
    try {
      window.localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    } catch {
      // Storage blocked: reviewed state still works until the tab reloads.
    }
  };

  const markReviewed = (id) => persist(new Set(reviewed).add(id));
  const markUnreviewed = (id) => {
    const next = new Set(reviewed);
    next.delete(id);
    persist(next);
  };

  return { reviewed, markReviewed, markUnreviewed };
}

export default function Audit() {
  const { session, clear } = useSession();
  const isAdmin = Boolean(session && session.user);
  const { reviewed, markReviewed, markUnreviewed } = useReviewed();

  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [apiUsers, setApiUsers] = useState(null);
  const [apiResources, setApiResources] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditStatus, ledgerEvents, u, r] = await Promise.all([
        apiGet('/audit/verify'),
        apiGet('/ledger'),
        listUsers(),
        listResources(),
      ]);
      setStatus(auditStatus);
      setEvents(Array.isArray(ledgerEvents) ? ledgerEvents : []);
      setApiUsers(u);
      setApiResources(r);
    } catch (err) {
      console.error('Audit load error:', err);
      setError('Failed to load audit data.');
      setStatus(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Resolve actor_id / resource_id to names, same "fill in the gaps" pattern
  // the admin dashboard uses, so an id with no directory entry still shows
  // something readable instead of a blank cell.
  const users = useMemo(
    () => completeList(apiUsers || FALLBACK_USERS, events.map((e) => e.actor_id), 'User'),
    [apiUsers, events]
  );
  const resources = useMemo(
    () => completeList(apiResources || FALLBACK_RESOURCES, events.map((e) => e.resource_id), 'Resource'),
    [apiResources, events]
  );
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const resourceById = useMemo(() => new Map(resources.map((r) => [r.id, r])), [resources]);

  const brokenAt = Array.isArray(status?.brokenAt) ? status.brokenAt : [];
  const brokenSet = useMemo(() => new Set(brokenAt), [brokenAt]);
  const latestBroken = brokenAt.length ? Math.max(...brokenAt) : null;
  const unreviewedBroken = brokenAt.filter((id) => !reviewed.has(id));

  // Newest first, so the most recent (and most urgent) events sit at the top.
  const sortedEvents = useMemo(() => [...events].sort((a, b) => b.id - a.id), [events]);

  return (
    <div className={s.root}>
      <Head>
        <title>TrustLedger audit</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400..800&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </Head>
      <style jsx global>{`
        body {
          margin: 0;
          background: #edeff4;
        }
      `}</style>

      <div className={s.shell}>
        <Header user={session?.user} onSignOut={clear} tag="Audit" />

        <div className={s.pageHead}>
          <h1 className={s.pageTitle}>Ledger audit</h1>
          <p className={s.pageLead}>
            Every grant and revoke is chained to the one before it. If a record is altered after the fact, the
            chain breaks here — and the break stays flagged until an admin reviews it.
          </p>
        </div>

        {error && (
          <div className={s.banner} role="alert">
            <span>{error}</span>
            <button type="button" className={s.ghostBtn} onClick={load}>
              Try again
            </button>
          </div>
        )}

        {status && (
          <div className={`${s.statusCard} ${status.valid ? s.statusOk : s.statusBad}`} role="status">
            <span className={s.statusIcon} aria-hidden="true">
              {status.valid ? '✅' : '⚠️'}
            </span>
            <div>
              <p className={s.statusTitle}>
                {status.valid
                  ? 'Chain verified — no tampering detected'
                  : brokenAt.length > 0
                    ? `Tampering detected at ${brokenAt.length} event${brokenAt.length > 1 ? 's' : ''}`
                    : 'Tampering detected — affected event IDs unavailable'}
              </p>

              {!status.valid && brokenAt.length > 0 && (
                <>
                  <p className={s.statusSub}>
                    Most recent at event #{latestBroken}.{' '}
                    {unreviewedBroken.length > 0
                      ? `${unreviewedBroken.length} of ${brokenAt.length} flagged event${brokenAt.length > 1 ? 's' : ''} still need review.`
                      : 'All flagged events have been reviewed — they stay listed below.'}
                  </p>
                  <div className={s.chipsRow}>
                    {[...brokenAt]
                      .sort((a, b) => b - a)
                      .map((id) => {
                        const isLatest = id === latestBroken;
                        const isReviewed = reviewed.has(id);
                        return (
                          <span
                            key={id}
                            className={[s.idChip, isLatest ? s.latest : '', isReviewed ? s.read : '']
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {isLatest && <span className={s.latestDot} aria-hidden="true" />}#{id}
                            {isReviewed ? ' · reviewed' : ''}
                          </span>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className={s.toolbar}>
          <button type="button" className={s.primaryBtn} onClick={load} disabled={loading}>
            {loading ? 'Checking…' : 'Re-check'}
          </button>
          {!isAdmin && session !== undefined && (
            <p className={s.signInNote}>
              Viewing as a guest — <Link href="/admin">sign in as admin</Link> to mark flagged events as reviewed.
            </p>
          )}
        </div>

        <section aria-labelledby="events-title">
          <div className={s.matrixHead}>
            <div>
              <h2 id="events-title" className={s.sectionTitle}>
                Ledger events
              </h2>
              <p className={s.count}>
                {events.length} event{events.length !== 1 ? 's' : ''} recorded
                {brokenAt.length > 0 ? `, ${brokenAt.length} flagged` : ''}
              </p>
            </div>
          </div>

          {loading && events.length === 0 ? (
            <p className={s.emptyNote}>Loading the ledger…</p>
          ) : events.length === 0 ? (
            <p className={s.emptyNote}>No events recorded yet.</p>
          ) : (
            <div className={s.tableScroll}>
              <table className={s.eventsTable}>
                <caption className={s.srOnly}>Ledger events with date, time, actor, location and tamper status</caption>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Date &amp; day</th>
                    <th scope="col">Time</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Location</th>
                    <th scope="col">Action</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((ev) => {
                    const tampered = brokenSet.has(ev.id);
                    const isLatest = ev.id === latestBroken;
                    const isReviewed = reviewed.has(ev.id);
                    const rowClass = tampered && !isReviewed ? (isLatest ? s.rowTamperedLatest : s.rowTampered) : '';
                    const actor = userById.get(ev.actor_id);
                    const resource = resourceById.get(ev.resource_id);

                    return (
                      <tr key={ev.id} className={rowClass}>
                        <td className={s.idCell}>#{ev.id}</td>
                        <td>{formatDateDay(ev.created_at)}</td>
                        <td>{formatTime(ev.created_at)}</td>
                        <td>{actor ? actor.name : `User #${ev.actor_id}`}</td>
                        <td>{resource ? resource.name : `Resource #${ev.resource_id}`}</td>
                        <td>
                          <span className={s.actionPill}>{ev.action}</span>
                        </td>
                        <td>
                          {tampered ? (
                            <div className={s.statusCell}>
                              <span className={s.tamperTag}>⚠ Tampered</span>
                              {isLatest && <span className={s.latestTag}>Latest</span>}
                              {isAdmin &&
                                (isReviewed ? (
                                  <>
                                    <span className={s.readTag}>Reviewed</span>
                                    <button type="button" className={s.undoBtn} onClick={() => markUnreviewed(ev.id)}>
                                      Undo
                                    </button>
                                  </>
                                ) : (
                                  <button type="button" className={s.markBtn} onClick={() => markReviewed(ev.id)}>
                                    Mark reviewed
                                  </button>
                                ))}
                            </div>
                          ) : (
                            <span className={s.readTag}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
// Shickey: admin dashboard. Login, access register (matrix), grant/revoke
// composer and ledger receipts. Talks to Saanvi's API through lib/adminApi.js.
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import { listPermissions, listResources, listUsers } from '../lib/adminApi';
import { ACCESS_TYPES, FALLBACK_RESOURCES, FALLBACK_USERS, completeList } from '../lib/directory';
import { useSession } from '../lib/session';
import AccessMatrix from '../components/admin/AccessMatrix';
import Composer from '../components/admin/Composer';
import Header from '../components/admin/Header';
import LoginPanel from '../components/admin/LoginPanel';
import Receipts from '../components/admin/Receipts';
import s from '../styles/admin.module.css';

function Dashboard({ user, onSignOut }) {
  const [permissions, setPermissions] = useState([]);
  const [apiUsers, setApiUsers] = useState(null);
  const [apiResources, setApiResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [draft, setDraft] = useState({ mode: 'grant', userId: '', resourceId: '', accessType: ACCESS_TYPES[0] });

  const load = useCallback(async () => {
    try {
      const [perms, u, r] = await Promise.all([listPermissions(), listUsers(), listResources()]);
      setPermissions(perms);
      setApiUsers(u);
      setApiResources(r);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const users = useMemo(
    () =>
      completeList(
        apiUsers || FALLBACK_USERS,
        permissions.flatMap((p) => [p.user_id, p.granted_by]),
        'User',
        [user]
      ),
    [apiUsers, permissions, user]
  );
  const resources = useMemo(
    () => completeList(apiResources || FALLBACK_RESOURCES, permissions.map((p) => p.resource_id), 'Resource'),
    [apiResources, permissions]
  );

  const pick = (userId, resourceId, hasAccess) =>
    setDraft((d) => ({ ...d, mode: hasAccess ? 'revoke' : 'grant', userId: String(userId), resourceId: String(resourceId) }));

  const sealed = (receipt) => {
    setReceipts((list) => [{ ...receipt, key: `${Date.now()}-${Math.random()}` }, ...list]);
    load();
  };

  return (
    <div className={s.root}>
      <div className={s.shell}>
        <Header user={user} onSignOut={onSignOut} />

        <div className={s.pageHead}>
          <h1 className={s.pageTitle}>Access register</h1>
          <p className={s.pageLead}>
            Select a cell to change who can open a resource. Every grant and revoke is written to the ledger.
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

        <div className={s.grid}>
          <AccessMatrix
            users={users}
            resources={resources}
            permissions={permissions}
            selected={{ userId: draft.userId, resourceId: draft.resourceId }}
            onPick={pick}
            loading={loading}
          />
          <div className={s.side}>
            <Composer
              users={users}
              resources={resources}
              permissions={permissions}
              me={user}
              draft={draft}
              setDraft={setDraft}
              onSealed={sealed}
            />
            <Receipts receipts={receipts} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { session, save, clear } = useSession();

  return (
    <>
      <Head>
        <title>TrustLedger admin</title>
      </Head>
      <style jsx global>{`
        body {
          margin: 0;
          background: #edeff4;
        }
      `}</style>
      {session === undefined ? (
        <div className={s.root} />
      ) : session ? (
        <Dashboard user={session.user} onSignOut={clear} />
      ) : (
        <LoginPanel onSignedIn={save} />
      )}
    </>
  );
}
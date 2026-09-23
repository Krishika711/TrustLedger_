import { useState } from 'react';
import { grantAccess, revokeAccess } from '../../lib/adminApi';
import { ACCESS_TYPES } from '../../lib/directory';
import s from '../../styles/admin.module.css';

export default function Composer({ users, resources, permissions, me, draft, setDraft, onSealed }) {
  const { mode, userId, resourceId, accessType } = draft;
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const change = (patch) => {
    setDraft({ ...draft, ...patch });
    setConfirming(false);
    setError('');
  };

  const user = users.find((u) => String(u.id) === userId);
  const resource = resources.find((r) => String(r.id) === resourceId);
  const ready = Boolean(user && resource);

  const pairTypes = ready
    ? [
        ...new Set(
          permissions
            .filter((p) => String(p.user_id) === userId && String(p.resource_id) === resourceId)
            .map((p) => p.access_type)
        ),
      ]
    : [];
  const alreadyHas = pairTypes.includes(accessType);
  const canSubmit = ready && (mode === 'grant' ? !alreadyHas : pairTypes.length > 0);

  let status = 'Choose a person and a resource, or select a cell in the register.';
  if (ready) {
    if (mode === 'grant') {
      if (alreadyHas) status = `${user.name} already has ${accessType} access to ${resource.name}.`;
      else if (pairTypes.length) status = `${user.name} currently has ${pairTypes.join(', ')} on ${resource.name}.`;
      else status = `${user.name} has no access to ${resource.name} yet.`;
    } else if (pairTypes.length) {
      status = `${user.name} currently has ${pairTypes.join(', ')} on ${resource.name}. Revoking removes all of it.`;
    } else {
      status = `${user.name} has no access to ${resource.name}, so there is nothing to revoke.`;
    }
  }

  async function submit() {
    setPending(true);
    setError('');
    const base = { user_id: Number(userId), resource_id: Number(resourceId) };
    try {
      if (mode === 'grant') {
        const res = await grantAccess({ ...base, access_type: accessType, granted_by: me.id });
        onSealed({ kind: 'grant', user, resource, accessType, event: res && res.ledgerEvent });
      } else {
        const res = await revokeAccess({ ...base, revoked_by: me.id });
        onSealed({ kind: 'revoke', user, resource, accessType: null, event: res && res.ledgerEvent });
      }
      setConfirming(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  const select = (label, value, onChange, children) => (
    <select className={s.inlineSelect} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );

  const userSelect = select(
    'Person',
    userId,
    (v) => change({ userId: v }),
    <>
      <option value="">person</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </>
  );
  const resourceSelect = select(
    'Resource',
    resourceId,
    (v) => change({ resourceId: v }),
    <>
      <option value="">resource</option>
      {resources.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </>
  );
  const typeSelect = select(
    'Access type',
    accessType,
    (v) => change({ accessType: v }),
    ACCESS_TYPES.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))
  );

  return (
    <section className={s.composer} aria-labelledby="composer-title">
      <h2 id="composer-title" className={s.composerTitle}>
        Change access
      </h2>

      <div className={s.segment} role="group" aria-label="Action">
        <button type="button" aria-pressed={mode === 'grant'} onClick={() => change({ mode: 'grant' })}>
          Grant
        </button>
        <button type="button" aria-pressed={mode === 'revoke'} onClick={() => change({ mode: 'revoke' })}>
          Revoke
        </button>
      </div>

      <p className={s.sentence}>
        {mode === 'grant' ? (
          <>
            Give {userSelect} {typeSelect} access to {resourceSelect}.
          </>
        ) : (
          <>
            Remove all access {userSelect} has to {resourceSelect}.
          </>
        )}
      </p>

      <p className={s.composerStatus} aria-live="polite">
        {status}
      </p>

      {confirming ? (
        <div className={s.confirm} role="alertdialog" aria-label="Confirm revoke">
          <p>
            Revoke all of {user && user.name}'s access to {resource && resource.name}? The revoke is written
            to the ledger and can't be erased.
          </p>
          <div className={s.confirmBtns}>
            <button type="button" className={s.ghostBtnOnDark} onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
            <button type="button" className={s.dangerBtn} onClick={submit} disabled={pending} autoFocus>
              {pending ? 'Revoking…' : 'Revoke access'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={s.actionBtn}
          disabled={!canSubmit || pending}
          onClick={() => (mode === 'grant' ? submit() : setConfirming(true))}
        >
          {mode === 'grant' ? (pending ? 'Granting…' : 'Grant access') : 'Revoke access'}
        </button>
      )}

      <p className={s.composerError} role="alert">
        {error}
      </p>
      <p className={s.actingAs}>Recorded in the ledger as {me.name}.</p>
    </section>
  );
}

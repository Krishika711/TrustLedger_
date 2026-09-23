import { useState } from 'react';
import { login } from '../../lib/adminApi';
import s from '../../styles/admin.module.css';

function ChainMark() {
  return (
    <svg className={s.chainMark} viewBox="0 0 460 96" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <rect x="3" y="18" width="88" height="60" rx="12" />
        <path d="M91 48h46" />
        <rect x="137" y="18" width="88" height="60" rx="12" />
        <path d="M225 48h46" />
        <rect x="271" y="18" width="88" height="60" rx="12" />
        <path d="M359 48h34" strokeDasharray="4 6" />
        <rect x="393" y="18" width="64" height="60" rx="12" strokeDasharray="4 6" />
      </g>
    </svg>
  );
}

export default function LoginPanel({ onSignedIn }) {
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter your name to sign in.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const { token, user } = await login(trimmed);
      if (!user) {
        setError('The server signed you in but sent no user details.');
      } else if (String(user.role).toLowerCase() !== 'admin') {
        setError(`${user.name} has the role "${user.role}". Only admins can use this dashboard.`);
      } else {
        onSignedIn({ token, user });
      }
    } catch (err) {
      setError(
        err.status === 404
          ? `No user named "${trimmed}". The name must match the users table exactly, including capitals.`
          : err.message
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={`${s.root} ${s.loginPage}`}>
      <section className={s.loginStory}>
        <p className={s.brand}>TrustLedger</p>
        <div>
          <h1 className={s.loginHeadline}>Access changes you make here become permanent records.</h1>
          <p className={s.loginCopy}>
            Every grant and revoke is chained to the one before it. If anyone edits history later, the
            chain breaks and the audit dashboard shows where.
          </p>
        </div>
        <ChainMark />
      </section>

      <section className={s.loginFormWrap}>
        <form className={s.loginForm} onSubmit={submit} noValidate>
          <h2 className={s.loginTitle}>Sign in to the admin dashboard</h2>
          <label className={s.fieldLabel} htmlFor="login-name">
            Your name
          </label>
          <input
            id="login-name"
            className={s.textInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
            autoFocus
            aria-describedby="login-hint login-error"
            aria-invalid={error ? 'true' : 'false'}
          />
          <p id="login-hint" className={s.hint}>
            This demo has no passwords. Use the name of an admin in the users table, for example Alice.
          </p>
          <p id="login-error" className={s.formError} role="alert">
            {error}
          </p>
          <button type="submit" className={s.primaryBtn} disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

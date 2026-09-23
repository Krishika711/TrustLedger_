import s from '../../styles/admin.module.css';

export default function Header({ user, onSignOut }) {
  return (
    <header className={s.bar}>
      <div className={s.barBrand}>
        <svg viewBox="0 0 40 24" width="34" height="20" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="3">
            <rect x="2" y="3" width="20" height="18" rx="6" />
            <rect x="18" y="3" width="20" height="18" rx="6" />
          </g>
        </svg>
        <span className={s.brand}>TrustLedger</span>
        <span className={s.barTag}>Admin</span>
      </div>
      <div className={s.barUser}>
        <span>
          Signed in as <strong>{user.name}</strong>
        </span>
        <button type="button" className={s.ghostBtn} onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

import Head from 'next/head';
import Link from 'next/link';
import s from '../styles/admin.module.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>TrustLedger</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400..800&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </Head>
      <div className={s.root}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            gap: '1.25rem',
          }}
        >
          <p className={s.brand} style={{ fontSize: '1.5rem' }}>
            TrustLedger
          </p>
          <h1 style={{ fontSize: '2rem', margin: 0, maxWidth: 560 }}>
            A tamper-evident access log
          </h1>
          <p className={s.pageLead} style={{ maxWidth: 480 }}>
            Every grant and revoke is chained to the one before it. Edit history later, and the
            audit dashboard shows exactly where the chain broke.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Link href="/admin" className={s.primaryBtn} style={{ textDecoration: 'none' }}>
              Open admin dashboard
            </Link>
            <Link href="/audit" className={s.ghostBtn} style={{ textDecoration: 'none' }}>
              View audit trail
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
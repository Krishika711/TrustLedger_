CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  resource_id INTEGER REFERENCES resources(id),
  access_type TEXT NOT NULL,
  granted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, resource_id, access_type)
);

-- created_at is TEXT (not TIMESTAMP) here on purpose: the hash chain needs the
-- exact same string on insert and on re-verify, and a native TIMESTAMP column
-- can round-trip slightly differently through pg and break every hash.
CREATE TABLE IF NOT EXISTS ledger_events (
  id SERIAL PRIMARY KEY,
  prev_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL,
  actor_id INTEGER NOT NULL,
  resource_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);
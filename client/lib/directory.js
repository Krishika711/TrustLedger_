// The API has no /users or /resources route yet, so these mirror
// server/src/db/seed.sql. If the server adds GET /users and GET /resources,
// lib/adminApi.js picks them up automatically and these are ignored.
export const FALLBACK_USERS = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'employee' },
];
export const FALLBACK_RESOURCES = [
  { id: 1, name: 'Payroll File' },
  { id: 2, name: 'HR Database' },
];

// Options offered in the Grant form. Edit to match whatever access_type
// values the team agrees on. The matrix shows whatever is in the database.
export const ACCESS_TYPES = ['read', 'write', 'manage'];

// Guarantees every id we see in permissions (and the signed-in admin) has an
// entry, so nothing renders as a blank name.
export function completeList(base, ids, label, extras = []) {
  const list = [...base];
  for (const item of extras) {
    if (!list.some((x) => x.id === item.id)) list.push(item);
  }
  const known = new Set(list.map((x) => x.id));
  for (const id of new Set(ids)) {
    if (id != null && !known.has(id)) {
      list.push({ id, name: `${label} #${id}` });
      known.add(id);
    }
  }
  return list.sort((a, b) => a.id - b.id);
}

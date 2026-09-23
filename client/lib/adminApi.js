// Admin dashboard API layer (Shickey).
// Kept separate from lib/api.js so the audit page is untouched. Unlike api.js,
// this checks res.ok and turns server errors into readable messages.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new ApiError(`Can't reach the API at ${API_BASE}. Check that the server is running.`, 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // Body wasn't JSON (for example Express's default HTML 404 page).
  }
  if (!res.ok) {
    throw new ApiError((data && data.error) || `Request failed (${res.status}).`, res.status);
  }
  return data;
}

const post = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// POST /auth/login -> { token, user }
export const login = (name) => request('/auth/login', post({ name }));

// GET /access/list -> permission rows
export async function listPermissions() {
  const data = await request('/access/list');
  return Array.isArray(data) ? data : [];
}

// POST /access/grant { user_id, resource_id, access_type, granted_by } -> { permission, ledgerEvent }
export const grantAccess = (payload) => request('/access/grant', post(payload));

// POST /access/revoke { user_id, resource_id, revoked_by } -> { ledgerEvent }
export const revokeAccess = (payload) => request('/access/revoke', post(payload));

// Not in the agreed contract. Tried first; if the server has no such route we
// return null and the dashboard uses the fallback lists in lib/directory.js.
async function optionalList(path) {
  try {
    const data = await request(path);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}
export const listUsers = () => optionalList('/users');
export const listResources = () => optionalList('/resources');

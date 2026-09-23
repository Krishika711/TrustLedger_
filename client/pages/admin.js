// Shickey: this is your page. Working but ugly on purpose — style it,
// add a real login step, swap raw ID inputs for dropdowns if you have time.
import { useState, useEffect } from 'react';
import { apiPost, apiGet } from '../lib/api';

export default function Admin() {
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({ user_id: '', resource_id: '', access_type: 'read', granted_by: '' });

  const load = async () => setPermissions(await apiGet('/access/list'));
  useEffect(() => { load(); }, []);

  const grant = async () => {
    await apiPost('/access/grant', form);
    load();
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Admin — Grant / Revoke Access</h1>
      <div>
        <input placeholder="user_id" onChange={e => setForm({ ...form, user_id: e.target.value })} />
        <input placeholder="resource_id" onChange={e => setForm({ ...form, resource_id: e.target.value })} />
        <input placeholder="access_type" onChange={e => setForm({ ...form, access_type: e.target.value })} />
        <input placeholder="granted_by (your user_id)" onChange={e => setForm({ ...form, granted_by: e.target.value })} />
        <button onClick={grant}>Grant</button>
      </div>
      <h2>Current permissions</h2>
      <pre>{JSON.stringify(permissions, null, 2)}</pre>
    </div>
  );
}

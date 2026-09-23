import { useMemo, useState } from 'react';
import s from '../../styles/admin.module.css';

export default function AccessMatrix({ users, resources, permissions, selected, onPick, loading }) {
  const [query, setQuery] = useState('');

  // "userId:resourceId" -> unique access types
  const byPair = useMemo(() => {
    const map = new Map();
    for (const p of permissions) {
      const key = `${p.user_id}:${p.resource_id}`;
      const set = map.get(key) || new Set();
      set.add(p.access_type);
      map.set(key, set);
    }
    return map;
  }, [permissions]);

  const q = query.trim().toLowerCase();
  const shown = users.filter((u) => u.name.toLowerCase().includes(q));

  return (
    <section aria-labelledby="matrix-title">
      <div className={s.matrixHead}>
        <div>
          <h2 id="matrix-title" className={s.sectionTitle}>
            Who can open what
          </h2>
          <p className={s.count}>
            {users.length} people, {resources.length} resources, {permissions.length} grants
          </p>
        </div>
        <div className={s.filter}>
          <label htmlFor="filter-people" className={s.srOnly}>
            Filter people by name
          </label>
          <input
            id="filter-people"
            className={s.textInput}
            placeholder="Filter people"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className={s.emptyNote}>Loading the access register…</p>
      ) : (
        <div className={s.matrixScroll}>
          <table className={s.matrix}>
            <caption className={s.srOnly}>Access by person and resource</caption>
            <thead>
              <tr>
                <th scope="col" className={s.corner}>
                  Person
                </th>
                {resources.map((r) => (
                  <th key={r.id} scope="col" className={s.colHead}>
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={resources.length + 1} className={s.emptyNote}>
                    No one matches "{query}".
                  </td>
                </tr>
              )}
              {shown.map((u) => (
                <tr key={u.id}>
                  <th scope="row" className={s.rowHead}>
                    <span className={s.personName}>{u.name}</span>
                    {u.role && <span className={s.personRole}>{u.role}</span>}
                  </th>
                  {resources.map((r) => {
                    const types = [...(byPair.get(`${u.id}:${r.id}`) || [])];
                    const isSelected =
                      selected.userId === String(u.id) && selected.resourceId === String(r.id);
                    const has = types.length > 0;
                    return (
                      <td key={r.id} className={s.cellTd}>
                        <button
                          type="button"
                          className={`${s.cell} ${has ? s.cellHas : s.cellEmpty} ${
                            isSelected ? s.cellSelected : ''
                          }`}
                          aria-pressed={isSelected}
                          aria-label={
                            has
                              ? `${u.name} has ${types.join(', ')} on ${r.name}. Select to change.`
                              : `${u.name} has no access to ${r.name}. Select to grant.`
                          }
                          onClick={() => onPick(u.id, r.id, has)}
                        >
                          {has ? (
                            types.map((t) => (
                              <span key={t} className={s.chip}>
                                {t}
                              </span>
                            ))
                          ) : (
                            <>
                              <span className={s.emptyIdle}>No access</span>
                              <span className={s.emptyHover}>Grant access</span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

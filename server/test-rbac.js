const pool = require('./src/db/pool');
const { canAccess } = require('./src/utils/rbac');

(async () => {
  const admin = (await pool.query("INSERT INTO users (name, role) VALUES ('TestAdmin','admin') RETURNING id")).rows[0].id;
  const emp = (await pool.query("INSERT INTO users (name, role) VALUES ('TestEmployee','employee') RETURNING id")).rows[0].id;
  const res = (await pool.query("INSERT INTO resources (name) VALUES ('TestResource') RETURNING id")).rows[0].id;

  console.log('admin, no grant      :', await canAccess(pool, admin, res, 'read'));  // expect true
  console.log('employee, no grant   :', await canAccess(pool, emp, res, 'read'));    // expect false

  const grant = "INSERT INTO permissions (user_id, resource_id, access_type, granted_by) VALUES ($1,$2,'read',$3)";
  await pool.query(grant, [emp, res, admin]);
  console.log('employee, granted    :', await canAccess(pool, emp, res, 'read'));    // expect true
  console.log('employee, wrong type :', await canAccess(pool, emp, res, 'write'));   // expect false

  try {
    await pool.query(grant, [emp, res, admin]);
    console.log('duplicate grant      : NOT blocked (bad)');
  } catch (e) {
    console.log('duplicate grant      : blocked (good)');
  }

  // clean up so the test leaves no junk behind
  await pool.query('DELETE FROM permissions WHERE resource_id = $1', [res]);
  await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [admin, emp]);
  await pool.query('DELETE FROM resources WHERE id = $1', [res]);
  await pool.end();
})().catch(async (e) => { console.error('ERROR:', e.message); await pool.end(); });
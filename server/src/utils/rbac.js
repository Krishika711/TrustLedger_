async function canAccess(pool, userId, resourceId, accessType) {
  const { rows: users } = await pool.query(
    'SELECT role FROM users WHERE id = $1', [userId]
  );
  if (!users.length) return false;            // unknown user: no access
  if (users[0].role === 'admin') return true; // admins bypass the list

  const { rows } = await pool.query(
    'SELECT 1 FROM permissions WHERE user_id = $1 AND resource_id = $2 AND access_type = $3',
    [userId, resourceId, accessType]
  );
  return rows.length > 0;
}

module.exports = { canAccess };
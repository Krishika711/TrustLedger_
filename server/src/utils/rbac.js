// Basant: this is your module. Starting point — a real permission-table
// lookup. Extend with role-based rules (e.g. admins bypass the check) as needed.
async function canAccess(pool, userId, resourceId, accessType) {
  const { rows } = await pool.query(
    'SELECT * FROM permissions WHERE user_id = $1 AND resource_id = $2 AND access_type = $3',
    [userId, resourceId, accessType]
  );
  return rows.length > 0;
}

module.exports = { canAccess };

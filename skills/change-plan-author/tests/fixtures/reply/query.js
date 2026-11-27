// Builds the parameterised query for report rows from the filters.
export async function queryRows(filters, limit, offset = 0) {
  return { sql: 'SELECT * FROM usage WHERE day BETWEEN $1 AND $2 AND ($3::text IS NULL OR team = $3) LIMIT $4 OFFSET $5', params: [filters.from, filters.to, filters.team ?? null, limit, offset] };
}
export async function countRows(filters) {
  return { sql: 'SELECT count(*) FROM usage WHERE day BETWEEN $1 AND $2 AND ($3::text IS NULL OR team = $3)', params: [filters.from, filters.to, filters.team ?? null] };
}

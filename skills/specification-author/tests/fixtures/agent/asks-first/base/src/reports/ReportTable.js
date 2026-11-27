// Renders the report table for the current filters (date range, team).
// Rows are loaded in pages of 500 from /api/reports/rows.
export function ReportTable({ filters, columns, rows }) {
  return { filters, columns, rows };
}
export const COLUMNS = ['date', 'team', 'active_users', 'sessions', 'avg_session_minutes'];

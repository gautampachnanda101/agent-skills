// Renders the report table and its toolbar for the current filters.
export function ReportTable({ filters, columns, rows }) {
  return { toolbar: ['filters'], filters, columns, rows };
}
export const COLUMNS = ['date', 'team', 'active_users', 'sessions', 'avg_session_minutes'];

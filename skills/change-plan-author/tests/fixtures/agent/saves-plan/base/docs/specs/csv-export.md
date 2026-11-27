# CSV export for reports

## Problem

Analysts copy report tables into spreadsheets by hand, which takes time and
introduces errors.

## Users

Analysts and admins, the two roles that can open reports.

## Scope

Export every row that matches the report's current filters, across all
pages, as one CSV file. The server builds the file through a new endpoint,
`GET /api/reports/export`, which takes the same filters as the rows API.

## Non-goals

- Scheduled or emailed exports; planned as a follow-up.
- Exports of more than 50,000 rows, although reports can reach 200,000;
  planned as a follow-up with background exports.
- Other formats, such as XLSX.

## Requirements

- R-1: Users with the analyst or admin role can export; anyone else gets
  403, and an unauthenticated request gets 401.
- R-2: For the reference dataset of 50,000 rows and five columns on the
  staging server, the time from the export request to the last byte of the
  response is under 10 seconds in 95 of 100 runs.
- R-3: The file is UTF-8 without a byte-order mark, with LF line endings,
  quoted as in RFC 4180. The first line is the header, with the table's
  columns in order. Dates are written as `YYYY-MM-DD` in UTC.
- R-4: A text cell whose value begins with `=`, `+`, `-`, or `@` is prefixed
  with a single quote, so spreadsheets do not run it as a formula. Numeric
  cells, including negative numbers, are never prefixed.
- R-5: A request matching more than 50,000 rows gets 413 with the JSON body
  `{"error": "too_many_rows", "rowCount": <count>}`, and the page shows that count and asks the user to narrow the
  filters. A request matching no rows returns a file with only the header.

## Acceptance criteria

- AC-1 (R-1): Given an analyst viewing a report filtered to one team, when
  they select Export CSV, then a file downloads holding every row for that
  team across all pages.
- AC-2 (R-1): Given an admin, when they select Export CSV, then the file
  downloads.
- AC-3 (R-1): Given a user with neither role, when they call the export
  endpoint, then it responds 403 and returns no file; given no session, it
  responds 401.
- AC-4 (R-2): Given the reference dataset on staging, when it is exported
  100 times, then at least 95 responses complete within 10 seconds.
- AC-5 (R-3): Given a team name with a comma, a quote, and a non-ASCII
  letter, when exported, then the file parses with an RFC 4180 parser to
  the same values, its first line is the header in table order, and every
  date matches `YYYY-MM-DD`. Cells prefixed under R-4 are compared without
  their prefix.
- AC-6 (R-4): Given a text cell `=SUM(A1:A2)` and a numeric cell `-12`, when
  exported, then the file holds `'=SUM(A1:A2)` and `-12`.
- AC-7 (R-5): Given filters matching 50,001 rows, when the user selects
  Export CSV, then the endpoint responds 413 with `"rowCount": 50001`, no file
  downloads, and the page shows the count and asks them to narrow the
  filters.
- AC-8 (R-5): Given filters matching no rows, when exported, then the file
  holds only the header line.

# CSV export for reports

## Problem

Analysts copy report tables into spreadsheets by hand, which takes time and
introduces errors.

## Scope

Add an Export CSV button to the reports page.

## Requirements

- R-1: Every user can export the report they are viewing.
- R-2: The export must be fast.
- R-3: The file uses UTF-8 with a header row, and dates in ISO 8601.
- R-4: Exports hold every row of the filtered view. A report never exceeds
  10,000 rows, so no limit is needed.

## Acceptance criteria

- AC-1 (R-1): Given a user on the reports page, when they select Export CSV,
  then a CSV file downloads.
- AC-2 (R-2): Given a large report, when it is exported, the export works
  correctly.
- AC-3 (R-4): Given a report filtered to one team, when exported, then the
  file holds only that team's rows.

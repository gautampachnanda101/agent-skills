---
name: csv-cleaner
description: Normalize CSV exports from the billing system - trims whitespace, fixes date formats to ISO 8601, and removes duplicate rows. Use when preparing billing CSV exports for import.
metadata:
  author: data-team
  version: "2.3.0"
---

# CSV cleaner

1. Read the CSV and detect its delimiter.
2. Trim whitespace in every cell.
3. Convert dates to ISO 8601.
4. Remove exact duplicate rows and report how many.
5. Write `<name>.clean.csv` next to the input.

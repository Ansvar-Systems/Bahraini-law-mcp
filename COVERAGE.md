# Coverage Index -- Bahrain Law MCP

> Auto-generated from census data. Do not edit manually.
> Generated: 2026-02-28

## Source

| Field | Value |
|-------|-------|
| Authority | Legislation and Legal Opinion Commission (LLOC) |
| Portal | [legalaffairs.gov.bh](https://legalaffairs.gov.bh) |
| License | Government Publication |
| Census date | 2026-02-28 |
| Census method | Automated scrape of /legislation/search (TypeID=K) |

## Summary

| Metric | Count |
|--------|-------|
| Total laws enumerated | 1,622 |
| Ingested | 1,622 |
| With provisions | 580 |
| Zero-provision (ratification/amendment) | 1,042 |
| Inaccessible | 0 |
| Provisions extracted | 13,506 |
| Definitions extracted | 2,187 |
| **Coverage** | **100%** |

## Category Breakdown

| Category | Laws | Provisions |
|----------|------|------------|
| Constitution | 1 | 125 |
| Law (قانون) | 551 | 6,539 |
| Decree-Law (مرسوم بقانون) | 1,012 | 7,442 |
| Legislative Decree | 56 | 400 |
| Decree (مرسوم) | 2 | 0 |

## Coverage by Decade

| Decade | Provisions |
|--------|------------|
| 1960s | 24 |
| 1970s | 199 |
| 1980s | 179 |
| 1990s | 753 |
| 2000s | 4,999 |
| 2010s | 4,827 |
| 2020s | 1,747 |

## Top 10 Laws by Provision Count

| Law | Provisions | Title |
|-----|------------|-------|
| dl-19-2001 | 1,050 | Civil Code (القانون المدني) |
| dl-46-2002 | 427 | Criminal Procedure Code |
| law-13-2022 | 388 | Commercial Companies |
| dl-54-2002 | 220 | House of Representatives Internal Rules |
| law-36-2012 | 197 | Private Sector Labor Law |
| dl-24-2018 | 195 | Bankruptcy and Restructuring |
| dl-55-2002 | 191 | Shura Council Internal Rules |
| law-64-2006 | 188 | Central Bank of Bahrain |
| dl-10-2002 | 179 | Arbitration |
| law-15-2012 | 160 | Maritime Transport |

## Zero-Provision Laws

1,042 laws have zero extracted provisions. These fall into three categories:

- **Ratification laws** (~336): Approve international treaties with generic 2-3 article text
- **Amendment laws** (~299): Modify specific articles of other laws
- **Short/procedural laws** (~407): Short decrees, budget laws (table-only), or older laws with non-standard formatting

These are fetched and stored but their content does not contain structured article divisions parseable by the current article-heading parser. The raw HTML is preserved in `data/source/` for future improvement.

## Database

| Property | Value |
|----------|-------|
| Format | SQLite (FTS5, unicode61 tokenizer) |
| Size | 25.9 MB |
| Schema version | 2 |
| Languages | Arabic (primary) |

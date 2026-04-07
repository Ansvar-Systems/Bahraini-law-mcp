/**
 * Response metadata utilities for Bahrain Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
  note?: string;
  query_strategy?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
  _citation?: import('./citation.js').CitationMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'Bahrain Law (legalaffairs.gov.bh) — Legislation and Legal Opinion Commission',
    jurisdiction: 'BH',
    disclaimer:
      'This data is sourced from Bahrain Law under Government Open Data principles. ' +
      'The authoritative versions are in Arabic. English translations are available for many laws. ' +
      'Always verify with the official Bahrain Law portal (legalaffairs.gov.bh).',
    freshness,
  };
}

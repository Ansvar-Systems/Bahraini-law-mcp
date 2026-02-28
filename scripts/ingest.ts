#!/usr/bin/env tsx
/**
 * Bahrain Law MCP -- Census-Driven Ingestion Pipeline
 *
 * Reads data/census.json and fetches + parses every ingestable law
 * from legalaffairs.gov.bh (Word-generated HTML).
 *
 * Features:
 *   - Resume support: skips laws that already have a seed JSON file
 *   - Census update: writes provision counts + ingestion dates back to census.json
 *   - Rate limiting: 500ms minimum between requests (via fetcher.ts)
 *   - Checkpoint: saves census every 50 laws
 *
 * Usage:
 *   npm run ingest                    # Full census-driven ingestion
 *   npm run ingest -- --limit 5       # Test with 5 laws
 *   npm run ingest -- --skip-fetch    # Reuse cached HTML (re-parse only)
 *   npm run ingest -- --force         # Re-ingest even if seed exists
 *   npm run ingest -- --resume        # Same as default (skip existing seeds)
 *
 * Data source: legalaffairs.gov.bh (Legislation and Legal Opinion Commission)
 * Format: Word-generated HTML (MsoNormal)
 * License: Government Open Data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRateLimit } from './lib/fetcher.js';
import { parseBahrainLawHtml, type ActIndexEntry, type ParsedAct } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');
const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');

/* ---------- Types ---------- */

interface CensusLawEntry {
  id: string;
  title: string;
  title_en?: string;
  identifier: string;
  url: string;
  url_en?: string;
  htm_code?: string;
  status: 'in_force' | 'amended' | 'repealed';
  category: string;
  classification: 'ingestable' | 'excluded' | 'inaccessible';
  ingested: boolean;
  provision_count: number;
  ingestion_date: string | null;
  year?: number | null;
  number?: number | null;
}

interface CensusFile {
  schema_version: string;
  jurisdiction: string;
  jurisdiction_name: string;
  portal: string;
  census_date: string;
  agent: string;
  summary: {
    total_laws: number;
    ingestable: number;
    ocr_needed: number;
    inaccessible: number;
    excluded: number;
  };
  laws: CensusLawEntry[];
}

/* ---------- Helpers ---------- */

function parseArgs(): { limit: number | null; skipFetch: boolean; force: boolean } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let skipFetch = false;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--skip-fetch') {
      skipFetch = true;
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  return { limit, skipFetch, force };
}

/**
 * Convert a census entry to an ActIndexEntry for the parser.
 */
function censusToActEntry(law: CensusLawEntry): ActIndexEntry {
  const parts = law.identifier.split('/');
  const aknYear = parts[1] ?? '';
  const aknNumber = parts[2] ?? '';

  // Generate a readable short name
  let shortName = law.id;
  if (law.title_en && law.title_en.length > 0) {
    shortName = law.title_en.length > 40 ? law.title_en.substring(0, 37) + '...' : law.title_en;
  } else if (law.title.length > 40) {
    shortName = law.title.substring(0, 37) + '...';
  } else {
    shortName = law.title;
  }

  return {
    id: law.id,
    title: law.title,
    titleEn: law.title_en ?? '',
    shortName,
    status: law.status === 'in_force' ? 'in_force' : law.status === 'amended' ? 'amended' : 'repealed',
    issuedDate: '',
    inForceDate: '',
    url: law.url,
    aknYear,
    aknNumber,
  };
}

/* ---------- Main ---------- */

async function main(): Promise<void> {
  const { limit, skipFetch, force } = parseArgs();

  console.log('Bahrain Law MCP -- Ingestion Pipeline (Census-Driven)');
  console.log('====================================================\n');
  console.log(`  Source: legalaffairs.gov.bh (Legislation and Legal Opinion Commission)`);
  console.log(`  Format: Word-generated HTML (MsoNormal)`);
  console.log(`  License: Government Open Data`);

  if (limit) console.log(`  --limit ${limit}`);
  if (skipFetch) console.log(`  --skip-fetch`);
  if (force) console.log(`  --force (re-ingest all)`);

  // Load census
  if (!fs.existsSync(CENSUS_PATH)) {
    console.error(`\nERROR: Census file not found at ${CENSUS_PATH}`);
    console.error('Run "npx tsx scripts/census.ts" first.');
    process.exit(1);
  }

  const census: CensusFile = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8'));
  const ingestable = census.laws.filter(l => l.classification === 'ingestable');
  const acts = limit ? ingestable.slice(0, limit) : ingestable;

  console.log(`\n  Census: ${census.summary.total_laws} total, ${ingestable.length} ingestable`);
  console.log(`  Processing: ${acts.length} laws\n`);

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });

  let processed = 0;
  let ingested = 0;
  let skipped = 0;
  let failed = 0;
  let totalProvisions = 0;
  let totalDefinitions = 0;
  const results: { act: string; provisions: number; definitions: number; status: string }[] = [];

  // Build a map for census updates
  const censusMap = new Map<string, CensusLawEntry>();
  for (const law of census.laws) {
    censusMap.set(law.id, law);
  }

  const today = new Date().toISOString().split('T')[0];

  for (const law of acts) {
    const act = censusToActEntry(law);
    const sourceFile = path.join(SOURCE_DIR, `${act.id}.html`);
    const seedFile = path.join(SEED_DIR, `${act.id}.json`);

    // Resume support: skip if seed already exists (unless --force)
    if (!force && fs.existsSync(seedFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as ParsedAct;
        const provCount = existing.provisions?.length ?? 0;
        const defCount = existing.definitions?.length ?? 0;
        totalProvisions += provCount;
        totalDefinitions += defCount;

        // Update census entry
        const entry = censusMap.get(law.id);
        if (entry) {
          entry.ingested = true;
          entry.provision_count = provCount;
          entry.ingestion_date = entry.ingestion_date ?? today;
        }

        results.push({ act: act.shortName, provisions: provCount, definitions: defCount, status: 'resumed' });
        skipped++;
        processed++;
        continue;
      } catch {
        // Corrupt seed file, re-ingest
      }
    }

    try {
      let html: string;

      if (fs.existsSync(sourceFile) && skipFetch) {
        html = fs.readFileSync(sourceFile, 'utf-8');
        console.log(`  [${processed + 1}/${acts.length}] Using cached ${act.id} (${(html.length / 1024).toFixed(0)} KB)`);
      } else {
        process.stdout.write(`  [${processed + 1}/${acts.length}] Fetching ${act.id}...`);
        const result = await fetchWithRateLimit(act.url);

        if (result.status !== 200) {
          console.log(` HTTP ${result.status}`);

          // Mark as inaccessible in census
          const entry = censusMap.get(law.id);
          if (entry) {
            entry.classification = 'inaccessible';
          }

          results.push({ act: act.shortName, provisions: 0, definitions: 0, status: `HTTP ${result.status}` });
          failed++;
          processed++;
          continue;
        }

        html = result.body;
        fs.writeFileSync(sourceFile, html);
        console.log(` OK (${(html.length / 1024).toFixed(0)} KB)`);
      }

      const parsed = parseBahrainLawHtml(html, act);

      // Enrich with English title from census if available
      if (law.title_en && !parsed.title_en) {
        parsed.title_en = law.title_en;
      }

      fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2));
      totalProvisions += parsed.provisions.length;
      totalDefinitions += parsed.definitions.length;
      console.log(`    -> ${parsed.provisions.length} provisions, ${parsed.definitions.length} definitions`);

      // Update census entry
      const entry = censusMap.get(law.id);
      if (entry) {
        entry.ingested = true;
        entry.provision_count = parsed.provisions.length;
        entry.ingestion_date = today;
      }

      results.push({
        act: act.shortName,
        provisions: parsed.provisions.length,
        definitions: parsed.definitions.length,
        status: 'OK',
      });
      ingested++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ERROR parsing ${act.id}: ${msg}`);
      results.push({ act: act.shortName, provisions: 0, definitions: 0, status: `ERROR: ${msg.substring(0, 80)}` });
      failed++;
    }

    processed++;

    // Save census every 50 laws (checkpoint)
    if (processed % 50 === 0) {
      writeCensus(census, censusMap);
      console.log(`  [checkpoint] Census updated at ${processed}/${acts.length}`);
    }
  }

  // Final census update
  writeCensus(census, censusMap);

  // Report
  console.log(`\n${'='.repeat(70)}`);
  console.log('Ingestion Report');
  console.log('='.repeat(70));
  console.log(`\n  Source:      legalaffairs.gov.bh (Word-generated HTML)`);
  console.log(`  Processed:   ${processed}`);
  console.log(`  New:         ${ingested}`);
  console.log(`  Resumed:     ${skipped}`);
  console.log(`  Failed:      ${failed}`);
  console.log(`  Total provisions:  ${totalProvisions}`);
  console.log(`  Total definitions: ${totalDefinitions}`);

  // Summary of failures
  const failures = results.filter(r => r.status.startsWith('HTTP') || r.status.startsWith('ERROR'));
  if (failures.length > 0) {
    console.log(`\n  Failed laws:`);
    for (const f of failures) {
      console.log(`    ${f.act}: ${f.status}`);
    }
  }

  // Zero-provision laws
  const zeroProv = results.filter(r => r.provisions === 0 && !r.status.startsWith('HTTP') && !r.status.startsWith('ERROR'));
  if (zeroProv.length > 0) {
    console.log(`\n  Zero-provision laws (${zeroProv.length}):`);
    for (const z of zeroProv.slice(0, 20)) {
      console.log(`    ${z.act}`);
    }
    if (zeroProv.length > 20) {
      console.log(`    ... and ${zeroProv.length - 20} more`);
    }
  }

  console.log('');
}

function writeCensus(census: CensusFile, censusMap: Map<string, CensusLawEntry>): void {
  // Update the laws array from the map
  census.laws = Array.from(censusMap.values());

  // Recalculate summary
  census.summary.total_laws = census.laws.length;
  census.summary.ingestable = census.laws.filter(l => l.classification === 'ingestable').length;
  census.summary.inaccessible = census.laws.filter(l => l.classification === 'inaccessible').length;
  census.summary.excluded = census.laws.filter(l => l.classification === 'excluded').length;

  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env tsx
/**
 * Bahrain Law MCP -- Census Script (Full Corpus Scraper)
 *
 * Enumerates ALL laws and decree-laws from legalaffairs.gov.bh
 * (Legislation and Legal Opinion Commission / هيئة التشريع والرأي القانوني)
 *
 * Strategy:
 *   1. GET /Legislation/Search to obtain a CSRF token + session cookie
 *   2. Use curl to POST /legislation/search with TypeID="K" (laws & decree-laws)
 *      paginating 50 items per page through all pages
 *   3. Parse each result to extract: HTM code, title (Arabic), year, number
 *   4. Also include the Constitution (special entry S0102)
 *   5. Write data/census.json with the full enumeration
 *
 * Usage:
 *   npx tsx scripts/census.ts                 # Full scrape
 *   npx tsx scripts/census.ts --limit 100     # First 100 only
 *   npx tsx scripts/census.ts --dry-run       # Show count only
 *
 * License: Government Publication
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');
const PORTAL_BASE = 'https://legalaffairs.gov.bh';
const SEARCH_URL = `${PORTAL_BASE}/Legislation/Search`;
const SEARCH_API = `${PORTAL_BASE}/legislation/search`;
const USER_AGENT = 'bahraini-law-mcp/1.0 (https://github.com/Ansvar-Systems/bahraini-law-mcp; hello@ansvar.ai)';
const PAGE_SIZE = 50;
const RATE_LIMIT_MS = 800;

/* ---------- Types ---------- */

interface CensusLawEntry {
  id: string;
  title: string;
  title_en: string;
  identifier: string;
  url: string;
  url_en: string;
  htm_code: string;
  status: 'in_force' | 'amended' | 'repealed';
  category: 'law' | 'decree-law' | 'legislative-decree' | 'constitution' | 'decree';
  classification: 'ingestable' | 'excluded' | 'inaccessible';
  ingested: boolean;
  provision_count: number;
  ingestion_date: string | null;
  year: number | null;
  number: number | null;
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

function parseArgs(): { limit: number | null; dryRun: boolean } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }
  return { limit, dryRun };
}

function sleep(ms: number): void {
  execSync(`sleep ${ms / 1000}`);
}

function toAsciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, ch => String(ch.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, ch => String(ch.charCodeAt(0) - 1776));
}

function extractYearAndNumber(title: string): { year: number | null; number: number | null } {
  const ascii = toAsciiDigits(title);
  const match = ascii.match(/رقم\s*[\(]?\s*(\d+)\s*[\)]?\s*لسنة\s*(\d{4})/);
  if (match) {
    return { number: parseInt(match[1], 10), year: parseInt(match[2], 10) };
  }
  const yearMatch = ascii.match(/لسنة\s*(\d{4})/);
  const numMatch = ascii.match(/رقم\s*[\(]?\s*(\d+)/);
  return {
    year: yearMatch ? parseInt(yearMatch[1], 10) : null,
    number: numMatch ? parseInt(numMatch[1], 10) : null,
  };
}

function categorize(htmCode: string, title: string): CensusLawEntry['category'] {
  if (htmCode.startsWith('S')) return 'constitution';
  if (title.includes('مرسوم بقانون')) return 'decree-law';
  if (htmCode.startsWith('L')) return 'legislative-decree';
  if (htmCode.startsWith('K')) return 'law';
  if (htmCode.startsWith('D')) return 'decree';
  return 'law';
}

function generateId(htmCode: string, title: string, year: number | null, number_: number | null): string {
  const code = htmCode.toLowerCase();
  if (code === 's0102') return 'constitution-2002';
  const cat = categorize(htmCode, title);
  const prefix = cat === 'decree-law' ? 'dl' : cat === 'legislative-decree' ? 'ld' : cat === 'decree' ? 'd' : 'law';
  if (year && number_) return `${prefix}-${number_}-${year}`;
  return `${prefix}-${code}`;
}

function buildIdentifier(category: string, year: number | null, number_: number | null): string {
  const type = category === 'constitution' ? 'constitution'
    : category === 'decree-law' ? 'marsoom'
    : category === 'legislative-decree' ? 'marsoom'
    : category === 'decree' ? 'decree'
    : 'qanun';
  if (year && number_) return `${type}/${year}/${number_}`;
  if (year) return `${type}/${year}`;
  return type;
}

/* ---------- Scraping via curl ---------- */

interface SessionInfo {
  token: string;
  cookieFile: string;
}

function getSession(): SessionInfo {
  const cookieFile = '/tmp/bh-census-cookies.txt';
  const outputFile = '/tmp/bh-census-session.html';

  execSync(
    `curl -s '${SEARCH_URL}' ` +
    `-H 'User-Agent: ${USER_AGENT}' ` +
    `-c '${cookieFile}' ` +
    `-o '${outputFile}'`,
    { timeout: 30000 },
  );

  const html = fs.readFileSync(outputFile, 'utf-8');
  const tokenMatch = html.match(/id="token"\s+value="([^"]+)"/);
  if (!tokenMatch) {
    throw new Error('Could not extract CSRF token from search page');
  }

  return { token: tokenMatch[1], cookieFile };
}

interface ScrapedLaw {
  htmCode: string;
  title: string;
  enTitle: string;
}

function fetchSearchPage(session: SessionInfo, pageNum: number): {
  laws: ScrapedLaw[];
  totalPages: number;
  newToken: string | null;
} {
  const outputFile = `/tmp/bh-census-page-${pageNum}.html`;

  const postData = JSON.stringify({
    PostParam: {
      IsSearchTitle: true,
      LegNum: null,
      YearFrom: null,
      YearTo: null,
      OGFrom: null,
      OGTo: null,
      TypeID: 'K',
      SourceID: null,
      CategoryID: null,
      KeywordAll: null,
      KeywordAny: null,
      KeywordPhrase: null,
      KeywordNot: null,
      IsSearchTreaty: false,
      IsSearchWomen: false,
      IsSearchEnglish: false,
      SortBy: '1',
    },
    PageNum: pageNum,
    PageSize: PAGE_SIZE,
  });

  // Write POST data to a temp file to avoid shell escaping issues
  const dataFile = `/tmp/bh-census-postdata-${pageNum}.json`;
  fs.writeFileSync(dataFile, postData);

  execSync(
    `curl -s '${SEARCH_API}' ` +
    `-X POST ` +
    `-H 'Content-Type: application/json; charset=utf-8' ` +
    `-H 'User-Agent: ${USER_AGENT}' ` +
    `-H 'RequestVerificationToken: ${session.token}' ` +
    `-H 'X-Requested-With: XMLHttpRequest' ` +
    `-b '${session.cookieFile}' ` +
    `--max-time 60 ` +
    `-d @'${dataFile}' ` +
    `-o '${outputFile}'`,
    { timeout: 90000 },
  );

  const html = fs.readFileSync(outputFile, 'utf-8');

  // Extract total pages
  const pageOptions = [...html.matchAll(/<option[^>]*value="(\d+)"/g)];
  let totalPages = 1;
  for (const opt of pageOptions) {
    const p = parseInt(opt[1], 10);
    if (p > totalPages) totalPages = p;
  }

  // Extract law entries
  const laws: ScrapedLaw[] = [];

  // Find HTM codes
  const htmCodes = [...html.matchAll(/href="\/Legislation\/HTM\/([^"]+)"/g)].map(m => m[1]);

  // Find Arabic titles
  const arTitles = [...html.matchAll(/<div class="ArTitle"[^>]*>(.*?)<\/div>/gs)]
    .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());

  // Find English titles
  const enTitles = [...html.matchAll(/<div class="EnTitle"[^>]*>(.*?)<\/div>/gs)]
    .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());

  const count = Math.min(arTitles.length, htmCodes.length);
  for (let i = 0; i < count; i++) {
    laws.push({
      htmCode: htmCodes[i],
      title: arTitles[i],
      enTitle: enTitles[i] ?? '',
    });
  }

  // Extract new token for pagination
  const newTokenMatch = html.match(/fetchResult\([^,]+,[^,]+,\s*this\.value\s*,\s*\d+\s*,'([^']+)'/);

  // Clean up temp files
  try { fs.unlinkSync(dataFile); } catch { /* ignore */ }
  try { fs.unlinkSync(outputFile); } catch { /* ignore */ }

  return {
    laws,
    totalPages,
    newToken: newTokenMatch ? newTokenMatch[1] : null,
  };
}

/* ---------- Main ---------- */

function main(): void {
  const { limit, dryRun } = parseArgs();

  console.log('Bahrain Law MCP -- Census (Full Corpus Scraper)');
  console.log('================================================\n');
  console.log('  Source: legalaffairs.gov.bh (Legislation and Legal Opinion Commission)');
  console.log('  Method: POST /legislation/search with TypeID=K');
  console.log(`  Page size: ${PAGE_SIZE}`);
  if (limit) console.log(`  --limit ${limit}`);
  if (dryRun) console.log(`  --dry-run`);

  // Load existing census to preserve ingestion state
  const existingEntries = new Map<string, CensusLawEntry>();
  const existingByHtm = new Map<string, CensusLawEntry>();
  if (fs.existsSync(CENSUS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8')) as CensusFile;
      for (const law of data.laws) {
        existingEntries.set(law.id, law);
        if (law.htm_code) {
          existingByHtm.set(law.htm_code, law);
        }
      }
      console.log(`  Loaded ${data.laws.length} existing entries\n`);
    } catch { /* Start fresh */ }
  }

  // Step 1: Get session
  console.log('  [1/3] Getting session token...');
  const session = getSession();
  console.log('  Token acquired\n');

  // Step 2: Scrape all pages
  console.log('  [2/3] Scraping legislation search...');
  const allLaws: ScrapedLaw[] = [];

  // Fetch first page to get total
  const firstPage = fetchSearchPage(session, 1);
  const totalPages = firstPage.totalPages;
  allLaws.push(...firstPage.laws);
  console.log(`  Page 1/${totalPages}: ${firstPage.laws.length} laws (total pages: ${totalPages})`);

  // Update token for next pages
  if (firstPage.newToken) {
    session.token = firstPage.newToken;
  }

  // Fetch remaining pages
  const maxPage = limit ? Math.min(totalPages, Math.ceil(limit / PAGE_SIZE)) : totalPages;
  for (let page = 2; page <= maxPage; page++) {
    sleep(RATE_LIMIT_MS);
    try {
      const result = fetchSearchPage(session, page);
      allLaws.push(...result.laws);

      if (result.newToken) {
        session.token = result.newToken;
      }

      if (page % 5 === 0 || page === maxPage) {
        console.log(`  Page ${page}/${maxPage}: +${result.laws.length} (total: ${allLaws.length})`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  Page ${page} failed: ${msg}`);
      // Re-acquire session and retry once
      try {
        console.log('  Re-acquiring session...');
        const newSession = getSession();
        session.token = newSession.token;
        session.cookieFile = newSession.cookieFile;
        sleep(2000);
        const retry = fetchSearchPage(session, page);
        allLaws.push(...retry.laws);
        if (retry.newToken) session.token = retry.newToken;
        console.log(`  Page ${page} retry OK: +${retry.laws.length}`);
      } catch {
        console.error(`  Page ${page} retry also failed, skipping`);
      }
    }
  }

  console.log(`\n  Total scraped: ${allLaws.length} laws\n`);

  if (dryRun) {
    console.log('  --dry-run: not writing census');
    return;
  }

  // Step 3: Build census entries
  console.log('  [3/3] Building census...');
  const seenIds = new Set<string>();
  const censusLaws: CensusLawEntry[] = [];

  // Add Constitution first
  const constitutionId = 'constitution-2002';
  const existingConst = existingEntries.get(constitutionId);
  censusLaws.push({
    id: constitutionId,
    title: 'دستور مملكة البحرين 2002',
    title_en: 'Constitution of the Kingdom of Bahrain 2002',
    identifier: 'constitution/2002',
    url: `${PORTAL_BASE}/Legislation/HTM/S0102`,
    url_en: `${PORTAL_BASE}/FullEn/S0102.docx`,
    htm_code: 'S0102',
    status: 'in_force',
    category: 'constitution',
    classification: 'ingestable',
    ingested: existingConst?.ingested ?? false,
    provision_count: existingConst?.provision_count ?? 0,
    ingestion_date: existingConst?.ingestion_date ?? null,
    year: 2002,
    number: null,
  });
  seenIds.add(constitutionId);

  // Process scraped laws
  for (const law of allLaws) {
    const { year, number: num } = extractYearAndNumber(law.title);
    const category = categorize(law.htmCode, law.title);
    let id = generateId(law.htmCode, law.title, year, num);

    // Avoid duplicates
    if (seenIds.has(id)) {
      id = `${id}-${law.htmCode.toLowerCase()}`;
      if (seenIds.has(id)) continue;
    }
    seenIds.add(id);

    // Preserve existing ingestion state
    const existing = existingEntries.get(id) ?? existingByHtm.get(law.htmCode);

    censusLaws.push({
      id,
      title: law.title,
      title_en: law.enTitle || existing?.title_en || '',
      identifier: buildIdentifier(category, year, num),
      url: `${PORTAL_BASE}/Legislation/HTM/${law.htmCode}`,
      url_en: `${PORTAL_BASE}/FullEn/${law.htmCode}.docx`,
      htm_code: law.htmCode,
      status: 'in_force',
      category,
      classification: 'ingestable',
      ingested: existing?.ingested ?? false,
      provision_count: existing?.provision_count ?? 0,
      ingestion_date: existing?.ingestion_date ?? null,
      year,
      number: num,
    });
  }

  // Apply limit
  const finalLaws = limit ? censusLaws.slice(0, limit) : censusLaws;

  const today = new Date().toISOString().split('T')[0];

  const census: CensusFile = {
    schema_version: '2.0',
    jurisdiction: 'BH',
    jurisdiction_name: 'Bahrain',
    portal: PORTAL_BASE,
    census_date: today,
    agent: 'claude-opus-4-6',
    summary: {
      total_laws: finalLaws.length,
      ingestable: finalLaws.filter(l => l.classification === 'ingestable').length,
      ocr_needed: 0,
      inaccessible: finalLaws.filter(l => l.classification === 'inaccessible').length,
      excluded: finalLaws.filter(l => l.classification === 'excluded').length,
    },
    laws: finalLaws.sort((a, b) => {
      const yearDiff = (b.year ?? 0) - (a.year ?? 0);
      if (yearDiff !== 0) return yearDiff;
      return (b.number ?? 0) - (a.number ?? 0);
    }),
  };

  fs.mkdirSync(path.dirname(CENSUS_PATH), { recursive: true });
  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));

  // Report
  const categories = new Map<string, number>();
  for (const law of finalLaws) {
    categories.set(law.category, (categories.get(law.category) ?? 0) + 1);
  }

  console.log('\n=========================');
  console.log('Census Complete');
  console.log(`  Total laws:     ${finalLaws.length}`);
  console.log(`  Ingestable:     ${census.summary.ingestable}`);
  console.log(`  Already ingested: ${finalLaws.filter(l => l.ingested).length}`);
  console.log('  By category:');
  for (const [cat, count] of Array.from(categories.entries()).sort()) {
    console.log(`    ${cat}: ${count}`);
  }
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

main();

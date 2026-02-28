/**
 * Bahrain Law HTML Parser
 *
 * Parses legislation pages from legalaffairs.gov.bh.
 * Bahrain laws use Word-generated HTML (MsoNormal classes) with:
 *   - "المادة" (al-madda) or "مادة" (madda) for articles (in parentheses for some laws)
 *   - "الباب" (al-bab) for chapters
 *   - "الفصل" (al-fasl) for sections within chapters
 *
 * The portal serves both Arabic and English versions.
 * URL pattern: /Legislation/HTM/[CODE] (Arabic), /FullEn/[CODE].docx (English)
 *
 * Source: legalaffairs.gov.bh (Legislation and Legal Opinion Commission)
 */

export interface ActIndexEntry {
  id: string;
  title: string;
  titleEn: string;
  shortName: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issuedDate: string;
  inForceDate: string;
  url: string;
  aknYear?: string;
  aknNumber?: string;
  description?: string;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedAct {
  id: string;
  type: 'statute';
  title: string;
  title_en: string;
  short_name: string;
  status: string;
  issued_date: string;
  in_force_date: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

/* ---------- Helpers ---------- */

function toAsciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, ch => String(ch.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, ch => String(ch.charCodeAt(0) - 1776));
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)));
}

function stripTags(input: string): string {
  return input.replace(/<[^>]+>/g, ' ');
}

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
  return normalizeWhitespace(stripTags(decodeHtmlEntities(withBreaks)));
}

function parseArticleNumber(heading: string, fallbackIndex: number): string {
  const ascii = toAsciiDigits(heading);
  // Match "مادة (5)" or "المادة 5" or "المادة الخامسة"
  const numericMatch = ascii.match(/(\d+)/);
  if (numericMatch) return String(parseInt(numericMatch[1], 10));
  return String(fallbackIndex);
}

/**
 * Parse Bahraini legislation HTML.
 * Bahrain uses "المادة" or "مادة" for articles.
 * Some newer laws use "مادة (N)" format in parentheses.
 */
export function parseBahrainLawHtml(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  const fullText = htmlToText(html);

  // Match both "المادة N" and "مادة (N)" formats
  const articlePattern = /(?:^|\n)\s*((?:المادة|مادة)\s*[\(]?\s*(?:\d+|[٠-٩]+|[\u0600-\u06FF\s]+?)\s*[\)]?)\s*[:\-–—]?\s*/g;
  const articleStarts: { heading: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = articlePattern.exec(fullText)) !== null) {
    articleStarts.push({ heading: normalizeWhitespace(match[1]), index: match.index });
  }

  let currentChapter: string | undefined;
  const chapterPattern = /(?:^|\n)\s*((?:الباب|الفصل)\s+(?:\d+|[٠-٩]+|[\u0600-\u06FF\s]+?))\s*[:\-–—]?\s*/g;
  const chapterPositions: { chapter: string; index: number }[] = [];

  while ((match = chapterPattern.exec(fullText)) !== null) {
    chapterPositions.push({ chapter: normalizeWhitespace(match[1]), index: match.index });
  }

  for (let i = 0; i < articleStarts.length; i++) {
    const start = articleStarts[i];
    const endIndex = i + 1 < articleStarts.length ? articleStarts[i + 1].index : fullText.length;
    const articleText = fullText.substring(start.index, endIndex).trim();
    const articleNum = parseArticleNumber(start.heading, i + 1);

    for (const cp of chapterPositions) {
      if (cp.index <= start.index) currentChapter = cp.chapter;
    }

    const headingEnd = articleText.indexOf('\n');
    const content = headingEnd > 0
      ? normalizeWhitespace(articleText.substring(headingEnd))
      : normalizeWhitespace(articleText.replace(start.heading, ''));

    if (content.length < 10) continue;

    provisions.push({
      provision_ref: `art${articleNum}`,
      chapter: currentChapter,
      section: articleNum,
      title: start.heading,
      content: content.substring(0, 12000),
    });

    if (parseInt(articleNum) <= 3) {
      extractDefinitions(content, `art${articleNum}`, definitions);
    }
  }

  return {
    id: act.id, type: 'statute',
    title: act.title, title_en: act.titleEn,
    short_name: act.shortName, status: act.status,
    issued_date: act.issuedDate, in_force_date: act.inForceDate,
    url: act.url, description: act.description,
    provisions, definitions,
  };
}

function extractDefinitions(text: string, sourceProvision: string, definitions: ParsedDefinition[]): void {
  const seenTerms = new Set<string>();
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;
    const sepIndex = trimmed.indexOf(':');
    const dashIndex = trimmed.indexOf(' - ');
    const idx = sepIndex > 0 && sepIndex < 80 ? sepIndex : dashIndex > 0 && dashIndex < 80 ? dashIndex : -1;
    if (idx < 0) continue;
    const term = normalizeWhitespace(trimmed.substring(0, idx).replace(/^[-\u2022\u2013\u2014*]/g, ''));
    const definition = normalizeWhitespace(trimmed.substring(idx + 1));
    if (term.length < 2 || term.length > 120 || definition.length < 8) continue;
    if (seenTerms.has(term.toLowerCase())) continue;
    seenTerms.add(term.toLowerCase());
    definitions.push({ term, definition, source_provision: sourceProvision });
  }
}

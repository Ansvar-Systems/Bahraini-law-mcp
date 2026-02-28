/**
 * Bahrain Law HTML Parser
 *
 * Parses legislation pages from legalaffairs.gov.bh.
 *
 * Bahrain laws are Word-generated HTML (MsoNormal classes) with specific patterns:
 *
 * ARTICLE HEADINGS:
 *   Pattern 1 (most common): Article heading split across two paragraphs:
 *     <p>...مادة...</p>    (standalone "مادة" or "المادة")
 *     <p>...(N)...</p>     (article number in next paragraph)
 *
 *   Pattern 2: Article heading in one paragraph:
 *     <p>...المادة (N)...</p>  or  <p>...مادة (N)...</p>
 *
 *   Pattern 3 (Gulf convention): "مادة N" without parentheses
 *
 * STRUCTURAL HEADINGS:
 *   - "الباب" (al-bab) = Book/Part
 *   - "الفصل" (al-fasl) = Chapter/Section
 *   - "الكتاب" (al-kitab) = Book (rarely used)
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
    .replace(/[\u200E\u200F\u202A-\u202E\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u0640/g, '')  // Strip tatweel/kashida (ـ)
    .replace(/\s+/g, ' ')
    .trim();
}

function paragraphToText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
  return normalizeWhitespace(stripTags(decodeHtmlEntities(withBreaks)));
}

/**
 * Split HTML into individual paragraph blocks.
 * Each block is the text content of a <p>...</p>.
 */
function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = [];
  const pPattern = /<p[^>]*>(.*?)<\/p>/gis;
  let match: RegExpExecArray | null;
  while ((match = pPattern.exec(html)) !== null) {
    const text = normalizeWhitespace(stripTags(decodeHtmlEntities(match[1])));
    if (text.length > 0) {
      paragraphs.push(text);
    }
  }
  return paragraphs;
}

/**
 * Check if a paragraph is a standalone article heading.
 * Returns true for paragraphs that are just "مادة" or "المادة" with no other content.
 * Also handles tatweel-extended forms like "مـــادة".
 */
function isStandaloneArticleHeading(text: string): boolean {
  // Strip tatweels (kashida), spaces, and punctuation
  const cleaned = text.replace(/[\u0640\s:\-–—*]/g, '');
  return cleaned === 'المادة' || cleaned === 'مادة';
}

/**
 * Check if a paragraph starts with an article number like "(N)" or "( N )".
 */
function extractLeadingArticleNumber(text: string): number | null {
  const ascii = toAsciiDigits(text.trim());
  const match = ascii.match(/^\s*[\((\u0028]\s*(\d+)\s*[\))\u0029]/);
  if (match) return parseInt(match[1], 10);
  return null;
}

/**
 * Check if a paragraph is an inline article heading like "المادة (5)" or "مادة 5" or "مادة ( 5 )".
 * Also handles ordinal issuing articles like "المادة الأولى" (returns null for those).
 */
function extractInlineArticleNumber(text: string): number | null {
  const ascii = toAsciiDigits(text.replace(/\u0640/g, '').trim());
  // "المادة (N)" or "مادة (N)" at the start
  const match = ascii.match(/^(?:المادة|مادة)\s*[\((\u0028]?\s*(\d+)\s*[\))\u0029]?/);
  if (match) return parseInt(match[1], 10);
  return null;
}

/**
 * Check if a paragraph is a structural heading (باب, فصل, كتاب).
 */
function extractChapterHeading(text: string): string | null {
  const ascii = toAsciiDigits(text.trim());
  // Match "الباب الأول" or "الفصل الثاني" or "الكتاب الأول"
  // Also match "الباب 1" or "الفصل 2"
  const match = ascii.match(/^((?:الباب|الفصل|الكتاب)\s+(?:\d+|[\u0600-\u06FF\s]+?))\s*[:\-–—]?\s*(.*)/);
  if (match) {
    const heading = normalizeWhitespace(match[1]);
    const subtitle = normalizeWhitespace(match[2] ?? '');
    return subtitle ? `${heading} - ${subtitle}` : heading;
  }
  return null;
}

/**
 * Parse Bahraini legislation HTML using paragraph-level analysis.
 *
 * The key insight is that Bahrain laws from legalaffairs.gov.bh use Word-generated
 * HTML where article headings are often split across two paragraphs:
 *   <p>مادة</p>
 *   <p>(5)</p>
 *   <p>...article content...</p>
 *
 * This parser processes paragraphs sequentially and detects this pattern.
 */
export function parseBahrainLawHtml(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  const paragraphs = extractParagraphs(html);

  if (paragraphs.length === 0) {
    // Fallback: try plain text parsing
    return parsePlainText(html, act);
  }

  // First pass: identify article boundaries
  interface ArticleBoundary {
    articleNum: number;
    contentStartIdx: number; // first paragraph of content
    chapterAtStart?: string;
  }

  const articles: ArticleBoundary[] = [];
  let currentChapter: string | undefined;
  let i = 0;

  while (i < paragraphs.length) {
    const text = paragraphs[i];

    // Check for chapter/section heading
    const chapterHeading = extractChapterHeading(text);
    if (chapterHeading) {
      currentChapter = chapterHeading;
      i++;
      continue;
    }

    // Pattern 1: Standalone "مادة" followed by "(N)" in next paragraph
    if (isStandaloneArticleHeading(text) && i + 1 < paragraphs.length) {
      const nextText = paragraphs[i + 1];
      const artNum = extractLeadingArticleNumber(nextText);
      if (artNum !== null) {
        articles.push({
          articleNum: artNum,
          contentStartIdx: i + 1, // content starts from the number paragraph
          chapterAtStart: currentChapter,
        });
        i += 2;
        continue;
      }
    }

    // Pattern 2: Inline "المادة (N)" or "مادة (N)"
    const inlineNum = extractInlineArticleNumber(text);
    if (inlineNum !== null && text.length < 80) {
      // Short paragraph that's just the article heading
      articles.push({
        articleNum: inlineNum,
        contentStartIdx: i + 1,
        chapterAtStart: currentChapter,
      });
      i++;
      continue;
    }

    // Pattern 3: "المادة (N)" at start of a longer paragraph (heading + content in one)
    if (inlineNum !== null && text.length >= 80) {
      articles.push({
        articleNum: inlineNum,
        contentStartIdx: i, // content includes this paragraph
        chapterAtStart: currentChapter,
      });
      i++;
      continue;
    }

    i++;
  }

  // Second pass: extract content for each article
  for (let a = 0; a < articles.length; a++) {
    const art = articles[a];
    const nextStart = a + 1 < articles.length
      ? articles[a + 1].contentStartIdx - (isStandaloneArticleHeading(paragraphs[articles[a + 1].contentStartIdx - 1] ?? '') ? 2 : 1)
      : paragraphs.length;

    // Collect content paragraphs
    const contentParts: string[] = [];
    for (let p = art.contentStartIdx; p < nextStart; p++) {
      const pText = paragraphs[p];
      // Skip if this is a chapter heading
      if (extractChapterHeading(pText)) continue;
      // Skip if this is another article heading (shouldn't happen but safety check)
      if (isStandaloneArticleHeading(pText)) break;
      contentParts.push(pText);
    }

    // First paragraph might contain the article number - strip it
    if (contentParts.length > 0) {
      const first = contentParts[0];
      const leadNum = extractLeadingArticleNumber(first);
      if (leadNum !== null) {
        // Strip the "(N)" prefix from content
        const ascii = toAsciiDigits(first);
        const stripped = ascii.replace(/^\s*[\((\u0028]\s*\d+\s*[\))\u0029]\s*/, '').trim();
        contentParts[0] = stripped;
      }
      // Also strip inline article heading from content
      const inNum = extractInlineArticleNumber(first);
      if (inNum !== null) {
        const ascii = toAsciiDigits(first);
        const stripped = ascii.replace(/^(?:المادة|مادة)\s*[\((\u0028]?\s*\d+\s*[\))\u0029]?\s*[:\-–—]?\s*/, '').trim();
        contentParts[0] = stripped;
      }
    }

    const content = contentParts.filter(p => p.length > 0).join('\n');

    if (content.length < 5) continue;

    const artRef = `art${art.articleNum}`;
    provisions.push({
      provision_ref: artRef,
      chapter: art.chapterAtStart,
      section: String(art.articleNum),
      title: `المادة ${art.articleNum}`,
      content: content.substring(0, 15000),
    });

    // Extract definitions from early articles (typically art1 or art2)
    if (art.articleNum <= 3) {
      extractDefinitions(content, artRef, definitions);
    }
  }

  return {
    id: act.id,
    type: 'statute',
    title: act.title,
    title_en: act.titleEn,
    short_name: act.shortName,
    status: act.status,
    issued_date: act.issuedDate,
    in_force_date: act.inForceDate,
    url: act.url,
    description: act.description,
    provisions,
    definitions,
  };
}

/**
 * Fallback: parse from plain text when HTML paragraph extraction fails.
 * This handles cases where the HTML structure is non-standard.
 */
function parsePlainText(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  const fullText = paragraphToText(html);

  // Match article patterns in plain text
  const articlePattern = /(?:^|\n)\s*((?:المادة|مادة)\s*[\(]?\s*(?:\d+|[٠-٩]+)\s*[\)]?)\s*[:\-–—]?\s*/g;
  const articleStarts: { heading: string; index: number; num: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = articlePattern.exec(fullText)) !== null) {
    const ascii = toAsciiDigits(match[1]);
    const numMatch = ascii.match(/(\d+)/);
    if (numMatch) {
      articleStarts.push({
        heading: normalizeWhitespace(match[1]),
        index: match.index,
        num: parseInt(numMatch[1], 10),
      });
    }
  }

  // Track chapters
  let currentChapter: string | undefined;
  const chapterPattern = /(?:^|\n)\s*((?:الباب|الفصل|الكتاب)\s+(?:\d+|[٠-٩]+|[\u0600-\u06FF\s]+?))\s*[:\-–—]?\s*/g;
  const chapterPositions: { chapter: string; index: number }[] = [];

  while ((match = chapterPattern.exec(fullText)) !== null) {
    chapterPositions.push({ chapter: normalizeWhitespace(match[1]), index: match.index });
  }

  for (let i = 0; i < articleStarts.length; i++) {
    const start = articleStarts[i];
    const endIndex = i + 1 < articleStarts.length ? articleStarts[i + 1].index : fullText.length;
    const articleText = fullText.substring(start.index, endIndex).trim();

    for (const cp of chapterPositions) {
      if (cp.index <= start.index) currentChapter = cp.chapter;
    }

    const headingEnd = articleText.indexOf('\n');
    const content = headingEnd > 0
      ? normalizeWhitespace(articleText.substring(headingEnd))
      : normalizeWhitespace(articleText.replace(start.heading, ''));

    if (content.length < 10) continue;

    const artRef = `art${start.num}`;
    provisions.push({
      provision_ref: artRef,
      chapter: currentChapter,
      section: String(start.num),
      title: `المادة ${start.num}`,
      content: content.substring(0, 15000),
    });

    if (start.num <= 3) {
      extractDefinitions(content, artRef, definitions);
    }
  }

  return {
    id: act.id,
    type: 'statute',
    title: act.title,
    title_en: act.titleEn,
    short_name: act.shortName,
    status: act.status,
    issued_date: act.issuedDate,
    in_force_date: act.inForceDate,
    url: act.url,
    description: act.description,
    provisions,
    definitions,
  };
}

function extractDefinitions(text: string, sourceProvision: string, definitions: ParsedDefinition[]): void {
  const seenTerms = new Set<string>();
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;
    // Look for "term: definition" or "term - definition" patterns
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

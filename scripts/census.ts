#!/usr/bin/env tsx
/**
 * Bahrain Law MCP -- Census Script
 *
 * Enumerates key Bahraini laws. Bahrain uses a civil law system.
 * Source: legalaffairs.gov.bh (Legislation and Legal Opinion Commission)
 *
 * The portal has structured HTML pages for laws at /Legislation/HTM/[CODE]
 * URL pattern: K=law, D=decree-law, O=royal order, R=resolution
 *
 * Bahraini law references:
 *   - "مرسوم بقانون رقم XX لسنة YYYY" = Decree-Law No. XX of Year YYYY
 *   - "قانون رقم XX لسنة YYYY" = Law No. XX of Year YYYY
 *
 * Bahrain has English translations for many laws.
 *
 * License: Government Publication
 *
 * Usage:
 *   npx tsx scripts/census.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');

/* ---------- Types ---------- */

interface CensusLawEntry {
  id: string;
  title: string;
  identifier: string;
  url: string;
  status: 'in_force' | 'amended' | 'repealed';
  category: 'act';
  classification: 'ingestable' | 'excluded' | 'inaccessible';
  ingested: boolean;
  provision_count: number;
  ingestion_date: string | null;
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

interface LawDescriptor {
  id: string;
  title: string;
  identifier: string;
  url: string;
  status: 'in_force' | 'amended' | 'repealed';
}

const BAHRAINI_LAWS: LawDescriptor[] = [
  // Constitution
  {
    id: 'constitution-2002',
    title: 'دستور مملكة البحرين 2002',
    identifier: 'constitution/2002',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/S0102',
    status: 'in_force',
  },
  // PDPL (Personal Data Protection Law)
  {
    id: 'pdpl-2018',
    title: 'قانون رقم 30 لسنة 2018 بشأن حماية البيانات الشخصية',
    identifier: 'qanun/2018/30',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K3018',
    status: 'in_force',
  },
  // Cybercrime
  {
    id: 'cybercrime-2014',
    title: 'مرسوم بقانون رقم 60 لسنة 2014 بشأن جرائم تقنية المعلومات',
    identifier: 'marsoom/2014/60',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D6014',
    status: 'in_force',
  },
  // Telecommunications
  {
    id: 'telecom-2002',
    title: 'مرسوم بقانون رقم 48 لسنة 2002 بشأن الاتصالات',
    identifier: 'marsoom/2002/48',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D4802',
    status: 'amended',
  },
  // E-Transactions
  {
    id: 'etransactions-2014',
    title: 'مرسوم بقانون رقم 54 لسنة 2018 بشأن المعاملات الإلكترونية',
    identifier: 'marsoom/2018/54',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D5418',
    status: 'in_force',
  },
  // Commercial Companies
  {
    id: 'companies-2001',
    title: 'مرسوم بقانون رقم 21 لسنة 2001 بشأن الشركات التجارية',
    identifier: 'marsoom/2001/21',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D2101',
    status: 'amended',
  },
  // Central Bank
  {
    id: 'central-bank-2006',
    title: 'مرسوم بقانون رقم 64 لسنة 2006 بشأن مصرف البحرين المركزي',
    identifier: 'marsoom/2006/64',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D6406',
    status: 'in_force',
  },
  // AML
  {
    id: 'aml-2001',
    title: 'مرسوم بقانون رقم 4 لسنة 2001 بشأن حظر ومكافحة غسل الأموال وتمويل الإرهاب',
    identifier: 'marsoom/2001/4',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D0401',
    status: 'amended',
  },
  // Consumer Protection
  {
    id: 'consumer-protection-2012',
    title: 'قانون رقم 35 لسنة 2012 بشأن حماية المستهلك',
    identifier: 'qanun/2012/35',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K3512',
    status: 'in_force',
  },
  // Labor Law
  {
    id: 'labor-2012',
    title: 'قانون رقم 36 لسنة 2012 بشأن إصدار قانون العمل في القطاع الأهلي',
    identifier: 'qanun/2012/36',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K3612',
    status: 'in_force',
  },
  // Competition
  {
    id: 'competition-2018',
    title: 'قانون رقم 31 لسنة 2018 بشأن حماية المنافسة',
    identifier: 'qanun/2018/31',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K3118',
    status: 'in_force',
  },
  // Penal Code
  {
    id: 'penal-code-1976',
    title: 'مرسوم بقانون رقم 15 لسنة 1976 بشأن إصدار قانون العقوبات',
    identifier: 'marsoom/1976/15',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D1576',
    status: 'amended',
  },
  // Tax on MNEs 2024
  {
    id: 'mne-tax-2024',
    title: 'مرسوم بقانون رقم 11 لسنة 2024 بشأن الضريبة على المنشآت متعددة الجنسيات',
    identifier: 'marsoom/2024/11',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/L1124',
    status: 'in_force',
  },
  // BICC (Bahrain International Commercial Court)
  {
    id: 'bicc-2024',
    title: 'مرسوم بقانون رقم 9 لسنة 2024 بشأن محكمة البحرين الدولية التجارية',
    identifier: 'marsoom/2024/9',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/L0924',
    status: 'in_force',
  },
  // Investment
  {
    id: 'investment-2017',
    title: 'قانون رقم 22 لسنة 2017 بشأن تنظيم بيئة الأعمال',
    identifier: 'qanun/2017/22',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K2217',
    status: 'in_force',
  },
  // IP / Trademarks
  {
    id: 'trademarks-2006',
    title: 'قانون رقم 11 لسنة 2006 بشأن العلامات التجارية',
    identifier: 'qanun/2006/11',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K1106',
    status: 'in_force',
  },
  // Evidence law
  {
    id: 'evidence-2022',
    title: 'مرسوم بقانون رقم 18 لسنة 2022 بشأن قانون الإثبات',
    identifier: 'marsoom/2022/18',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D1822',
    status: 'in_force',
  },
  // Press and publications
  {
    id: 'press-2002',
    title: 'مرسوم بقانون رقم 47 لسنة 2002 بشأن تنظيم الصحافة والطباعة والنشر',
    identifier: 'marsoom/2002/47',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D4702',
    status: 'in_force',
  },
  // Health insurance
  {
    id: 'health-insurance-2018',
    title: 'قانون رقم 23 لسنة 2018 بشأن الضمان الصحي',
    identifier: 'qanun/2018/23',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/K2318',
    status: 'in_force',
  },
  // Environmental law
  {
    id: 'environment-1996',
    title: 'مرسوم بقانون رقم 21 لسنة 1996 بشأن البيئة',
    identifier: 'marsoom/1996/21',
    url: 'https://www.legalaffairs.gov.bh/Legislation/HTM/D2196',
    status: 'amended',
  },
];

/* ---------- Main ---------- */

async function main(): Promise<void> {
  console.log('Bahrain Law MCP -- Census');
  console.log('=========================\n');
  console.log('  Source: legalaffairs.gov.bh (Legislation and Legal Opinion Commission)');
  console.log('  Method: Curated law list');
  console.log(`  Laws: ${BAHRAINI_LAWS.length}\n`);

  const existingEntries = new Map<string, CensusLawEntry>();
  if (fs.existsSync(CENSUS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8')) as CensusFile;
      for (const law of data.laws) {
        if ('ingested' in law && 'url' in law) existingEntries.set(law.id, law);
      }
      console.log(`  Loaded ${existingEntries.size} existing entries\n`);
    } catch { /* Start fresh */ }
  }

  for (const law of BAHRAINI_LAWS) {
    const existing = existingEntries.get(law.id);
    existingEntries.set(law.id, {
      id: law.id, title: law.title, identifier: law.identifier, url: law.url,
      status: law.status, category: 'act', classification: 'ingestable',
      ingested: existing?.ingested ?? false, provision_count: existing?.provision_count ?? 0,
      ingestion_date: existing?.ingestion_date ?? null,
    });
  }

  const allLaws = Array.from(existingEntries.values()).sort((a, b) => a.title.localeCompare(b.title));
  const today = new Date().toISOString().split('T')[0];

  const census: CensusFile = {
    schema_version: '1.0', jurisdiction: 'BH', jurisdiction_name: 'Bahrain',
    portal: 'https://www.legalaffairs.gov.bh', census_date: today, agent: 'claude-opus-4-6',
    summary: {
      total_laws: allLaws.length,
      ingestable: allLaws.filter(l => l.classification === 'ingestable').length,
      ocr_needed: 0, inaccessible: 0, excluded: 0,
    },
    laws: allLaws,
  };

  fs.mkdirSync(path.dirname(CENSUS_PATH), { recursive: true });
  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));

  console.log('=========================');
  console.log('Census Complete');
  console.log(`  Total laws:     ${allLaws.length}`);
  console.log(`  Ingestable:     ${census.summary.ingestable}`);
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

main().catch(error => { console.error('Fatal error:', error); process.exit(1); });

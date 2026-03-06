# Bahraini Law MCP Server

**The Bahrain Legislation Portal alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fbahraini-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/bahraini-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Bahraini-law-mcp?style=social)](https://github.com/Ansvar-Systems/Bahraini-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Bahraini-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Bahraini-law-mcp/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/Bahraini-law-mcp/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/Bahraini-law-mcp/actions/workflows/check-updates.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](https://github.com/Ansvar-Systems/Bahraini-law-mcp)
[![Provisions](https://img.shields.io/badge/provisions-14%2C506-blue)](https://github.com/Ansvar-Systems/Bahraini-law-mcp)

Query **1,622 Bahraini laws** -- from Personal Data Protection Law No. 30 of 2018 and the Penal Code to the Labour Law for the Private Sector, Commercial Companies Law, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Bahraini legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Bahraini legal research means navigating legislation.gov.bh, the Ministry of Justice and Islamic Affairs portal (moj.gov.bh), and the Legal Affairs Directorate (legalaffairs.gov.bh). Whether you're:

- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking obligations under the Personal Data Protection Law or the Financial Institutions Law
- A **legal tech developer** building tools on Bahraini law
- A **researcher** tracing legislative provisions across royal decrees and law articles

...you shouldn't need dozens of browser tabs and manual PDF cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Bahraini law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://bahraini-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add bahraini-law --transport http https://bahraini-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bahraini-law": {
      "type": "url",
      "url": "https://bahraini-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "bahraini-law": {
      "type": "http",
      "url": "https://bahraini-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/bahraini-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bahraini-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/bahraini-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "bahraini-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/bahraini-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"What does Personal Data Protection Law No. 30 of 2018 say about data subject rights?"*
- *"Find provisions in the Penal Code about financial fraud and forgery"*
- *"What does the Labour Law for the Private Sector say about termination and end-of-service benefits?"*
- *"Search for company formation requirements under the Commercial Companies Law"*
- *"Is Legislative Decree No. 48 of 2010 (Financial Institutions Law) still in force?"*
- *"Find provisions about anti-money laundering under Decree-Law No. 4 of 2001"*
- *"Build a legal stance on data protection obligations for financial institutions in Bahrain"*
- *"Validate the citation 'Article 5 of Law No. 30 of 2018'"*

**In Arabic (العربية):**

- *"البحث عن أحكام حماية البيانات الشخصية في القانون رقم 30 لسنة 2018"*
  (Search for personal data protection provisions in Law No. 30 of 2018)
- *"ما الذي يقوله قانون العمل في القطاع الأهلي عن إنهاء الخدمة؟"*
  (What does the Labour Law for the Private Sector say about end of service?)
- *"البحث عن أحكام الشركات التجارية في قانون الشركات التجارية"*
  (Search for provisions on commercial companies in the Commercial Companies Law)

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Laws / Decrees** | 1,622 | Royal decrees, law-decrees, and ministerial orders |
| **Provisions** | 14,506 sections | Full-text searchable with FTS5 (Arabic and English) |
| **Legal Definitions** | Included | Extracted from law texts |
| **Database Size** | ~26 MB | Optimized SQLite, portable |
| **Freshness Checks** | Automated | Monitoring against legalaffairs.gov.bh |

**Verified data only** -- every citation is validated against official sources (legalaffairs.gov.bh, legislation.gov.bh). Zero LLM-generated content.

---

## Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from legalaffairs.gov.bh (Legal Affairs Directorate, Kingdom of Bahrain) and legislation.gov.bh
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains law text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by law number and article
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
legalaffairs.gov.bh / legislation.gov.bh --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                                               ^                        ^
                                        Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search legalaffairs.gov.bh by decree number | Search by plain language: *"data protection consent"* |
| Navigate multi-article decrees manually | Get the exact provision with context |
| Manual cross-referencing between laws | `build_legal_stance` aggregates across sources |
| "Is this decree still in force?" --> check manually | `check_currency` tool --> answer in seconds |
| Find GCC/Arab League alignment --> dig through frameworks | `get_eu_basis` --> linked frameworks instantly |
| No API, no integration | MCP protocol --> AI-native |

**Traditional:** Search legislation.gov.bh --> Download PDF --> Ctrl+F --> Cross-reference royal decrees --> Check Official Gazette for amendments --> Repeat

**This MCP:** *"What are the data controller obligations under Law No. 30 of 2018 and how do they align with GCC data protection frameworks?"* --> Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 14,506 provisions with BM25 ranking. Supports Arabic and English queries, quoted phrases, boolean operators |
| `get_provision` | Retrieve specific provision by law number and article (e.g., "Law No. 30 of 2018" + "Article 5") |
| `check_currency` | Check if a law or decree is in force, amended, or repealed |
| `validate_citation` | Validate citation against database -- zero-hallucination check. Supports "Article 5 Law No. 30/2018", "Decree-Law No. 48/2010 Art. 12" |
| `build_legal_stance` | Aggregate citations from multiple laws for a legal topic |
| `format_citation` | Format citations per Bahraini conventions (full/short/pinpoint) |
| `list_sources` | List all available laws with metadata, coverage scope, and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get international frameworks (GCC, Arab League) that a Bahraini law aligns with |
| `get_bahraini_implementations` | Find Bahraini laws implementing a specific international framework or convention |
| `search_eu_implementations` | Search international documents with Bahraini alignment counts |
| `get_provision_eu_basis` | Get international law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Bahraini laws against international standards |

---

## International Law Alignment

Bahrain is not an EU member state. Bahraini law develops through its own constitutional and legislative framework (Council of Representatives and Shura Council), with international alignment through:

- **GCC (Gulf Cooperation Council)** -- GCC Unified Economic Agreement; GCC frameworks on cybercrime, e-commerce, and digital economy; GCC Data Protection Model Law
- **Arab League** -- Arab Anti-Cybercrime Agreement; League of Arab States frameworks on cross-border data flows and digital governance
- **UN Conventions** -- UNCAC (anti-corruption), UNCRPD, and international human rights instruments
- **FATF** -- Bahrain is a FATF member; Financial Action Task Force frameworks on AML/CFT

The international bridge tools allow you to explore these alignment relationships -- checking which Bahraini provisions correspond to GCC or Arab League requirements, and vice versa.

> **Note:** International cross-references reflect alignment and framework relationships, not direct transposition. Bahrain develops its own legislative approach, and the alignment tools help identify where Bahraini and international law address similar domains.

---

## Data Sources & Freshness

All content is sourced from authoritative Bahraini legal databases:

- **[legalaffairs.gov.bh](https://www.legalaffairs.gov.bh/)** -- Legal Affairs Directorate, Kingdom of Bahrain (primary source)
- **[legislation.gov.bh](https://legislation.gov.bh/)** -- Official legislation portal, Ministry of Justice
- **[moj.gov.bh](https://www.moj.gov.bh/)** -- Ministry of Justice and Islamic Affairs

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Kingdom of Bahrain |
| **Primary source** | legalaffairs.gov.bh / legislation.gov.bh |
| **Languages** | Arabic (primary) and English |
| **Coverage** | 1,622 royal decrees, law-decrees, and ministerial orders |
| **Last ingested** | 2026-02-25 |

### Automated Freshness Checks

A [GitHub Actions workflow](.github/workflows/check-updates.yml) monitors data sources for changes:

| Check | Method |
|-------|--------|
| **Law amendments** | Drift detection against known provision anchors |
| **New decrees** | Comparison against source index |
| **Repealed instruments** | Status change detection |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from legalaffairs.gov.bh and legislation.gov.bh (Ministry of Justice, Kingdom of Bahrain). However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **International cross-references** reflect alignment relationships, not direct transposition
> - **Arabic-language versions are authoritative** -- English translations are provided for reference only; verify Arabic text against official publications for professional use

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment.

### Bar Association

For professional legal use in Bahrain, consult guidance from the **Bahrain Bar Society (جمعية المحامين البحرينية)** and the **Bahrain Bar Association** regarding professional obligations and confidentiality requirements.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Bahraini-law-mcp
cd Bahraini-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest              # Ingest laws from legalaffairs.gov.bh
npm run build:db            # Rebuild SQLite database
npm run drift:detect        # Run drift detection against anchors
npm run check-updates       # Check for amendments and new decrees
npm run census              # Generate coverage census
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries (Arabic and English)
- **Database Size:** ~26 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate across 1,622 laws

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

**70+ national law MCPs** covering Australia, Botswana, Brazil, Canada, Denmark, Ethiopia, France, Germany, India, Ireland, Japan, Kenya, Malawi, Netherlands, Nigeria, Norway, Saudi Arabia, Singapore, South Africa, Sweden, Switzerland, UAE, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion (Court of Cassation, High Civil Court, High Criminal Court)
- GCC framework cross-reference mapping
- Arabic full-text search optimization
- Historical law versions and amendment tracking
- Sharia court decisions and personal status law

---

## Roadmap

- [x] Core law database with FTS5 search (Arabic and English)
- [x] Full corpus ingestion (1,622 laws, 14,506 provisions)
- [x] International law alignment tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Court case law expansion (Court of Cassation)
- [ ] Historical law versions (amendment tracking)
- [ ] GCC cross-border regulatory cross-references
- [ ] Sharia personal status law coverage

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{bahraini_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Bahraini Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Bahraini-law-mcp},
  note = {1,622 Bahraini laws with 14,506 provisions sourced from legalaffairs.gov.bh}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Kingdom of Bahrain (public domain via legalaffairs.gov.bh)
- **International Framework Metadata:** GCC / Arab League / UN (public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool -- turns out everyone building for the Bahraini or GCC market has the same research frustrations.

So we're open-sourcing it. Navigating 1,622 royal decrees and law-decrees shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>

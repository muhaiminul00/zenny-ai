# Mermaid Flowchart Fix — Task Instructions

```
Task:      Fix 6 broken flowchart files in 02_Agent_Runtime_System/Flowcharts/
Status:    Root cause diagnosed and verified. Fix is mechanical.
Scope:     Syntax-only. No content, wording, or logic changes.
```

---

## Root Cause (Verified)

Six flowchart files fail to render. This was confirmed by actually parsing each file with Mermaid's own parser (not just checking bracket/fence balance, which had already passed and gave a false "will render" signal earlier).

**The exact bug:** Mermaid's flowchart grammar reserves `(` and `)` for node-shape syntax (e.g. `id(text)` creates a rounded node). When a node or edge label contains literal parentheses as part of the text and is **not wrapped in double quotes**, the parser breaks at that point and stops — which is why some files fail entirely while surrounding content looks fine.

**Rule going forward:** any node label (`{...}`, `[...]`, `(...)`) or edge label (`|...|`) that contains literal parentheses in its text MUST be wrapped in double quotes: `{"text (with parens)"}` not `{text (with parens)}`.

---

## Exact Fixes Required (8 total, across 6 files)

### 1. `Consultation_Archetype_Flow.md`
Line 15 (in the extracted mermaid block — verify against the actual file, line numbers may shift slightly with surrounding markdown):
```
BEFORE:
ScoreCheck -->|true| ScoreGate{Score tier?<br/>(scoring mechanism itself<br/>out of scope — Module 3 §3)}

AFTER:
ScoreCheck -->|true| ScoreGate{"Score tier?<br/>(scoring mechanism itself<br/>out of scope — Module 3 §3)"}
```

### 2. `Email_Manager_Flow.md`
Two lines:
```
BEFORE:
GateFail -->|Escalation failures present<br/>(3 or 4)| EscalatePath
GateFail -->|Only draft failures<br/>(1, 2, 5)| DraftPath

AFTER:
GateFail -->|"Escalation failures present<br/>(3 or 4)"| EscalatePath
GateFail -->|"Only draft failures<br/>(1, 2, 5)"| DraftPath
```

### 3. `Emergency_Archetype_Flow.md`
Line 27:
```
BEFORE:
Active -->|Yes| DIY{DIY request?<br/>('how do I fix this myself')}

AFTER:
Active -->|Yes| DIY{"DIY request?<br/>('how do I fix this myself')"}
```

### 4. `Escalation_Map.md`
Line 52:
```
BEFORE:
ReturnPath -->|Case 2: sensitive<br/>ongoing (refund dispute,<br/>legal, high-value negotiation)| StaysHuman[Human retains ownership —<br/>AI does not resume this thread]

AFTER:
ReturnPath -->|"Case 2: sensitive<br/>ongoing (refund dispute,<br/>legal, high-value negotiation)"| StaysHuman["Human retains ownership —<br/>AI does not resume this thread"]
```
Note: the target node `StaysHuman[...]` doesn't strictly need quotes (no parens in its own label), but quote it anyway for consistency and to prevent future edits from reintroducing the bug.

### 5. `Recovery_Engine_Flow.md`
Two lines:
```
BEFORE:
Suppressed{Customer opted out?<br/>Suppression record exists?<br/>(§5, incl. pre-record opt-out)}
...
LiveCheck --> StopCheck{Converted / Escalated /<br/>Closed / Opted-out /<br/>Spam-complaint (email)?}

AFTER:
Suppressed{"Customer opted out?<br/>Suppression record exists?<br/>(§5, incl. pre-record opt-out)"}
...
LiveCheck --> StopCheck{"Converted / Escalated /<br/>Closed / Opted-out /<br/>Spam-complaint (email)?"}
```

### 6. `Revenue_Agent_Flow.md`
Line 61:
```
BEFORE:
MapType --> ApplyResp[Apply matching (C) response]

AFTER:
MapType --> ApplyResp["Apply matching (C) response"]
```

---

## Critical Constraints

1. **Syntax-only fix.** Do not alter any wording, logic, node names, arrow directions, or content in any of the 6 files. The only change permitted is adding double quotes around the 8 labels listed above.

2. **Mermaid's parser stops at the first error per file.** The 8 fixes above were found by parsing each file and fixing/re-parsing iteratively is NOT what was done here — these were found via a targeted grep across each entire file for the unquoted-parenthesis pattern, which is comprehensive, not just "first error found." However, after applying these 8 fixes, **you must re-validate every file** (see Validation section below) in case the grep missed an edge case or a different Mermaid gotcha exists in one of these files beyond this specific pattern.

3. **Do not touch the other 8 flowchart files** (Appointment, Commerce, Core_Agent, Conversion_Engine, Data_Collection_Map, Engagement, Service_Routing_Map, Universal_Runtime_Flow) — these already parse correctly and were verified separately.

4. **Do not "improve" or "clean up" anything else** in these files while you're in there. This is a narrow, mechanical fix. Scope creep here risks introducing new errors into files that are otherwise correct.

---

## Validation Method (Required After Fixing)

Do not just eyeball bracket/fence balance — that check already passed once before and gave a false signal. Use an actual parser.

```bash
# From project root, in a scratch directory:
npm install mermaid jsdom --silent

# Extract each mermaid code block from the fixed .md files into standalone .mmd files,
# then parse-validate each one using mermaid's own parse() function via a small Node/JSDOM
# script (headless — no Chrome/browser rendering needed, avoids sandbox/network issues).
```

Node validation script pattern (adjust paths to match your file locations):

```javascript
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

async function main() {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({ startOnLoad: false });

  const files = fs.readdirSync('mermaid_test').filter(f => f.endsWith('.mmd'));
  let allPass = true;
  for (const f of files) {
    const content = fs.readFileSync(path.join('mermaid_test', f), 'utf8');
    try {
      await mermaid.parse(content);
      console.log(`PASS: ${f}`);
    } catch (e) {
      allPass = false;
      console.log(`FAIL: ${f}`);
      console.log(`  ${e.message.split('\n').slice(0,3).join(' | ')}`);
    }
  }
  if (!allPass) process.exit(1);
}
main();
```

All 14 flowchart files (the 6 fixed + the 8 already-passing) must show `PASS` before this task is considered complete.

---

## Deliverable

1. All 6 files fixed with the exact 8 quote-wraps listed above.
2. Validation output showing all 14 flowchart files pass real Mermaid parsing (not just bracket-balance checking).
3. A one-line completion note per file confirming no other content changed.

STOP after validation passes. Do not proceed to any other Phase 4 batch — this is an isolated, self-contained fix.

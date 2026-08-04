# Language Configuration Fix — Task Instructions

```
Task:      Fix incomplete language configuration structure in Step 1C
Status:    Approved design from architect — replaces the Batch 3 Round 4
           placeholder with a complete, unambiguous structure
Scope:     Single section replacement in Step 1C
```

---

## Why This Fix Is Needed

The placeholder added in Batch 3 Round 4 defined `language_mode: fixed | adaptive` and set the default to adaptive, but never defined a companion field for *which* language(s) either mode actually uses. This left two real gaps:

1. Fixed mode had no way to specify which single language to use.
2. Adaptive mode was ambiguously scoped — unclear whether it meant "any language the customer uses, unrestricted" (Adaptive-Open) or "any language from a defined list" (Adaptive-Bounded).

**Architect decision: Adaptive-Bounded.** Both modes now share one list — fixed mode uses exactly one language from it, adaptive mode matches the customer's language as long as it's in the list.

---

## The Fix

**Replace the entire language configuration block added in Batch 3 Round 4** (inside Step 1C, "What is loaded" section) with the following:

```markdown
**Language configuration:**
```
language_mode: fixed | adaptive
language_list: [array of supported languages, business-configured]

FIXED MODE:
  Agent uses exactly one language from language_list, regardless of what
  language the customer writes in. Which language is used is determined
  by language_list containing a single entry, or — if language_list has
  multiple entries but mode is fixed — the first/designated entry is
  used (business config specifies which one is primary in this case).

ADAPTIVE MODE:
  Agent detects the customer's language per message and matches it,
  but ONLY among the languages present in language_list. If the
  customer writes in a language not in language_list, the agent does
  not attempt to respond in that language — it falls back to the
  primary/default language in language_list and may note the
  limitation naturally, rather than guessing at an unsupported
  language.

  Code-mixed input (e.g., a customer mixing two configured languages
  in one message — "Banglish," Bangla-English mixing, or similar
  patterns in other language pairs) is matched by responding in the
  dominant/primary language the customer is using, maintaining a
  professional register. Full code-mixed generation (responding in
  the same mixed style back) is a harder implementation problem,
  platform-dependent (Voiceflow/Convocore NLU capability), and remains
  an open implementation detail — this section defines the
  configuration contract, not the detection algorithm.

DEFAULT (when a client does not specify language_mode):
  adaptive, bounded to whatever language_list is configured. If
  language_list itself is also unspecified, it defaults to a single
  entry matching the business's primary operating language (from
  Business Config), functioning identically to fixed mode with one
  language until the client configures additional languages.
```

**Example configurations:**
```
Single-language business (no multilingual need):
  language_mode: fixed
  language_list: ["English"]

Bangladesh-based business, adaptive within local languages:
  language_mode: adaptive
  language_list: ["Bangla", "English"]
  → Customer writes in Bangla → agent responds in Bangla
  → Customer writes in English → agent responds in English
  → Customer mixes both (Banglish) → agent responds in the dominant
    language of that message, professionally, per the code-mixed
    handling note above
  → Customer writes in Hindi (not in list) → agent falls back to
    the list's primary language, does not attempt Hindi

Multi-region business, broader adaptive list:
  language_mode: adaptive
  language_list: ["English", "Arabic", "Hindi", "Spanish"]
```

**What remains genuinely open (unchanged from before):** The precise
code-mixed-input *detection* mechanism (distinguishing which language
dominates a mixed-language message, and doing so reliably across
different language-pair patterns) is a platform/NLU-layer implementation
concern, not fully specified in this runtime document. This fix resolves
the *configuration contract* (mode + list + defaults) completely — the
detection algorithm itself is still a separate, platform-dependent task.
```

---

## Completion

1. Confirm the full language configuration block in Step 1C is replaced with the above.
2. Confirm this fully supersedes (not duplicates) the Batch 3 Round 4 placeholder — there should be exactly one language configuration section in Step 1C after this fix, not two.
3. Add `language_list` to the Appendix A Business Config fields list (Integration Contract v2 requirements) alongside the existing `language_mode` reference.
4. Update Step 1's completion summary noting the language configuration is now fully specified (mode + list + defaults + fixed/adaptive behavior), with code-mixed detection remaining the one explicitly open implementation item.

STOP after confirming. This is a small, isolated fix — do not proceed to Step 4 archetype work under this prompt.

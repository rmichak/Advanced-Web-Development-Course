# Technical Review: Module 7 — Database Access (IT 431)

**Reviewer:** Automated course review  
**Date:** February 16, 2026  
**File reviewed:** `modules/module-07.html` (28 slides)  
**Comparison file:** `modules/module-06.html` (structural consistency)  
**Prior review reference:** `review-modules-5-6.md`

---

## Executive Summary

Module 7 is **well-structured, technically sound, and ready to teach with minor fixes.** The Supabase JS v2 API calls are correct, SQL syntax is valid, code examples follow modern React patterns, and narration is present on all 28 slides. The pedagogical flow (concepts → code → assignment) is excellent and builds naturally on Modules 5 and 6.

**Issues found: 8 total** — 0 Critical, 3 Important, 5 Minor.

No show-stoppers. The most significant finding is a **factual inaccuracy about the free tier** and a **broken skip-link target** (though the latter is consistent with Module 6's pattern).

| Severity | Count |
|----------|-------|
| 🔴 Critical (wrong code/concepts) | 0 |
| 🟡 Important (misleading content, inconsistency) | 3 |
| 🟢 Minor (style, typo, pedantic) | 5 |

---

## 🟡 Important Issues (Should Fix)

### 1. Supabase Free Tier — "Unlimited API Requests" Is Inaccurate
**Slide:** `#why-supabase` (Slide 9)

**On slide:**
> 💰 Generous Free Tier — 500 MB database, 50K monthly users, **unlimited API requests**

**Problem:** Supabase's free tier has a **5 GB bandwidth cap per month**, not unlimited API requests. Exceeding it causes request errors. The 500 MB database and 50K MAU figures are correct, but "unlimited API requests" is misleading and students may hit the bandwidth limit on busy projects.

**Recommended fix:**
```
500 MB database, 50K monthly users, generous bandwidth
```
Or simply remove the "unlimited API requests" claim and say:
```
500 MB database, 50K monthly users, no credit card required
```

---

### 2. MDN Resource Link — Label Doesn't Match Content
**Slide:** `#resources` (Slide 2)

**On slide:**
> 📚 MDN: Server-Side **& Databases** — Vendor-neutral overview of how databases fit into web applications

**Actual URL:** `https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Web_frameworks`  
**Actual page title:** "Server-side web frameworks"

**Problem:** The link goes to the web frameworks overview page, not a databases page. The narration says "the MDN Web Docs guide on server-side website programming and databases" — while the page does mention database interaction briefly, it's primarily about frameworks (Django, Express, Rails, etc.). This could confuse a student who clicks through expecting database content.

**Recommended fix:** Either change the link to a more database-focused MDN page, or update the label:
```
MDN: Server-Side Web Frameworks — Overview of how server-side frameworks handle routing, databases, and templating
```

---

### 3. Narration Says "Three Resources" But Only Shows Two in First Grid
**Slide:** `#resources` (Slide 2)

**Narration says:**
> "here are **three** resources you'll want bookmarked"

**On slide:** The narration accurately describes three resources, and three resource cards are present. However, the visual layout is inconsistent — the first `resource-grid` has 2 cards, then a second `resource-grid` with `margin-top: 0` has 1 card. This works functionally but visually orphans the third resource. 

**The real issue:** The second `resource-grid` has `style="margin-top: 0;"` which should remove the gap but still creates a separate grid container. The layout could look odd depending on viewport. This is layout/UX, not factual — but worth checking the rendered output.

**Recommended fix:** Put all three cards in a single `resource-grid`, or use a 3-column layout, or verify it renders acceptably.

---

## 🟢 Minor Issues (Optional)

### 4. Skip Link Target `#main-content` Has No Matching Element
**Slide:** (Global — line 121)

**Code:**
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

**Problem:** There is no element with `id="main-content"` in the file. The `<div class="presentation">` (line 123) is the logical target but lacks the id.

**Note:** This is **consistent with Module 6** which has the identical pattern. If it's a known convention handled by `slides.js`, this is fine. If not, it should be fixed across all modules.

**Recommended fix (if applicable to all modules):**
```html
<div class="presentation" id="main-content">
```

---

### 5. Title Slide (Slide 1) Missing `id` Attribute
**Slide:** Slide 1 (title)

**All other slides** have an `id` attribute for navigation/linking. The title slide does not:
```html
<section class="slide title-slide" data-narration="...">
```

**Recommended fix:**
```html
<section class="slide title-slide" id="title" data-narration="...">
```

**Note:** Module 6's title slide also lacks an id, so this is consistent — but adding one would be better practice.

---

### 6. Slide 8 Narration Mentions "GraphQL APIs" — Not Shown on Slide
**Slide:** `#what-is-supabase` (Slide 8)

**Narration says:**
> "auto-generated **REST and GraphQL** APIs"

**On slide:** The four feature cards show Postgres, Real-time, Auth, and Storage. GraphQL is not mentioned anywhere on the slide visually. The REST API also isn't called out explicitly on the slide (it's implied by the "no setup needed" card).

**Impact:** Low — the narration is technically correct (Supabase does offer a GraphQL API via pg_graphql), and narration is allowed to expand beyond slide content. But students reading along may wonder where GraphQL was mentioned.

**Recommended fix (optional):** Either add "Auto-generated REST & GraphQL APIs" as a brief mention on the slide, or remove "GraphQL" from the narration to keep alignment tight.

---

### 7. Slide 23 — "No Raw Joins" Claim Is Slightly Overstated
**Slide:** `#client-vs-sql` (Slide 23)

**On slide (table):**
> Complex Queries: JavaScript Client → "Limited **(no raw joins)**"

**Problem:** Supabase JS v2 actually supports foreign table joins via the `.select()` method with embedded selects:
```js
supabase.from('todos').select('*, users(name)')
```
This performs a join under the hood. The client doesn't support arbitrary raw SQL joins, but saying "no raw joins" understates its capabilities. 

**Recommended fix:**
```
Limited (basic joins via select, no arbitrary SQL)
```

---

### 8. Slide 28 Narration — Vague "Upcoming Modules" Reference
**Slide:** `#module-complete` (Slide 28)

**Narration says:**
> "In **upcoming modules** we'll continue building on this foundation."

**This is vague but not incorrect.** Module 8 presumably builds on database concepts. However, unlike Module 6's narration which explicitly references Module 5 ("In Module 5, you built a React frontend"), this doesn't specify what comes next.

**Recommended fix (optional):** If Module 8 is known, be specific:
```
In Module 8 we'll add user authentication to protect your data.
```
Or keep it vague if the module order isn't finalized.

---

## ✅ Verification Checklist

### Technical Accuracy
- [x] **SQL syntax** — All four CRUD statements (Slide 6) are syntactically valid PostgreSQL
- [x] **`createClient` usage** — Correct: `import { createClient } from '@supabase/supabase-js'` (Slides 15–16)
- [x] **Environment variables** — Correct Vite pattern: `import.meta.env.VITE_*` (Slide 16)
- [x] **`from().select()`** — Correct v2 syntax with `.order()` (Slide 17)
- [x] **`from().insert().select()`** — Correct: `.select()` chained after insert to return data (Slide 18). Narration correctly explains why `.select()` is needed.
- [x] **`from().update().eq()`** — Correct (Slide 19)
- [x] **`from().delete().eq()`** — Correct (Slide 20)
- [x] **RLS SQL** — Both `DISABLE ROW LEVEL SECURITY` and `CREATE POLICY` syntax are valid (Slide 22)
- [x] **{ data, error } destructuring** — Consistently correct across all CRUD examples

### Code Correctness
- [x] All JavaScript/JSX is syntactically valid
- [x] Proper `async/await` usage in all Supabase calls
- [x] `useState` and `useEffect` used correctly (Slides 17, 21)
- [x] `useEffect` dependency array `[]` correct for mount-only fetch
- [x] JSX `key` prop used correctly in `.map()` (Slide 17)
- [x] Error checking before state updates in all CRUD functions
- [x] Import paths consistent (`'./lib/supabaseClient'`)
- [x] `.select()` correctly chained after `.insert()` (v2 requirement — Slide 18 ✅)

### Narration Quality
- [x] **All 28 slides** have `data-narration` attributes — none missing
- [x] Narrations read naturally as instructor speech
- [x] Consistent length (5–10 sentences per slide)
- [x] "Why" explained before "what" throughout
- [x] Good cross-references to Module 5 (Todo app) and Module 6 (fetch calls, REST APIs)
- [x] No slides with stub or placeholder narration

### Structural Consistency (vs Module 6)
- [x] `<html lang="en">` ✅
- [x] `<meta charset="UTF-8">` ✅
- [x] `<meta name="viewport">` ✅
- [x] `<meta name="description">` ✅
- [x] `<link rel="stylesheet" href="../css/slides.css">` ✅
- [x] `<script src="../js/slides.js"></script>` at end ✅
- [x] Skip link present ✅ (target missing — see Issue #4)
- [x] `div.presentation` wrapper ✅
- [x] CSS classes match pattern: `dark-container`, `dark-card`, `code-block`, `terminal-block`, `feature-grid`, `step-number`, `dark-table`, `dark-two-column`, `dark-three-column` ✅
- [x] Card variants: `.warning`, `.danger`, `.info` ✅
- [x] Module uses emerald green (#10b981) accent vs Module 6's cyan (#06b6d4) — intentional per-module theming ✅
- [x] Responsive media query present ✅

### Pedagogy Flow
- [x] Part 1: Concepts (why databases → types → SQL basics → tables → Supabase intro → setup)
- [x] Part 2: Code (install → create client → env vars → CRUD operations → error handling → RLS)
- [x] Part 3: Assignment (quick start → full project)
- [x] Builds logically — no forward references to unexplained concepts
- [x] Simple before complex — raw SQL shown before JS client equivalent
- [x] Todo app thread consistent: Module 5 (React state) → Module 7 (database persistence)

### Currency
- [x] Supabase JS **v2** — all API calls are v2 syntax ✅
- [x] Slide 14 explicitly warns about v1 vs v2 differences ✅
- [x] React patterns: functional components, hooks only, no class components ✅
- [x] Vite (not CRA) as build tool ✅
- [x] `.insert().select()` pattern is v2-correct (v1 returned data by default) ✅
- [x] No deprecated methods or patterns detected

### Cross-References
- [x] Module 5 reference (Todo app, React state) — accurate (Slide 4 narration, Slide 27)
- [x] Module 6 reference (fetch calls, REST APIs) — accurate (Slide 13 narration)
- [x] No references to Module 8 by number (just "upcoming modules") — safe

### Accessibility
- [x] `lang="en"` on `<html>` ✅
- [x] Heading hierarchy: H1 → H2 → H3 → H4 (no skips) ✅
- [x] No images requiring alt text (emoji used as decorative icons) ✅
- [x] `rel="noopener"` on all external links ✅
- [x] `target="_blank"` on external links ✅
- [x] Skip link present (but target missing — Issue #4)

---

## What's Working Well

1. **Supabase JS v2 throughout** — All API calls are v2-correct, and the module explicitly warns students about v1 vs v2 differences (Slide 14). The `.select()` after `.insert()` pattern is correctly taught with explanation of *why* it's needed.

2. **Outstanding narration quality** — Natural instructor voice, explains "why" before "how," anticipates student confusion (e.g., "Don't worry about the other settings for now"). Examples:
   > Slide 4: "That's fine for a demo, but a real application needs data that survives page refreshes, server restarts, and even hardware failures."
   > Slide 18: "Without it, you'd just get a success status but no data."

3. **Clean CRUD progression** — Each operation is taught on its own slide with a focused code example, then summarized. Students can reference individual slides.

4. **Security consciousness** — Environment variables taught early (Slide 16), RLS explained with both simple and proper approaches (Slide 22), .gitignore requirement emphasized.

5. **Consistent theming** — Emerald green accent differentiates this module visually from Module 6 (cyan) while using identical CSS class patterns. Professional feel.

6. **Practical assignment structure** — Assignment 1 (verification/setup) before Assignment 2 (full project) reduces frustration. Students confirm their environment works before building.

---

## Summary of Required Fixes

| Priority | Slide | Issue | Fix |
|----------|-------|-------|-----|
| 🟡 Important | `#why-supabase` | "Unlimited API requests" is inaccurate | Change to "generous bandwidth" or remove claim |
| 🟡 Important | `#resources` | MDN link labeled as database resource but goes to web frameworks page | Update label or link |
| 🟡 Important | `#resources` | Third resource card orphaned in separate grid | Consolidate layout or verify renders well |
| 🟢 Minor | Global | Skip link targets `#main-content` — no element has that id | Add `id="main-content"` to `.presentation` div |
| 🟢 Minor | Slide 1 | Title slide missing `id` attribute | Add `id="title"` |
| 🟢 Minor | `#what-is-supabase` | Narration mentions GraphQL, not shown on slide | Add to slide or remove from narration |
| 🟢 Minor | `#client-vs-sql` | "No raw joins" understates JS client capabilities | Rephrase to "basic joins via select, no arbitrary SQL" |
| 🟢 Minor | `#module-complete` | "Upcoming modules" is vague | Specify Module 8 topic if known |

---

## Comparison with Modules 5 & 6 Review

Issues from the prior review that are **NOT repeated here**:
- ✅ No stale year references (no hardcoded years in narration)
- ✅ No "Twitter" branding issue
- ✅ No Next.js `params` await issue (Module 7 doesn't use Next.js route handlers)
- ✅ No stale dates in JSON examples

**Consistent patterns maintained:**
- Same HTML boilerplate structure
- Same CSS class naming conventions
- Same narration quality level
- Same skip-link pattern (broken target — consistent across modules)
- Same title-slide missing-id pattern

**Overall:** Module 7 is in excellent shape. The three Important issues are easy fixes (one factual correction, one link/label alignment, one layout check). No code errors, no wrong concepts, no deprecated patterns. Ready to teach.

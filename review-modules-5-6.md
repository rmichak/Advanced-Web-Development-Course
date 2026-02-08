# Review: Modules 5 & 6 — IT 431 Advanced Web Development

**Reviewer:** Automated course review  
**Date:** February 6, 2026  
**Files reviewed:**
- `modules/module-05.html` (24 slides)
- `modules/module-06.html` (41 slides)
- `assignments/assignment-1-express-tasks-api.html` (14 steps)
- `assignments/assignment-2-nextjs-tasks-api.html` (10 steps)
- `assignments/assignment-3-react-todo-app.html` (10+ steps)

---

## Executive Summary

Both modules are well-structured, technically sound, and have thorough narration on every slide. The code examples are correct and follow modern patterns. There are a few issues to address: an **outdated year reference** in the narration, a **Next.js params API change** that will affect students in 2026, and a **stale date in a JSON example**. Overall quality is high — these are ready to teach with minor fixes.

---

## Module 5: React Fundamentals

### ✅ Strengths

1. **Correct recommendation of Vite over CRA** — Slide 7 properly recommends `npm create vite@latest` and explicitly notes that Create React App is "slower and somewhat outdated." This is accurate for 2026.

2. **All code examples are technically correct** — Components, JSX, props, destructuring, useState, event handling, and list rendering all follow modern React patterns using function components and hooks exclusively. No class components appear.

3. **Narration is present on ALL 24 slides** — Every `<section>` has a `data-narration` attribute with natural instructor-style prose.

4. **Good pedagogical structure** — Part 1 (fundamentals) → Part 2 (state & interactivity) → Part 3 (assignments) is a clean progression.

5. **Accurate JSX differences** — Slide 9 correctly covers `className`, `htmlFor`, and self-closing tags.

### ⚠️ Issues Found

#### 1. OUTDATED YEAR REFERENCE — Slide 7 (Setup) — MEDIUM PRIORITY

**Narration says:**
> "Vite is the recommended choice for new projects in **2024** and beyond."

**Problem:** Course is being taught in 2026. Should say "2025 and beyond" or simply "today" to future-proof.

**Fix:** Change to "Vite is the recommended choice for new projects" (drop the year entirely for future-proofing).

#### 2. "Twitter" reference — Slide 6 (React in the Wild) — LOW PRIORITY

**Narration says:**
> "Other major users include Uber, Twitter, Reddit, Dropbox, and thousands of startups."

**Slide content also says:** "Also: Uber, Twitter, Reddit, Dropbox, Spotify, and thousands more"

**Problem:** Twitter rebranded to X in 2023. While colloquially many still say "Twitter," in a course context it should say "X (formerly Twitter)" to be current, or just drop it since it's one example among many.

#### 3. No statistics or market data cited — LOW PRIORITY

Module 5 avoids citing specific market share numbers or download stats, which is actually good — it means there are no stale statistics to worry about. Narration uses qualitative claims like "most in-demand frontend skill" and "most popular JavaScript library" which remain broadly accurate for 2026.

#### 4. Footer component used but never defined — Slide 11 (Composition) — MINOR

The composition example uses `<Footer />` but never shows a `Footer` component definition — only `Header` and `MainContent` are defined. This is intentional (keeping the example concise), but a student could be confused. Consider adding a brief comment like `// Footer defined elsewhere` in the code.

### 📝 Narration Quality Assessment

**Overall: Excellent.** The narrations read naturally as instructor speech, not documentation. Good examples:

> Slide 4: "Notice I said library, not framework — this distinction matters."

> Slide 17: "Never modify state directly like count = 5 — always use the setter function, or React won't know to re-render."

> Slide 19: "The key prop is crucial — React uses it to track which items change, are added, or removed."

All narrations are appropriately paced for audio narration, explain the "why" not just the "what," and use accessible language.

### 🔗 External Links

| Link | Status |
|------|--------|
| `https://www.linkedin.com/learning/react-js-essential-training` | ⚠️ Likely valid but LinkedIn Learning reorganizes courses frequently — verify the specific URL |
| `https://react.dev/learn` | ✅ Stable official docs URL |
| `https://www.w3schools.com/react/` | ✅ Stable |
| `https://www.w3schools.com/react/react_quiz.asp` | ✅ Stable |

---

## Module 6: RESTful APIs

### ✅ Strengths

1. **Excellent pedagogical approach** — Building the same API twice (Express then Next.js) is brilliant for comparison learning. The side-by-side comparison table (Slide 39) is particularly effective.

2. **All Express.js code is correct** — Routes, middleware, req/res patterns, error handling, CORS setup, and file storage helpers all follow Express best practices.

3. **Proper HTTP status codes throughout** — 200 for GET, 201 for POST, 204 for DELETE, 400 for validation, 404 for not found. This is textbook-correct REST.

4. **Good security note about CORS** — Slide 27 correctly explains CORS, shows `cors()` for development, and warns about configuring specific origins for production.

5. **Narration on ALL 41 slides** — Complete and natural.

6. **Practical tooling** — Teaching Postman alongside API development is standard industry practice.

### ⚠️ Issues Found

#### 1. NEXT.JS PARAMS API CHANGE — Slides 35, 37 — HIGH PRIORITY 🔴

**Code shown (Slide 35):**
```js
export async function GET(request, { params }) {
  const id = params.id;
}
```

**Problem:** Starting in Next.js 15 (released October 2024), `params` is now a **Promise** and must be awaited:

```js
export async function GET(request, { params }) {
  const { id } = await params;
}
```

This affects **ALL dynamic route handlers** shown in both Module 6 and Assignment 2. Without `await`, students will get a runtime error or unexpected behavior in Next.js 15+. Since `create-next-app@latest` in 2026 will install Next.js 15.x, **students will hit this immediately**.

**Affected locations:**
- Module 6, Slide 35 (NextRequest & NextResponse)
- Module 6, Slide 37 (Dynamic Routes) — GET, PUT, DELETE handlers
- Assignment 2, Step 5 (`app/api/tasks/[id]/route.js`) — GET, PUT, DELETE handlers

**Fix:** Add `await` before `params` access in all dynamic route handlers:
```js
export async function GET(request, { params }) {
  const { id } = await params;
  const numId = parseInt(id);
  // ...
}
```

#### 2. STALE DATE IN JSON EXAMPLE — Slide 10 — LOW PRIORITY

**JSON example shows:**
```json
"createdAt": "2024-01-15"
```

**Problem:** Minor, but using 2024 in a 2026 course looks dated. Change to `"2026-01-15"` or use a more generic placeholder.

#### 3. Express "since 2010" claim — Slide 13 — LOW PRIORITY

**Narration says:**
> "Express has been the go-to choice for Node.js APIs since 2010."

**Fact check:** Express was first released in November 2010 (v0.x), so this is accurate. However, it only became the mainstream "go-to" around 2012-2013. This is borderline but acceptable.

#### 4. `Date.now()` for IDs — Multiple slides — INFORMATIONAL

Both modules use `Date.now()` for generating unique IDs. This is fine for a learning context but technically not collision-safe (two rapid requests could get the same ID). The narration correctly notes this is simplified. No change needed, but could add a one-line comment like `// Simple ID for learning - use UUID in production`.

#### 5. Vercel file system limitation noted correctly — Slide 38 — ✅

Good: The module correctly warns that Vercel's serverless functions have a read-only filesystem, so JSON file storage won't persist in production. This prevents student confusion at deployment time.

#### 6. PUT used for partial updates — Slide 25 — INFORMATIONAL

**Narration says:**
> "Some APIs use PATCH for partial updates and PUT for full replacement, but for simplicity we're using PUT for both."

This is explicitly acknowledged and fine for a learning context. Good that it mentions the distinction.

### 📝 Narration Quality Assessment

**Overall: Excellent.** The restaurant analogy for APIs (Slide 5) is particularly effective:

> "Here's an analogy: imagine a restaurant. You, the customer, don't go into the kitchen to make your food. Instead, you use a menu — that's the API."

Other strong narrations:

> Slide 20: "Middleware are functions that run between receiving a request and sending a response."

> Slide 26: "Filter keeps items where the condition is true — so we keep all tasks where the id doesn't match."

> Slide 39: "Both are valid choices — now you know both approaches!"

The narrations consistently explain "why" before "what," use conversational instructor tone, and handle potential confusion points proactively (e.g., explaining that URL params are always strings).

### 🔗 External Links

| Link | Status |
|------|--------|
| `https://developer.mozilla.org/en-US/docs/Web/HTTP` | ✅ Stable MDN URL |
| `https://expressjs.com/` | ✅ Stable |
| `https://nextjs.org/docs/app/building-your-application/routing/route-handlers` | ⚠️ Next.js reorganizes docs occasionally — verify URL still resolves |
| `https://www.postman.com/postman/published-postman-templates/documentation/ae2ja6x/learn-by-api` | ⚠️ Postman URLs with hash IDs can break — verify this specific template still exists |

---

## Assignment 1: Express.js Tasks API

### ✅ Strengths
- Step-by-step with exact code — students can follow along even if they're struggling
- Postman testing is integrated into the assignment (Steps 8-12)
- Clear submission checklist (GitHub + Postman JSON + Screenshots)
- All code is technically correct and consistent with the module content
- Narration on all slides

### ⚠️ Issues
- **None found.** Express patterns are stable and the code is correct.

---

## Assignment 2: Next.js Tasks API

### ✅ Strengths
- Clean parallel to Assignment 1 — students see the same API in a different framework
- Deployment to Vercel is included — good real-world skill
- Clear folder structure diagram
- Narration on all slides

### ⚠️ Issues

#### 1. SAME PARAMS AWAIT ISSUE — Step 5 — HIGH PRIORITY 🔴

Same problem as Module 6. The `{ params }` destructuring in `[id]/route.js` needs `await`:

**Current code:**
```js
export async function GET(request, { params }) {
  const id = parseInt(params.id);
```

**Should be:**
```js
export async function GET(request, { params }) {
  const { id } = await params;
  const numId = parseInt(id);
```

This applies to GET, PUT, and DELETE handlers in Step 5.

#### 2. File storage won't persist on Vercel — NOTED BUT OK

The assignment asks students to deploy to Vercel and test the live URL with Postman. But since file writes don't persist on Vercel's serverless, creating a task and then fetching it may fail across different function invocations. 

**However:** For a quick POST-then-GET test in Postman, it will likely work within the same serverless instance warm period. The module already warns about this (Slide 38). Consider adding a brief note in the assignment itself: *"Note: Data may not persist between requests on Vercel since it uses serverless functions. Test all endpoints in quick succession."*

---

## Assignment 3: React Todo App

### ✅ Strengths
- **Exceptional step-by-step walkthrough** — 10 detailed steps with exact code at each stage
- Vite used correctly (not CRA)
- Controlled component pattern taught correctly
- Vercel deployment thoroughly explained with sub-steps (10a through 10e)
- Good CSS provided — app will look presentable without students struggling with styling
- Narration on all slides, very natural instructor tone

### ⚠️ Issues
- **None found.** All React patterns are correct, modern, and appropriate for the learning level.
- The `useState`, `map()`, `filter()`, controlled input, and `preventDefault()` patterns are all textbook-correct.

---

## Summary of Required Fixes

| Priority | Location | Issue | Fix |
|----------|----------|-------|-----|
| 🔴 HIGH | Module 6 Slides 35, 37 | `params` must be awaited in Next.js 15+ | Add `await params` |
| 🔴 HIGH | Assignment 2, Step 5 | Same `params` issue | Add `await params` |
| 🟡 MEDIUM | Module 5 Slide 7 | Year reference "2024" | Remove year or update |
| 🟢 LOW | Module 6 Slide 10 | JSON date "2024-01-15" | Update to "2026-01-15" |
| 🟢 LOW | Module 5 Slide 6 | "Twitter" → "X" | Update to "X (formerly Twitter)" or remove |
| 🟢 LOW | Module 6 Slides 2 | Postman template URL may be stale | Verify link |

### What's Working Well
- ✅ All code examples are syntactically correct
- ✅ Modern React patterns (function components, hooks, Vite)
- ✅ Proper REST conventions throughout
- ✅ data-narration present on **every single slide** across all files
- ✅ Narrations sound natural and instructor-like, not robotic
- ✅ Accessibility considerations (skip links, ARIA)
- ✅ Progressive difficulty (learn → practice → build → deploy)
- ✅ Assignments include clear submission checklists

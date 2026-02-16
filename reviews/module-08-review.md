# Technical Review: Module 8 — Authentication & Security

**Reviewer:** Automated Technical Review  
**Date:** 2026-02-16  
**File:** `modules/module-08.html`  
**Cross-referenced:** Module 6, Module 7, Supabase Auth v2 docs, OWASP Top 10  

---

## Summary

| Metric | Count |
|--------|-------|
| Total slides reviewed | 28 |
| Code blocks reviewed | 12 |
| Narrations reviewed | 28 |
| **Issues found** | **9** |
| Critical | 1 |
| Important | 4 |
| Minor | 4 |

**Overall Assessment:** This is a strong, well-structured module. The Supabase Auth API calls are all correct and current (v2 patterns). The code examples are syntactically valid. The pedagogy flow is logical — concepts before implementation, simple auth before OAuth, security after practical auth. The security content is mostly accurate and appropriate for the audience level. There is one critical currency issue (OWASP Top 10 version) and several important items that should be addressed before delivery.

---

## Critical Issues (Must Fix)

### C1: OWASP Top 10 Version Outdated  
**Location:** Slide 2 (`#resources`), Slide 23 (`#vulnerabilities`)  
**Issue:** The narration on Slide 2 states: *"The OWASP Top 10 is the industry-standard list of the most critical web application security risks"* — this is fine. However, the narration on Slide 23 says: *"These three are consistently in the OWASP Top 10, and they've caused some of the biggest data breaches in history."*

The **OWASP Top 10:2025** was released in late 2025, superseding the 2021 edition. Key changes relevant to this module:
- **Injection** dropped from #3 (2021) to **#5** (2025) — still present but repositioned
- **XSS** is categorized under Injection (A05:2025)
- **CSRF** is NOT explicitly in the OWASP Top 10 (it was removed back in 2017 and remains absent in 2025)
- New categories like **Software Supply Chain Failures** (A03:2025) and **Mishandling of Exceptional Conditions** (A10:2025) were added

The module's claim that "these three [XSS, CSRF, SQL Injection] are consistently in the OWASP Top 10" is inaccurate for CSRF. CSRF hasn't been a standalone OWASP Top 10 item since 2013. It was dropped because modern frameworks largely mitigate it by default.

Since Randy is a CISSP, this inaccuracy would be noticed by security-savvy students or peers.

**Fix:** Update the narration on Slide 23 to say something like: *"XSS and SQL Injection are both forms of Injection, which is consistently in the OWASP Top 10. CSRF, while not a Top 10 item on its own anymore, remains a well-known attack vector you should understand."* Also consider mentioning the 2025 edition exists in the Resources slide narration.

---

## Important Issues (Should Fix)

### I1: Narration References "2024" — Currency/Dating Concern  
**Location:** Slide 4 (`#why-auth-matters`)  
**Issue:** The narration says: *"In 2024, users expect authentication."*

This is a hardcoded year. By the time students view this in a future semester, it will sound dated.

**Fix:** Change to: *"Today, users expect authentication."* — This is evergreen and avoids aging the material.

---

### I2: Missing UPDATE Policy in RLS Example  
**Location:** Slide 21 (`#rls-with-auth`)  
**Issue:** The narration explicitly mentions creating policies for "SELECT, INSERT, DELETE, and UPDATE too" — but the code example only shows policies for SELECT, INSERT, and DELETE. The UPDATE policy is missing from the code.

This creates a disconnect between what the narration promises and what the slide shows. Students who follow only the code will have incomplete RLS and won't be able to toggle todo completion.

**Fix:** Add the UPDATE policy to the code block:

```sql
-- 6. Policy: Users can only UPDATE their own todos
CREATE POLICY "Users update own todos"
ON todos FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

Note: UPDATE policies in Postgres RLS need both `USING` (which rows can be seen for update) and `WITH CHECK` (what the new values must satisfy).

---

### I3: CSRF Example May Be Misleading  
**Location:** Slide 23 (`#vulnerabilities`)  
**Issue:** The CSRF code example shows:
```html
<img src="https://bank.com/transfer?to=hacker&amount=10000" />
```

This example implies a bank transfer can be triggered via a GET request embedded in an `<img>` tag. While this is a classic textbook example, it's worth noting:
1. Modern banks don't process financial transactions via GET requests
2. The example is more of a historical illustration than a current real-world attack
3. The `<img>` tag CSRF attack only works with GET requests — POST-based CSRF requires a form

The narration correctly says *"Supabase's token-based auth helps mitigate this because tokens aren't sent automatically like cookies"* — this is accurate and good. However, the nuance could be improved.

**Fix (optional but recommended):** Add a brief note either in the code comment or a small card below: *"Classic example — modern apps use POST for state changes and CSRF tokens, making this harder to exploit."* This shows awareness without overcomplicating things.

---

### I4: `signOut` Scope Claim Needs Nuance  
**Location:** Slide 16 (`#sign-out`)  
**Issue:** The narration states: *"One important detail: signOut only clears the current session. If the user is logged in on multiple devices, those other sessions remain active until their tokens expire."*

This is **partially inaccurate** for Supabase Auth v2. By default, `signOut()` has a `scope` parameter that defaults to `'global'`, which revokes **all** sessions for the user (invalidates all refresh tokens). To sign out only the current session, you'd pass `{ scope: 'local' }`.

From the Supabase docs:
```javascript
// Default: signs out everywhere
await supabase.auth.signOut()  // scope: 'global'

// Only current session:
await supabase.auth.signOut({ scope: 'local' })
```

**Fix:** Update the narration to: *"By default, signOut revokes all sessions across all devices. If you only want to sign out the current device, pass `{ scope: 'local' }` as an option."* This is both more accurate and more useful information.

---

## Minor Issues (Optional)

### M1: JWT Signature Pseudocode Uses `base64` Instead of `base64url`  
**Location:** Slide 7 (`#jwts-explained`)  
**Issue:** The signature example shows:
```
HMACSHA256(
  base64(header) + "." +
  base64(payload),
  secret
)
```

Technically, JWTs use **Base64URL** encoding (not standard Base64). The difference is that Base64URL replaces `+` with `-` and `/` with `_`, and omits padding `=`. This is a nitpick, but for a CISSP instructor, precision matters.

**Fix:** Change `base64` to `base64url` in the pseudocode. Or keep it as-is with a narration note that it's simplified.

---

### M2: `data` Variable Shadowing in Sign Up Component  
**Location:** Slide 14 (`#sign-up`)  
**Issue:** The code destructures `{ data, error }` from `signUp()`, but the outer scope already has `error` as a state variable name (from `useState`). The inner `error` from destructuring shadows the `setError` function's parameter. While this works in JavaScript (the destructured `error` is scoped to the `handleSignUp` function), it could confuse students:

```javascript
const [error, setError] = useState(null);  // outer 'error'
...
const { data, error } = await supabase.auth.signUp({...});  // inner 'error' shadows
```

This is actually fine functionally (block scoping), and the same pattern is used in the Supabase docs. But pedagogically, it might trip up beginners.

**Fix (optional):** Could rename to `const { data, error: authError }` for clarity, but this diverges from Supabase's own examples. Probably fine as-is since students should learn this pattern.

---

### M3: Module 7 Assignment Structure Mismatch  
**Location:** Slide 27 (`#assignment1`)  
**Issue:** The assignment says *"take the database-powered Todo app from Module 7"* and is worth **50 points**. However, Module 7 has **two** assignments (Assignment 1: 20 points for Supabase quickstart, Assignment 2: 30 points for the Todo app). The Module 8 assignment references "your Module 7 Todo app" which is specifically Assignment 2 from Module 7.

This is clear enough in context, but some students might have only completed Assignment 1 (the quickstart). The narration could be more explicit.

**Fix:** Change *"the database-powered Todo app from Module 7"* to *"the database-powered Todo app you built in Module 7, Assignment 2"* for precision.

---

### M4: Passkeys Browser Support Claim  
**Location:** Slide 8 (`#auth-strategies`)  
**Issue:** The table says passkeys have the con: *"Newer, browser support growing"*. As of early 2026, passkeys are supported in all major browsers (Chrome, Safari, Firefox, Edge) and have broad OS support (iOS 16+, Android 9+, Windows 10+, macOS Ventura+). The "growing" characterization is becoming less accurate.

**Fix:** Change to *"Newer, user adoption growing"* — the browser support is solid; it's user familiarity and adoption that's still developing.

---

## Accuracy Verification Checklist

- [x] **Supabase Auth API calls** — All correct: `signUp`, `signInWithPassword`, `signOut`, `getUser`, `onAuthStateChange` match current v2 API
- [x] **JWT structure** — Header/Payload/Signature correctly described. Encoding vs encryption distinction properly made.
- [x] **`onAuthStateChange` cleanup** — Correctly shows `subscription.unsubscribe()` in useEffect cleanup. This is the current v2 pattern (v1 used `data.unsubscribe()` differently).
- [x] **`auth.uid()` in RLS** — Correct Postgres function for Supabase RLS policies
- [x] **OAuth flow** — `signInWithOAuth({ provider: 'github' })` is correct v2 syntax
- [x] **GoTrue reference** — Accurate; Supabase Auth is built on GoTrue (open-source)
- [x] **Password hashing** — Narration says "bcrypt" which is correct for current Supabase Auth
- [x] **50,000 MAU free tier** — Confirmed accurate as of 2026
- [x] **Token storage** — Narration correctly states "local storage" for Supabase client default behavior
- [x] **React patterns** — useState, useEffect, conditional rendering, form handling all correct
- [x] **SQL syntax** — ALTER TABLE, CREATE POLICY, ENABLE ROW LEVEL SECURITY all valid Postgres
- [x] **XSS description** — Accurate. Correctly notes React's JSX escaping protection.
- [x] **SQL Injection description** — Accurate. Correctly notes Supabase uses parameterized queries.
- [ ] **CSRF description** — Mostly accurate but see I3 above for nuance
- [ ] **OWASP Top 10 reference** — Needs update to reflect 2025 edition (see C1)
- [ ] **signOut scope** — Needs correction (see I4)

---

## Structural Consistency Check

- [x] `lang="en"` on `<html>` tag ✓
- [x] Skip link present: `<a href="#main-content" class="skip-link">Skip to main content</a>` ✓
- [x] `id="main-content"` on presentation div ✓ (Note: Module 7 uses `class="presentation"` without id; Module 8 adds `id="main-content"` — this is actually better for the skip link target)
- [x] Amber/red theme (`#f59e0b` accent) ✓ — consistent throughout
- [x] CSS class names match established pattern (`dark-container`, `dark-card`, `dark-table`, etc.) ✓
- [x] Heading hierarchy: H1 for module title, H2 for slide titles, H3 for subsections, H4 for cards ✓
- [x] External links have `target="_blank" rel="noopener"` ✓
- [x] Code blocks use consistent syntax highlighting classes ✓
- [x] Responsive media queries present for mobile ✓
- [x] `slides.js` and `slides.css` properly linked ✓

---

## Pedagogy Flow Assessment

The module follows an excellent pedagogical progression:

1. **Slides 1-2:** Introduction and resources
2. **Slides 3-12 (Part 1):** Authentication fundamentals — concepts before code
   - Why auth matters → AuthN vs AuthZ → How auth works → JWTs → Auth strategies → Supabase Auth overview → Setup → Flow diagram → Summary
3. **Slides 13-25 (Part 2):** Implementation — building complexity gradually
   - Sign up → Sign in → Sign out → Get user → Complete form component → Protected routes → OAuth → RLS + Auth → Security basics → Best practices → Summary
4. **Slides 26-28 (Part 3):** Assignment and wrap-up

This flow is pedagogically sound:
- ✅ Concepts before implementation
- ✅ Simple auth (email/password) before OAuth
- ✅ Individual operations before complete components
- ✅ Security fundamentals after practical auth (students have context)
- ✅ Assignment references specific slides for guidance

---

## Cross-Reference Accuracy

| Module 8 Reference | Module 7 Actual | Match? |
|---|---|---|
| "Supabase in Module 7" (Slide 9) | Module 7 covers Supabase setup, CRUD | ✅ |
| "supabaseClient.js from Module 7" (Slide 10) | Module 7 Slide 15 creates `supabaseClient.js` | ✅ |
| "Row Level Security" from Module 7 (Slide 21) | Module 7 Slide 22 covers RLS basics | ✅ |
| "Todo app from Module 7" (Assignment) | Module 7 Assignment 2 builds the Todo app | ✅ |
| "Module 5 Todo app" mentioned in Module 7 | Module 7 references upgrading from Module 5 | ✅ |
| Environment variables / Vite / VITE_ prefix | Module 7 Slide 16 covers this | ✅ |

All cross-references are accurate.

---

## Narration Quality Assessment

- **Length consistency:** All 28 narrations are substantial (5-12 sentences each). No stubs or missing narrations.
- **Narration-slide alignment:** Each narration accurately describes and expands on what's visible on the slide. No references to items not shown. ✅
- **Voice:** Conversational, instructor-like tone. Consistent throughout. Uses "you" and "we" naturally.
- **Technical depth:** Appropriate for undergraduate advanced web dev. Explains concepts without being condescending.
- **One concern:** Some narrations are quite long (Slide 23 on vulnerabilities is ~15 sentences). This is the densest slide and may benefit from being split into two slides — one for XSS/CSRF/SQLi descriptions and one for the mitigations. However, this is a design choice, not an error.

---

## Recommended Changes (Ready-to-Use)

### Fix C1 (OWASP reference in Slide 23 narration):

**Current:** *"These three are consistently in the OWASP Top 10, and they've caused some of the biggest data breaches in history."*

**Replace with:** *"XSS and SQL Injection fall under Injection, which has been in every version of the OWASP Top 10, most recently ranked A05 in the 2025 edition. CSRF is no longer a standalone Top 10 item — modern frameworks mitigate it well — but it remains an attack pattern you should understand. All three have contributed to major data breaches historically."*

### Fix I1 (hardcoded year in Slide 4 narration):

**Current:** *"In 2024, users expect authentication."*

**Replace with:** *"Today, users expect authentication."*

### Fix I2 (missing UPDATE policy in Slide 21 code):

Add after the DELETE policy in the code block:
```sql
-- 6. Policy: Users can only UPDATE their own todos
CREATE POLICY "Users update own todos"
ON todos FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Fix I4 (signOut scope in Slide 16 narration):

**Current:** *"One important detail: signOut only clears the current session. If the user is logged in on multiple devices, those other sessions remain active until their tokens expire. That's normal behavior for JWT-based auth."*

**Replace with:** *"One important detail: by default, signOut revokes all sessions across all devices by invalidating all refresh tokens. If you only want to sign out the current device, you can pass { scope: 'local' } as an option."*

---

## Final Verdict

**Module 8 is ready for deployment with minor revisions.** The one critical issue (C1 — OWASP Top 10 currency) should be fixed before delivery, especially given the instructor's security credentials. The important issues (I1-I4) should be addressed in the next revision pass. The minor issues are truly optional and cosmetic.

The module excels at:
- Clear, progressive pedagogy
- Accurate Supabase Auth v2 code
- Practical, copy-paste-ready code examples
- Strong narrations that add value beyond the slides
- Proper accessibility and structural consistency
- Effective cross-referencing with Module 7

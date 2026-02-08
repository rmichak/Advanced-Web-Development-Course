# Review: Modules 1 & 2 — IT 431 Advanced Web Development

**Reviewer:** Clawd (automated review)  
**Date:** February 6, 2026  
**Files reviewed:** `modules/module-01.html`, `modules/module-02.html`

---

## Executive Summary

Both modules are well-structured, professional slide presentations with strong narration throughout. Every slide (24 in Module 1, 25 in Module 2) has `data-narration` present. The narrations read naturally and sound like an experienced instructor. However, there are several issues: outdated statistics, one deprecated technology claim (HTTP/2 server push), a structural HTML bug in Module 2, a "Next Module" teaser mismatch in Module 1, and some version numbers that could be refreshed for a 2026 audience.

---

## Module 1: Development Environment Setup

### ✅ Overall Quality
- **24/24 slides have `data-narration`** — full coverage
- Narration quality is excellent — conversational, authoritative, motivating
- Assignment is comprehensive and well-scaffolded with OS-specific instructions
- Code examples are technically accurate

### 🔢 Statistics & Numbers to Update

#### 1. npm Package Count — OUTDATED
- **Slide:** "What is Node.js?" (`#what-is-nodejs`)
- **Current text:** `"npm gives us access to over a million open-source packages"` (narration) and `"1M+ packages available on npm"` (slide content)
- **Reality (2026):** npm has approximately **5.4 million packages** (~4.2M unscoped + ~1.2M scoped). Even conservative estimates put it well above 2 million.
- **Fix:** Update to "over 2 million packages" (conservative) or "millions of packages" (safe/evergreen).

#### 2. GitHub Developer Count — OUTDATED
- **Slide:** GitHub Introduction (`#github-intro`)
- **Narration:** `"Over 100 million developers use GitHub"`
- **Reality (2026):** GitHub's 2025 Octoverse report shows **180+ million developers**, with 36 million added in 2025 alone.
- **Fix:** Update to "Over 150 million developers" (conservative) or "Over 180 million developers" (current).

#### 3. VS Code "since 2018" Claim — SLIGHTLY OUTDATED FRAMING
- **Slide:** VS Code Introduction (`#vscode-intro`)
- **Narration:** `"the number one choice in Stack Overflow surveys since 2018"`
- **Reality:** Still true and VS Code hit 75% usage in the 2025 survey. The "since 2018" framing is technically accurate but could be refreshed.
- **Suggestion:** Update to `"the number one choice in Stack Overflow surveys for eight years running"` or similar for 2026 delivery.

#### 4. Node.js Expected Version — SHOULD UPDATE
- **Slide:** Verify Installation (`#verify-node`)
- **Code comment:** `# Expected: v22.x.x` for Node and `# Expected: 10.x.x` for npm
- **Reality (Feb 2026):** Node 22.x is still valid LTS, but Node 24.x is now also active LTS, and Node 20.x is nearing end-of-life (April 2026). The assignment table correctly says "20.x or higher" which is fine.
- **Suggestion:** Update the comment to `# Expected: v22.x.x or v24.x.x` to reflect current LTS options. Node 20.x EOL is April 2026 — might want to bump the minimum to 22.x in the assignment table too.

#### 5. Assignment Minimum Versions — REVIEW
- **Slide:** Assignment table
- **Node.js minimum:** `20.x or higher (LTS)` — Node 20 EOL is **April 2026**. If this course runs in Spring 2026, students installing Node 20 will be on an EOL version mid-semester.
- **Fix:** Update minimum to `22.x or higher (LTS)`.

### 🎙️ Narration Quality

All narrations sound like a real instructor. Highlights:

- **Git intro narration** is particularly strong: `"Git is arguably the most important tool you'll learn in this course."` — direct, motivating, sets expectations.
- **Commit messages narration** is excellent pedagogically: `"Start with an imperative verb: 'Add feature,' 'Fix bug,' 'Update styles.' Not 'Added' or 'Adding'—think of completing the sentence 'This commit will...'"` — very practical.
- **Tips for Success narration** feels genuinely experienced: `"Once they're in Git history, they're there forever, even if you delete the file."` — real-world wisdom.

No narration sounds robotic or overly formal. ✅

### 📎 "Next Module" Teaser — MISMATCH
- **Slide:** Summary slide
- **Text:** `"Next Module: We'll start building web pages using HTML and CSS fundamentals."`
- **Narration:** `"In the next module, we'll put these tools to work building actual web pages with HTML and CSS."`
- **Reality:** Module 2 is "Web Foundations" (HTTP, web servers, technology stacks) — NOT HTML/CSS.
- **Fix:** Update to reference Module 2's actual content: HTTP protocol, web servers, and technology stacks.

### 🔗 External Links

| Link | Status |
|------|--------|
| `https://code.visualstudio.com/docs/getstarted/getting-started` | ✅ Likely valid (official docs) |
| `https://www.youtube.com/watch?v=B-s71n0dHUk` | ⚠️ **Verify** — YouTube video URLs can go private/deleted. This is "Getting Started with VS Code" — should check it's still up. |
| `https://git-scm.com/book/en/v2/Getting-Started-Installing-Git` | ✅ Stable official docs |
| `https://www.youtube.com/watch?v=RGOj5yH7evk` | ⚠️ **Verify** — freeCodeCamp Git crash course. Very popular video, likely still up, but worth confirming. |
| `https://nodejs.org` | ✅ |
| `https://git-scm.com` | ✅ |
| `https://git-scm.com/download/win` | ✅ |
| `https://github.com/signup` | ✅ |
| `https://github.com/settings/keys` | ✅ |
| `https://code.visualstudio.com` | ✅ |
| `https://www.postman.com/downloads/` | ✅ |
| `https://www.npmjs.com/package/express` | ✅ |
| `https://www.npmjs.com/package/react` | ✅ |
| `https://www.npmjs.com/package/next` | ✅ |

### 🧪 Code Examples — Technical Accuracy

#### Express.js Server (`server.js` in assignment)
```js
const express = require('express');
```
- **Issue:** Uses `require()` (CommonJS). Express 5 works with both CommonJS and ESM, so this is technically fine. However, for a 2026 course, consider showing ESM (`import express from 'express'`) as the modern pattern, or at minimum mentioning it.
- **Note:** The code accesses `require('express/package.json').version` — this works in Express 5 but relies on the `exports` field in package.json allowing subpath access. Worth testing to confirm it still works with the latest Express 5.x.

#### SSH Key Generation
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```
- ✅ Correct and uses the recommended ed25519 algorithm.

#### Git Commands — All Accurate ✅

### ⚠️ Potential Issues

1. **Homebrew install command** — The curl command for installing Homebrew is correct as of now, but Homebrew occasionally changes their install URL. Worth verifying before each semester.

2. **`npm init -y`** — Creates a package.json with `"main": "index.js"` and no `"type": "module"`. This is fine for the CommonJS `require()` approach used, but students may be confused later if they see ESM in other modules.

3. **Resources slide** lists URLs in plain text (not hyperlinked): `code.visualstudio.com/docs`, `nodejs.org/en/docs/guides`, `guides.github.com/introduction/git-handbook`. The last one (`guides.github.com`) may redirect — GitHub has been consolidating docs to `docs.github.com`.

---

## Module 2: Web Foundations

### ✅ Overall Quality
- **25/25 slides have `data-narration`** — full coverage
- Excellent visual design — animated request/response diagram, well-structured dark theme
- Content is comprehensive: HTTP, servers, stacks, deployment, security
- Assignment is well-structured with clear grading rubric

### 🐛 HTML Bug — MISSING CLOSING `</div>`

- **Slide:** "Choosing a Tech Stack" (line ~1440)
- **Issue:** The `dark-two-column` div is missing a closing `</div>`. The slide has:
  ```html
  <div class="dark-two-column">
      <div>...</div>
      <div>
          <h3>Quick Guide</h3>
          <table>...</table>
      </div>
  <!-- MISSING </div> for dark-two-column here -->
  </div> <!-- this closes dark-container -->
  ```
- **Impact:** Browser auto-closes it, so visual impact may be minimal, but it's invalid HTML and could cause rendering quirks. Module 2 has **202 opening `<div>` tags but only 201 closing `</div>` tags**.
- **Fix:** Add `</div>` after the Quick Guide table's parent div and before the `</div>` that closes `dark-container`.

### 🔢 Statistics & Numbers to Update

#### 1. Web Server Market Share — SLIGHTLY OFF
- **Slide:** "Popular Web Servers" (`#popular-servers`)
- **Current text:** Nginx `~34% market share`, Apache `~30% market share`
- **Reality (2025-2026):** Varies by source. W3Techs (April 2025): Nginx 33.8%, Apache 26.4%. Netcraft (Aug 2025): Nginx 23.9%, Apache 13.6%. The ~34% Nginx figure is reasonable. The **~30% Apache figure is high** — most 2025-2026 sources put Apache at 24-27%.
- **Fix:** Update Apache to `~26% market share` or use a range: `~25-30% market share`.

#### 2. User-Agent String — OUTDATED
- **Slide:** "How the Web Works" (HTTP details box)
- **Current text:** `User-Agent: Chrome/120.0`
- **Reality:** Chrome 120 was released December 2023. As of early 2026, Chrome is around version 133+.
- **Fix:** Update to `Chrome/133.0` or use a generic placeholder like `Chrome/1xx.0`.

### ⚠️ Deprecated Technology — HTTP/2 Server Push

- **Slide:** "HTTP Protocol Deep Dive"
- **Current text:** `"HTTP/2 Benefits: Header compression (HPACK), server push, stream prioritization, single connection multiplexing"`
- **Issue:** **HTTP/2 Server Push is deprecated and effectively dead.** Chrome disabled it in v106 (October 2022), Firefox removed it entirely in v132 (October 2024). No mainstream browser supports it as of 2026.
- **Fix:** Remove "server push" from the benefits list. Replace with "multiplexed streams" or mention that Early Hints (103) is the modern replacement. Could also note its deprecation as a teaching moment about how web standards evolve.

### 🎙️ Narration Quality

Narrations are consistently strong and instructive:

- **HTTP Deep Dive:** `"It's stateless—each request is independent, and the server doesn't remember previous requests. This simplifies server design but means we need cookies or tokens to track user sessions."` — Great at explaining the *why* behind the *what*. ✅

- **Status Codes:** `"4xx errors mean the client did something wrong... 5xx errors are server problems"` — Clear mental model. ✅

- **Security narration:** `"HTTPS uses TLS—Transport Layer Security—to encrypt all communication between client and server. The TLS handshake is a dance..."` — Metaphor makes abstract concept approachable. ✅

- **Choosing a Stack:** `"Start with your team's expertise—learning a new language takes time that could be spent building features."` — Practical wisdom. ✅

One minor note: The "Popular Web Servers" narration says `"Nginx uses an event-driven architecture that excels at handling many concurrent connections"` — technically accurate and clear. No issues.

### 📎 External Links

Module 2 has **no external hyperlinks** in the slide content. The Resources slide mentions "MDN Web Docs," "web.dev," "GitHub Pages Docs," and "HTTP/2 Explained" but only as text labels, not clickable links.
- **Suggestion:** Add actual URLs to the Resources slide for student convenience.

### 🧪 Code Examples — Technical Accuracy

#### HTTP Request/Response Example
```
GET /index.html HTTP/1.1
Host: www.example.com
Accept: text/html
User-Agent: Chrome/120.0
```
- Technically accurate format ✅
- Chrome version outdated (see above) ⚠️

#### Git Commands in Assignment
```bash
git init
git add .
git commit -m "Initial commit: resume website"
git remote add origin git@github.com:yourusername/resume-website.git
git push -u origin main
```
- ✅ Correct sequence. Uses `-u` flag for first push which is proper. SSH URL is consistent with Module 1's SSH setup.

### 📋 Content Accuracy Notes

1. **HTTP Methods slide** correctly identifies:
   - GET, PUT, DELETE as idempotent ✅
   - POST as not idempotent ✅
   - GET, HEAD, OPTIONS as safe ✅
   - GET, HEAD as cacheable ✅
   - PATCH described as "partial update" ✅

2. **TLS Handshake** — The 4-step description is simplified but accurate for teaching purposes. Modern TLS 1.3 reduces the handshake to fewer round trips, which could be mentioned as an enhancement.

3. **JAMstack naming** — The original "JAMstack" branding has been somewhat de-emphasized by Netlify (who coined it) in favor of just "Jamstack." Either is acceptable but worth noting.

4. **GitHub Pages limitations** — `"1GB storage, 100GB bandwidth/month"` — ✅ Still accurate as of 2026.

5. **Remix** is listed as React-based — ✅ Correct (though Remix merged with React Router v7 in late 2024, which is worth mentioning if the course goes deep on frameworks).

### 📐 Assignment Review

The Module 2 assignment (Static HTML Resume to GitHub Pages) is well-designed:
- Clear 100-point rubric (30 + 30 + 20 + 20)
- Requires 5 linked HTML pages — appropriate scope
- Peer review component (discussion board) encourages collaboration
- Git commands provided for deployment

**One concern:** The assignment mentions "Extra credit for creative effects (hover states, styled buttons, tabs)" but doesn't specify how much extra credit or a maximum score, which could cause grading ambiguity.

---

## Summary of Required Fixes

### Critical (Broken/Wrong)
| # | Module | Issue | Location |
|---|--------|-------|----------|
| 1 | Mod 2 | Missing `</div>` closing tag | "Choosing a Tech Stack" slide (~line 1465) |
| 2 | Mod 2 | HTTP/2 Server Push listed as benefit — **deprecated/dead** | "HTTP Protocol Deep Dive" slide |
| 3 | Mod 1 | "Next Module" teaser says HTML/CSS — Module 2 is Web Foundations | Summary slide + Questions slide |

### Important (Outdated Info)
| # | Module | Issue | Location |
|---|--------|-------|----------|
| 4 | Mod 1 | npm "1M+ packages" → should be ~2M+ or "millions" | "What is Node.js?" slide |
| 5 | Mod 1 | GitHub "100 million developers" → 180+ million | GitHub Introduction slide |
| 6 | Mod 1 | Node 20.x minimum → EOL April 2026; bump to 22.x | Assignment table |
| 7 | Mod 2 | Apache "~30% market share" → ~26% | "Popular Web Servers" slide |
| 8 | Mod 2 | `User-Agent: Chrome/120.0` → ~133+ | "How the Web Works" HTTP details |

### Minor (Polish)
| # | Module | Issue | Location |
|---|--------|-------|----------|
| 9 | Mod 1 | Node expected version comment: add v24.x.x option | "Verify Installation" slide |
| 10 | Mod 1 | `guides.github.com` URL may redirect | Resources slide |
| 11 | Mod 1 | Consider showing ESM `import` alongside `require()` | Assignment Express code |
| 12 | Mod 2 | Resources slide has no clickable links | Resources slide |
| 13 | Mod 2 | Extra credit grading unclear in assignment | Assignment slide |
| 14 | Mod 1 | YouTube video links should be verified as still public | VS Code + Git tutorial slides |

---

## What's Working Well

- **Narration coverage:** 100% on both modules — every single slide has instructor narration
- **Narration tone:** Natural, authoritative, encouraging — sounds like a real professor, not a textbook
- **Visual design:** Dark theme is modern, consistent, and accessible
- **Assignment scaffolding:** Step-by-step with OS-specific instructions, troubleshooting section, and clear deliverables
- **Pedagogical flow:** Both modules build concepts progressively — never assumes knowledge that hasn't been introduced
- **Security emphasis:** Module 2 rightfully treats security as non-negotiable, not an afterthought
- **Practical focus:** Both modules connect tools/concepts to real-world professional usage

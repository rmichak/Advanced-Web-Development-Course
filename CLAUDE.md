# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML slide presentation system for an Advanced Web Development course (IT431). It contains 14 course modules presented as accessible, keyboard-navigable slideshows.

## Running the Project

Serve with any static HTTP server from the project root:
```bash
python3 -m http.server 8080
```
Then open http://localhost:8080

## Architecture

**No build system or dependencies** - pure vanilla HTML, CSS, and JavaScript.

### File Structure
- `index.html` - Course landing page with module cards
- `modules/module-XX.html` - Individual module slideshows (01-14)
- `css/slides.css` - Slide presentation styles
- `js/slides.js` - `AccessibleSlidePresentation` class

### Slide System

Each module file contains a `<div class="presentation">` with `<section class="slide">` elements. The JavaScript automatically:
- Generates left sidebar navigation from slide headings
- Creates bottom controls (progress bar, prev/next buttons)
- Enables keyboard navigation (arrow keys, Home/End, 1-9, ?)
- Supports URL hash navigation (`#slide-N` or named anchors)
- Announces changes to screen readers via ARIA live regions

### Slide Types
- `.slide.title-slide` - Section headers with gradient background
- `.slide` - Regular content slides

### Content Components
Use these CSS classes in slides:
- `.two-column` - Grid layout for side-by-side content
- `.highlight-box` - Blue-bordered callout box
- `.warning-box` - Yellow warning callout
- `.info-box` - Blue info callout
- `<pre><code>` - Code blocks with syntax highlighting classes

## Creating New Modules

1. Copy an existing module file as template
2. Update the `<title>` and title slide content
3. Add slides as `<section class="slide">` elements
4. Give slides `id` attributes for deep linking
5. Update `index.html` to change module status from "Coming Soon" to "Available"

## Accessibility

The system is WCAG 2.1 AA compliant:
- Skip links, focus indicators, screen reader announcements
- Respects `prefers-reduced-motion` and `prefers-contrast: high`
- All interactive elements are keyboard accessible

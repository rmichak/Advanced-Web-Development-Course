import { createHash } from 'crypto';

const GITHUB_API = 'https://api.github.com';

/**
 * Vercel Serverless Function: Save edited narration text to GitHub
 *
 * Receives updated narration text, updates the module HTML file's
 * data-narration attribute, and optionally marks the audio as outdated.
 *
 * Environment variables required:
 *   GITHUB_TOKEN   — GitHub PAT with repo write access
 *   GITHUB_REPO    — e.g. "rmichak/Advanced-Web-Development-Course"
 *   STUDIO_SECRET  — Simple auth token for the studio
 */

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
};

async function githubApi(repo, path, options = {}) {
    const token = process.env.GITHUB_TOKEN;
    const url = `${GITHUB_API}/repos/${repo}${path}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub ${res.status}: ${text.substring(0, 200)}`);
    }

    return res.json();
}

/**
 * Escape text for safe use inside an HTML attribute (double-quoted).
 */
function escapeForAttribute(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Find and replace the data-narration attribute for the Nth slide
 * (1-indexed) in the HTML content.
 *
 * Slides are <section> elements with class "slide" (may have additional classes).
 * We match them in order and replace the Nth one's data-narration value.
 */
function replaceNarration(html, slideIndex, newNarration) {
    // Match all <section ... class="...slide..." ... data-narration="..."> patterns
    // We need to find the Nth <section that has class containing "slide" and a data-narration attribute
    const sectionRegex = /<section\b[^>]*\bclass="[^"]*\bslide\b[^"]*"[^>]*>/g;
    
    let match;
    let count = 0;
    
    while ((match = sectionRegex.exec(html)) !== null) {
        count++;
        if (count === slideIndex) {
            const fullTag = match[0];
            
            // Check if this tag has data-narration
            const narrationMatch = fullTag.match(/data-narration="([^"]*)"/);
            if (!narrationMatch) {
                // Tag doesn't have data-narration — add it
                const escapedText = escapeForAttribute(newNarration);
                const newTag = fullTag.replace(/>$/, ` data-narration="${escapedText}">`);
                return {
                    html: html.substring(0, match.index) + newTag + html.substring(match.index + fullTag.length),
                    oldNarration: '',
                    found: true,
                };
            }
            
            // Replace the existing data-narration value
            const escapedText = escapeForAttribute(newNarration);
            const newTag = fullTag.replace(
                /data-narration="[^"]*"/,
                `data-narration="${escapedText}"`
            );
            
            return {
                html: html.substring(0, match.index) + newTag + html.substring(match.index + fullTag.length),
                oldNarration: narrationMatch[1],
                found: true,
            };
        }
    }
    
    return { html, oldNarration: null, found: false };
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Studio-Secret');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Auth check
    const secret = process.env.STUDIO_SECRET;
    if (secret && req.headers['x-studio-secret'] !== secret) {
        return res.status(401).json({ error: 'Invalid studio secret' });
    }

    const REPO = process.env.GITHUB_REPO;
    if (!process.env.GITHUB_TOKEN || !REPO) {
        return res.status(500).json({ error: 'Server not configured: missing GITHUB_TOKEN or GITHUB_REPO' });
    }

    const { module: moduleName, slide, narration } = req.body;

    if (!moduleName || !slide || typeof narration !== 'string') {
        return res.status(400).json({ error: 'Missing required fields: module, slide, narration' });
    }

    if (!/^module-\d{2}$/.test(moduleName)) {
        return res.status(400).json({ error: 'Invalid module format' });
    }

    const slideNum = parseInt(slide, 10);
    if (isNaN(slideNum) || slideNum < 1) {
        return res.status(400).json({ error: 'Invalid slide number' });
    }

    const modulePath = `modules/${moduleName}.html`;
    const manifestPath = 'audio/manifest.json';
    const paddedSlide = String(slideNum).padStart(2, '0');
    const manifestKey = `${moduleName}/slide-${paddedSlide}.mp3`;

    // Compute new text hash
    const newTextHash = narration
        ? createHash('sha256').update(narration).digest('hex')
        : null;

    try {
        // Step 1: Fetch the module HTML from GitHub
        const moduleRes = await githubApi(REPO, `/contents/${modulePath}`);
        const moduleHtml = Buffer.from(moduleRes.content, 'base64').toString('utf-8');

        // Step 2: Replace the narration text for the target slide
        const result = replaceNarration(moduleHtml, slideNum, narration);

        if (!result.found) {
            return res.status(404).json({
                error: `Slide ${slideNum} not found in ${moduleName}.html`,
            });
        }

        // Step 3: Commit the updated module HTML
        await githubApi(REPO, `/contents/${modulePath}`, {
            method: 'PUT',
            body: JSON.stringify({
                message: `✏️ Edit narration: ${moduleName} slide ${slideNum}`,
                content: Buffer.from(result.html).toString('base64'),
                sha: moduleRes.sha,
                branch: 'main',
            }),
        });

        // Step 4: Update manifest if a recording exists for this slide
        let manifestUpdated = false;
        try {
            const manifestRes = await githubApi(REPO, `/contents/${manifestPath}`);
            const manifestContent = JSON.parse(
                Buffer.from(manifestRes.content, 'base64').toString('utf-8')
            );

            if (manifestContent.generated && manifestContent.generated[manifestKey]) {
                // Recording exists — do NOT update textHash.
                // The existing textHash reflects the text at recording time.
                // Since the narration text just changed, the old textHash will
                // naturally mismatch the new text → studio shows ⚠️ outdated.
                // We only add a textEditedAt timestamp for tracking.
                const entry = manifestContent.generated[manifestKey];
                if (typeof entry === 'object') {
                    entry.textEditedAt = new Date().toISOString();
                } else {
                    // Legacy string entry — convert to object, preserve old hash
                    manifestContent.generated[manifestKey] = {
                        textHash: entry, // preserve the original hash
                        textEditedAt: new Date().toISOString(),
                    };
                }

                const updatedManifest = JSON.stringify(manifestContent, null, 2);
                await githubApi(REPO, `/contents/${manifestPath}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        message: `📋 Update manifest after text edit: ${moduleName} slide ${slideNum}`,
                        content: Buffer.from(updatedManifest).toString('base64'),
                        sha: manifestRes.sha,
                        branch: 'main',
                    }),
                });
                manifestUpdated = true;
            }
        } catch (err) {
            // Manifest doesn't exist or failed — not critical
            console.warn('Manifest update skipped:', err.message);
        }

        return res.json({
            success: true,
            textHash: newTextHash,
            manifestUpdated,
            message: `Narration updated for ${moduleName} slide ${slideNum}. Vercel will redeploy automatically.`,
        });

    } catch (error) {
        console.error('Save text error:', error);
        return res.status(500).json({
            error: 'Failed to save: ' + error.message,
        });
    }
}

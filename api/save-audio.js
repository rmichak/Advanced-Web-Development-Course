import { createHash } from 'crypto';

const GITHUB_API = 'https://api.github.com';

/**
 * Vercel Serverless Function: Save recorded audio to GitHub
 *
 * Receives MP3 audio (base64), commits it + updated manifest to the repo.
 * This triggers a Vercel redeploy so the new audio becomes available.
 *
 * Environment variables required:
 *   GITHUB_TOKEN   — GitHub PAT with repo write access
 *   GITHUB_REPO    — e.g. "rmichak/Advanced-Web-Development-Course"
 *   STUDIO_SECRET  — Simple auth token for the studio
 */

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '6mb',
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

export default async function handler(req, res) {
    // CORS headers for Vercel preview deployments
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

    const { module: moduleName, slide, narration, audio } = req.body;

    if (!moduleName || !slide || !audio) {
        return res.status(400).json({ error: 'Missing required fields: module, slide, audio' });
    }

    if (!/^module-\d{2}$/.test(moduleName)) {
        return res.status(400).json({ error: 'Invalid module format' });
    }

    const slideNum = parseInt(slide, 10);
    if (isNaN(slideNum) || slideNum < 1) {
        return res.status(400).json({ error: 'Invalid slide number' });
    }

    const paddedSlide = String(slideNum).padStart(2, '0');
    const audioFilePath = `audio/${moduleName}/slide-${paddedSlide}.mp3`;
    const manifestPath = 'audio/manifest.json';
    const manifestKey = `${moduleName}/slide-${paddedSlide}.mp3`;

    // Compute text hash for change detection
    const textHash = narration
        ? createHash('sha256').update(narration).digest('hex')
        : null;

    try {
        // Step 1: Upload audio file to GitHub
        let audioSha = null;
        try {
            const existing = await githubApi(REPO, `/contents/${audioFilePath}`);
            audioSha = existing.sha;
        } catch {
            // File doesn't exist yet — fine
        }

        const audioPut = {
            message: `🎙️ Record ${moduleName} slide ${slideNum}`,
            content: audio, // Already base64 from client
            branch: 'main',
        };
        if (audioSha) audioPut.sha = audioSha;

        await githubApi(REPO, `/contents/${audioFilePath}`, {
            method: 'PUT',
            body: JSON.stringify(audioPut),
        });

        // Step 2: Update manifest
        const manifestRes = await githubApi(REPO, `/contents/${manifestPath}`);
        const manifestContent = JSON.parse(
            Buffer.from(manifestRes.content, 'base64').toString('utf-8')
        );

        manifestContent.generated[manifestKey] = {
            custom: true,
            recordedAt: new Date().toISOString(),
            textHash: textHash,
        };

        const updatedManifest = JSON.stringify(manifestContent, null, 2);
        await githubApi(REPO, `/contents/${manifestPath}`, {
            method: 'PUT',
            body: JSON.stringify({
                message: `📋 Update manifest: ${moduleName} slide ${slideNum}`,
                content: Buffer.from(updatedManifest).toString('base64'),
                sha: manifestRes.sha,
                branch: 'main',
            }),
        });

        return res.json({
            success: true,
            path: audioFilePath,
            message: 'Audio committed to GitHub. Vercel will redeploy automatically.',
        });

    } catch (error) {
        console.error('Save error:', error);
        return res.status(500).json({
            error: 'Failed to save: ' + error.message,
        });
    }
}

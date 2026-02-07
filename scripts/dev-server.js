#!/usr/bin/env node
/**
 * Development server with audio recording and narration editing support
 *
 * Features:
 * - Serves static files from project root
 * - Handles audio upload and conversion (WebM -> MP3)
 * - Updates manifest to protect custom recordings
 * - Edit and save instructor notes directly to HTML files
 * - Generate audio via ElevenLabs API
 *
 * Usage: npm run dev
 * Requires: ffmpeg installed (brew install ffmpeg)
 */

import express from 'express';
import { load } from 'cheerio';
import { config } from 'dotenv';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const MODULES_DIR = join(ROOT_DIR, 'modules');
const AUDIO_DIR = join(ROOT_DIR, 'audio');
const MANIFEST_PATH = join(AUDIO_DIR, 'manifest.json');

// Load environment variables
config({ path: join(ROOT_DIR, '.env') });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel

const app = express();
const PORT = 8080;

// Serve static files from project root
app.use(express.static(ROOT_DIR));

// Parse JSON body
app.use(express.json({ limit: '1mb' }));

// Parse raw audio data
app.use(express.raw({ type: 'audio/*', limit: '50mb' }));

/**
 * Load manifest file
 */
function loadManifest() {
    if (existsSync(MANIFEST_PATH)) {
        return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    }
    return { generated: {} };
}

/**
 * Save manifest file
 */
function saveManifest(manifest) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

/**
 * Check if ffmpeg is available
 */
function checkFfmpeg() {
    try {
        execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate hash of narration text for change detection
 */
function hashText(text) {
    return createHash('md5').update(text).digest('hex');
}

/**
 * POST /api/save-audio
 * Receives WebM audio, converts to MP3, saves to audio folder
 * Query params: module (e.g., "module-01"), slide (e.g., "5")
 */
app.post('/api/save-audio', (req, res) => {
    const { module: moduleName, slide } = req.query;

    // Validate parameters
    if (!moduleName || !slide) {
        return res.status(400).json({
            error: 'Missing required parameters: module and slide'
        });
    }

    // Validate module format
    if (!/^module-\d{2}$/.test(moduleName)) {
        return res.status(400).json({
            error: 'Invalid module format. Expected: module-XX'
        });
    }

    // Validate slide number
    const slideNum = parseInt(slide, 10);
    if (isNaN(slideNum) || slideNum < 1) {
        return res.status(400).json({
            error: 'Invalid slide number'
        });
    }

    // Check ffmpeg
    if (!checkFfmpeg()) {
        return res.status(500).json({
            error: 'ffmpeg not found. Install with: brew install ffmpeg'
        });
    }

    // Ensure audio directory exists
    const moduleAudioDir = join(AUDIO_DIR, moduleName);
    if (!existsSync(moduleAudioDir)) {
        mkdirSync(moduleAudioDir, { recursive: true });
    }

    // File paths
    const paddedSlide = String(slideNum).padStart(2, '0');
    const tempWebmPath = join(moduleAudioDir, `slide-${paddedSlide}.temp.webm`);
    const mp3Path = join(moduleAudioDir, `slide-${paddedSlide}.mp3`);
    const manifestKey = `${moduleName}/slide-${paddedSlide}.mp3`;

    try {
        // Write WebM to temp file
        writeFileSync(tempWebmPath, req.body);

        // Convert WebM to MP3 using ffmpeg (using execFileSync for safety)
        execFileSync('ffmpeg', [
            '-y',
            '-i', tempWebmPath,
            '-codec:a', 'libmp3lame',
            '-qscale:a', '2',
            mp3Path
        ], { stdio: 'ignore' });

        // Clean up temp file
        unlinkSync(tempWebmPath);

        // Update manifest to mark as custom recording (with text hash for change detection)
        const manifest = loadManifest();
        manifest.generated[manifestKey] = {
            custom: true,
            recordedAt: new Date().toISOString(),
            textHash: req.query.textHash || null
        };
        saveManifest(manifest);

        console.log(`Saved custom recording: ${manifestKey}`);

        res.json({
            success: true,
            path: manifestKey,
            message: 'Audio saved successfully'
        });

    } catch (error) {
        // Clean up temp file if it exists
        if (existsSync(tempWebmPath)) {
            try { unlinkSync(tempWebmPath); } catch {}
        }

        console.error('Error saving audio:', error.message);
        res.status(500).json({
            error: 'Failed to save audio: ' + error.message
        });
    }
});

/**
 * POST /api/save-narration
 * Updates the data-narration attribute in the HTML file
 * Query params: module (e.g., "module-01"), slide (e.g., "5")
 * Body: { narration: "new narration text" }
 */
app.post('/api/save-narration', (req, res) => {
    const { module: moduleName, slide } = req.query;
    const { narration } = req.body;

    // Validate parameters
    if (!moduleName || !slide) {
        return res.status(400).json({
            error: 'Missing required parameters: module and slide'
        });
    }

    // Validate module format
    if (!/^module-\d{2}$/.test(moduleName)) {
        return res.status(400).json({
            error: 'Invalid module format. Expected: module-XX'
        });
    }

    // Validate slide number
    const slideNum = parseInt(slide, 10);
    if (isNaN(slideNum) || slideNum < 1) {
        return res.status(400).json({
            error: 'Invalid slide number'
        });
    }

    if (typeof narration !== 'string') {
        return res.status(400).json({
            error: 'Missing narration text in request body'
        });
    }

    const modulePath = join(MODULES_DIR, `${moduleName}.html`);

    if (!existsSync(modulePath)) {
        return res.status(404).json({
            error: `Module file not found: ${moduleName}.html`
        });
    }

    try {
        let html = readFileSync(modulePath, 'utf-8');

        // Find the slide by counting <section class="slide"> elements
        // We need to find the Nth occurrence and update its data-narration
        let slideCount = 0;
        let updated = false;

        // Regex to match slide sections with or without data-narration
        const slideRegex = /<section\s+class="slide[^"]*"([^>]*)>/g;
        let match;
        let lastIndex = 0;
        let result = '';

        while ((match = slideRegex.exec(html)) !== null) {
            slideCount++;

            if (slideCount === slideNum) {
                // Found the target slide
                const beforeSlide = html.substring(lastIndex, match.index);
                const fullMatch = match[0];
                const attributes = match[1];

                // Build the new opening tag
                let newTag;
                const escapedNarration = narration
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                if (attributes.includes('data-narration=')) {
                    // Replace existing data-narration
                    const newAttributes = attributes.replace(
                        /data-narration="[^"]*"/,
                        `data-narration="${escapedNarration}"`
                    );
                    newTag = `<section class="slide${fullMatch.includes('title-slide') ? ' title-slide' : ''}"${newAttributes}>`;
                } else {
                    // Add new data-narration attribute
                    newTag = fullMatch.replace(/>$/, ` data-narration="${escapedNarration}">`);
                }

                result += beforeSlide + newTag;
                lastIndex = slideRegex.lastIndex;
                updated = true;
            }
        }

        if (!updated) {
            return res.status(404).json({
                error: `Slide ${slideNum} not found in ${moduleName}.html (found ${slideCount} slides)`
            });
        }

        // Add the rest of the file
        result += html.substring(lastIndex);

        // Write the updated HTML
        writeFileSync(modulePath, result, 'utf-8');

        console.log(`Updated narration: ${moduleName} slide ${slideNum}`);

        res.json({
            success: true,
            message: 'Narration saved successfully'
        });

    } catch (error) {
        console.error('Error saving narration:', error.message);
        res.status(500).json({
            error: 'Failed to save narration: ' + error.message
        });
    }
});

/**
 * POST /api/generate-audio
 * Generates audio using ElevenLabs API
 * Query params: module (e.g., "module-01"), slide (e.g., "5")
 * Body: { text: "narration text to convert to speech" }
 */
app.post('/api/generate-audio', async (req, res) => {
    const { module: moduleName, slide } = req.query;
    const { text } = req.body;

    // Check API key
    if (!API_KEY) {
        return res.status(500).json({
            error: 'ElevenLabs API key not configured in .env'
        });
    }

    // Validate parameters
    if (!moduleName || !slide) {
        return res.status(400).json({
            error: 'Missing required parameters: module and slide'
        });
    }

    // Validate module format
    if (!/^module-\d{2}$/.test(moduleName)) {
        return res.status(400).json({
            error: 'Invalid module format. Expected: module-XX'
        });
    }

    // Validate slide number
    const slideNum = parseInt(slide, 10);
    if (isNaN(slideNum) || slideNum < 1) {
        return res.status(400).json({
            error: 'Invalid slide number'
        });
    }

    if (!text || typeof text !== 'string') {
        return res.status(400).json({
            error: 'Missing text in request body'
        });
    }

    // Ensure audio directory exists
    const moduleAudioDir = join(AUDIO_DIR, moduleName);
    if (!existsSync(moduleAudioDir)) {
        mkdirSync(moduleAudioDir, { recursive: true });
    }

    const paddedSlide = String(slideNum).padStart(2, '0');
    const mp3Path = join(moduleAudioDir, `slide-${paddedSlide}.mp3`);
    const manifestKey = `${moduleName}/slide-${paddedSlide}.mp3`;

    try {
        console.log(`Generating audio: ${manifestKey}...`);

        // Call ElevenLabs API
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': API_KEY,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
        }

        // Save the audio file
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        writeFileSync(mp3Path, audioBuffer);

        // Update manifest with hash (not custom)
        const manifest = loadManifest();
        manifest.generated[manifestKey] = hashText(text);
        saveManifest(manifest);

        console.log(`Generated audio: ${manifestKey}`);

        res.json({
            success: true,
            path: manifestKey,
            message: 'Audio generated successfully'
        });

    } catch (error) {
        console.error('Error generating audio:', error.message);
        res.status(500).json({
            error: 'Failed to generate audio: ' + error.message
        });
    }
});

/**
 * GET /api/modules
 * Returns list of available modules with slide counts
 */
app.get('/api/modules', (req, res) => {
    const modules = [];
    for (let i = 1; i <= 14; i++) {
        const paddedNum = String(i).padStart(2, '0');
        const moduleName = `module-${paddedNum}`;
        const modulePath = join(MODULES_DIR, `${moduleName}.html`);
        if (existsSync(modulePath)) {
            const html = readFileSync(modulePath, 'utf-8');
            const $ = load(html);
            const slideCount = $('section.slide, .slide').length;
            if (slideCount <= 2) continue; // Skip placeholder modules

            const titleSlide = $('.slide.title-slide').first();
            const subtitle = titleSlide.find('.subtitle').text();
            const h1 = titleSlide.find('h1').text();
            const title = subtitle || h1 || `Module ${i}`;

            // Count audio status
            const manifest = loadManifest();
            let recorded = 0;
            for (let s = 1; s <= slideCount; s++) {
                const key = `${moduleName}/slide-${String(s).padStart(2, '0')}.mp3`;
                const audioPath = join(AUDIO_DIR, moduleName, `slide-${String(s).padStart(2, '0')}.mp3`);
                if (existsSync(audioPath) && manifest.generated[key]) recorded++;
            }

            modules.push({
                name: moduleName,
                number: i,
                title: title,
                slideCount: slideCount,
                recorded: recorded
            });
        }
    }
    res.json({ modules });
});

/**
 * GET /api/slides
 * Returns slide data with narration text and audio status for a module
 * Query params: module (e.g., "module-01")
 */
app.get('/api/slides', (req, res) => {
    const { module: moduleName } = req.query;

    if (!moduleName) {
        return res.status(400).json({ error: 'Missing module parameter' });
    }
    if (!/^module-\d{2}$/.test(moduleName)) {
        return res.status(400).json({ error: 'Invalid module format. Expected: module-XX' });
    }

    const modulePath = join(MODULES_DIR, `${moduleName}.html`);
    if (!existsSync(modulePath)) {
        return res.status(404).json({ error: 'Module not found' });
    }

    try {
        const html = readFileSync(modulePath, 'utf-8');
        const $ = load(html);
        const manifest = loadManifest();
        const slides = [];

        $('section.slide, .slide').each((index, element) => {
            const slideNum = index + 1;
            const paddedSlide = String(slideNum).padStart(2, '0');
            const manifestKey = `${moduleName}/slide-${paddedSlide}.mp3`;
            const audioPath = join(AUDIO_DIR, moduleName, `slide-${paddedSlide}.mp3`);

            const narration = $(element).attr('data-narration') || '';
            const titleEl = $(element).find('h1, h2').first();
            const title = titleEl.text() || `Slide ${slideNum}`;
            const isTitle = $(element).hasClass('title-slide');
            const currentHash = narration ? hashText(narration) : null;

            // Check manifest entry
            const manifestEntry = manifest.generated[manifestKey];
            const audioExists = existsSync(audioPath);

            let audioStatus = 'none';
            let isCustom = false;
            let recordedAt = null;
            let storedHash = null;

            if (audioExists && manifestEntry) {
                if (typeof manifestEntry === 'object') {
                    isCustom = manifestEntry.custom || false;
                    recordedAt = manifestEntry.recordedAt || null;
                    storedHash = manifestEntry.textHash || null;
                } else {
                    // String = MD5 hash from ElevenLabs generation
                    storedHash = manifestEntry;
                }

                if (!currentHash) {
                    audioStatus = 'current'; // No narration text = nothing to compare
                } else if (storedHash && currentHash === storedHash) {
                    audioStatus = 'current';
                } else if (storedHash) {
                    audioStatus = 'outdated';
                } else {
                    audioStatus = 'unverified';
                }
            }

            slides.push({
                number: slideNum,
                title: title.trim(),
                isTitle: isTitle,
                narration: narration,
                textHash: currentHash,
                audio: {
                    exists: audioExists,
                    status: audioStatus,
                    isCustom: isCustom,
                    recordedAt: recordedAt,
                    path: `audio/${moduleName}/slide-${paddedSlide}.mp3`
                }
            });
        });

        const recorded = slides.filter(s => s.audio.exists && s.audio.status === 'current').length;
        const outdated = slides.filter(s => s.audio.status === 'outdated' || s.audio.status === 'unverified').length;
        const unrecorded = slides.filter(s => !s.audio.exists || s.audio.status === 'none').length;

        res.json({
            module: moduleName,
            totalSlides: slides.length,
            recorded,
            outdated,
            unrecorded,
            slides
        });

    } catch (error) {
        console.error('Error loading slides:', error.message);
        res.status(500).json({ error: 'Failed to load slides: ' + error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n  Development server running at http://localhost:${PORT}`);
    console.log(`  Features enabled:`);
    console.log(`    - Audio recording (requires ffmpeg)`);
    console.log(`    - Narration editing (click notes panel)`);
    console.log(`    - ElevenLabs TTS generation\n`);

    if (!checkFfmpeg()) {
        console.log('  Warning: ffmpeg not found. Recording will not work.');
        console.log('  Install with: brew install ffmpeg\n');
    }

    if (!API_KEY) {
        console.log('  Warning: ELEVENLABS_API_KEY not found in .env');
        console.log('  TTS generation will not work without it.\n');
    }
});

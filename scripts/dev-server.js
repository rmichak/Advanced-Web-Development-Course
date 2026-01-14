#!/usr/bin/env node
/**
 * Development server with audio recording support
 *
 * Features:
 * - Serves static files from project root
 * - Handles audio upload and conversion (WebM -> MP3)
 * - Updates manifest to protect custom recordings
 *
 * Usage: npm run dev
 * Requires: ffmpeg installed (brew install ffmpeg)
 */

import express from 'express';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const AUDIO_DIR = join(ROOT_DIR, 'audio');
const MANIFEST_PATH = join(AUDIO_DIR, 'manifest.json');

const app = express();
const PORT = 8080;

// Serve static files from project root
app.use(express.static(ROOT_DIR));

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

        // Update manifest to mark as custom recording
        const manifest = loadManifest();
        manifest.generated[manifestKey] = {
            custom: true,
            recordedAt: new Date().toISOString()
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

// Start server
app.listen(PORT, () => {
    console.log(`\n  Development server running at http://localhost:${PORT}`);
    console.log(`  Recording feature: ENABLED\n`);

    if (!checkFfmpeg()) {
        console.log('  Warning: ffmpeg not found. Recording will not work.');
        console.log('  Install with: brew install ffmpeg\n');
    }
});

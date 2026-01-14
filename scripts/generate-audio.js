#!/usr/bin/env node
/**
 * Generate audio files from slide narrations using ElevenLabs API
 *
 * Usage:
 *   node scripts/generate-audio.js 5        # Generate for module 5 only
 *   node scripts/generate-audio.js --all    # Generate for all modules
 *   node scripts/generate-audio.js          # Interactive mode
 */

import { load } from 'cheerio';
import { config } from 'dotenv';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Setup paths
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

// ANSI colors for terminal output
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

/**
 * Load or create manifest for tracking generated audio
 */
function loadManifest() {
    if (existsSync(MANIFEST_PATH)) {
        return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    }
    return { generated: {} };
}

function saveManifest(manifest) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

/**
 * Generate hash of narration text for change detection
 */
function hashText(text) {
    return createHash('md5').update(text).digest('hex');
}

/**
 * Extract narrations from a module HTML file
 */
function extractNarrations(modulePath) {
    const html = readFileSync(modulePath, 'utf-8');
    const $ = load(html);
    const narrations = [];

    $('.slide').each((index, element) => {
        const narration = $(element).attr('data-narration');
        narrations.push({
            slideNum: index + 1,
            text: narration || '',
            hash: narration ? hashText(narration) : null,
        });
    });

    return narrations;
}

/**
 * Call ElevenLabs API to generate audio
 */
async function generateAudio(text) {
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
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

/**
 * Process a single module
 */
async function processModule(moduleNum, manifest) {
    const paddedNum = String(moduleNum).padStart(2, '0');
    const moduleName = `module-${paddedNum}`;
    const modulePath = join(MODULES_DIR, `${moduleName}.html`);

    if (!existsSync(modulePath)) {
        console.log(colors.yellow(`⚠ ${moduleName}.html not found, skipping`));
        return { generated: 0, skipped: 0, noNarration: 0 };
    }

    console.log(`\nProcessing ${moduleName}...`);

    // Create audio directory for this module
    const moduleAudioDir = join(AUDIO_DIR, moduleName);
    if (!existsSync(moduleAudioDir)) {
        mkdirSync(moduleAudioDir, { recursive: true });
    }

    const narrations = extractNarrations(modulePath);
    let generated = 0;
    let skipped = 0;
    let noNarration = 0;

    for (const { slideNum, text, hash } of narrations) {
        const paddedSlide = String(slideNum).padStart(2, '0');
        const audioFile = `slide-${paddedSlide}.mp3`;
        const audioPath = join(moduleAudioDir, audioFile);
        const manifestKey = `${moduleName}/${audioFile}`;

        // Skip if no narration
        if (!text) {
            console.log(colors.dim(`  ○ ${audioFile} (no narration)`));
            noNarration++;
            continue;
        }

        // Get manifest entry (handles both old string format and new object format)
        const manifestEntry = manifest.generated[manifestKey];
        const entryHash = typeof manifestEntry === 'string' ? manifestEntry : manifestEntry?.hash;
        const isCustom = typeof manifestEntry === 'object' && manifestEntry?.custom;

        // Skip if this is a custom recording (user recorded their own voice)
        if (isCustom) {
            console.log(colors.yellow(`  ⊘ ${audioFile} (custom recording - skipped)`));
            skipped++;
            continue;
        }

        // Skip if already generated and unchanged
        if (entryHash === hash && existsSync(audioPath)) {
            console.log(colors.dim(`  ○ ${audioFile} (unchanged)`));
            skipped++;
            continue;
        }

        // Generate audio
        try {
            process.stdout.write(`  ⏳ ${audioFile} generating...`);
            const audioBuffer = await generateAudio(text);
            writeFileSync(audioPath, audioBuffer);
            manifest.generated[manifestKey] = hash;
            console.log(`\r  ${colors.green('✓')} ${audioFile} (generated)`);
            generated++;

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
            console.log(`\r  ${colors.red('✗')} ${audioFile} (error: ${error.message})`);
        }
    }

    return { generated, skipped, noNarration };
}

/**
 * Main entry point
 */
async function main() {
    // Check for API key
    if (!API_KEY) {
        console.error(colors.red('Error: ELEVENLABS_API_KEY not found in .env file'));
        console.log('\nCreate a .env file with your API key:');
        console.log('  cp .env.example .env');
        console.log('  # Then edit .env and add your API key');
        process.exit(1);
    }

    // Ensure audio directory exists
    if (!existsSync(AUDIO_DIR)) {
        mkdirSync(AUDIO_DIR, { recursive: true });
    }

    const manifest = loadManifest();
    const args = process.argv.slice(2);

    let modules = [];

    if (args.includes('--all')) {
        // Generate for all modules (1-14)
        modules = Array.from({ length: 14 }, (_, i) => i + 1);
    } else if (args.length > 0 && !isNaN(args[0])) {
        // Generate for specific module
        modules = [parseInt(args[0], 10)];
    } else {
        // Show usage
        console.log('ElevenLabs Audio Generator for IT431 Slides\n');
        console.log('Usage:');
        console.log('  node scripts/generate-audio.js <module-number>');
        console.log('  node scripts/generate-audio.js --all\n');
        console.log('Examples:');
        console.log('  node scripts/generate-audio.js 5     # Generate module 5');
        console.log('  node scripts/generate-audio.js --all # Generate all modules');
        process.exit(0);
    }

    console.log(`Using voice: ${VOICE_ID}`);

    let totalGenerated = 0;
    let totalSkipped = 0;
    let totalNoNarration = 0;

    for (const moduleNum of modules) {
        const result = await processModule(moduleNum, manifest);
        totalGenerated += result.generated;
        totalSkipped += result.skipped;
        totalNoNarration += result.noNarration;
    }

    // Save manifest
    saveManifest(manifest);

    // Summary
    console.log('\n' + '─'.repeat(40));
    console.log(`Done: ${colors.green(totalGenerated + ' generated')}, ${totalSkipped} unchanged, ${totalNoNarration} no narration`);
}

main().catch((error) => {
    console.error(colors.red(`\nFatal error: ${error.message}`));
    process.exit(1);
});
